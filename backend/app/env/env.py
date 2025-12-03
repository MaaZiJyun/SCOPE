import math
import numpy as np
import logging
import os
from app.models.api_dict.pj import ProjectDict
from app.core.initialisation import build_static_objects, init_network, load_input_metadata
from app.env.vars.task import Task
import gymnasium as gym
from gymnasium import spaces
from typing import List
from app.env.io.decision_manager import DecisionManager
from app.env.io.state_manager import StateManager
from app.env.core.constraints import all_tasks_completed, all_tasks_overtimed, any_illegal_link, any_satellite_depleted
from app.config import ALL_TASK_COMPLETION_REWARD, ENERGY_DROWN_PENALTY, INTERRUPTION_PENALTY, LAYER_OUTPUT_DATA_SIZE, NO_ACTION_PENALTY, MAX_NUM_TASKS, OVERTIME_PENALTY, WRONG_EDGE_PENALTY, REPEAT_MOVE_THRESHOLD, REPEAT_MOVE_PENALTY_BASE, DEBUG, FIRST_COMPUTE_BONUS, REPEAT_MOVE_PENALTY_CAP, LOG_OUTPUT, SUSTAINED_COMPUTE_BONUS, BASE_MOVE_PENALTY
from app.env.core.entity_col import EntityCol
from app.env.core.task_manager import TaskManager
from app.env.vars.request import CompReq, TransReq
from app.env.core.formulation import compute_delay_penalty, compute_energy_penalty, settle_reward
from app.env.core.operation import do_computing, do_energy_updating, do_transferring
from app.env.core.observation import get_obs
from datetime import datetime, timedelta, timezone
from app.entities.earth_entity import EarthEntity
from app.entities.roi_entity import ROIEntity
from app.entities.sun_entity import SunEntity
from app.services.network_service import Network
from app.entities.satellite_entity import SatelliteEntity
from app.entities.station_entity import StationEntity
from app.models.api_dict.pj import ProjectDict

class LEOEnv(gym.Env):
    
    metadata = {"render_modes": ["human"]}

    def __init__(self, input: ProjectDict):
        super().__init__()
        # Setup logging
        self.logger = logging.getLogger("LEOEnv")
        self.logger.setLevel(logging.DEBUG if DEBUG else logging.INFO)
        if not self.logger.handlers:
            os.makedirs(LOG_OUTPUT, exist_ok=True)
            fh = logging.FileHandler(os.path.join(LOG_OUTPUT, "env.log"))
            fh.setLevel(logging.DEBUG if DEBUG else logging.INFO)
            fmt = logging.Formatter(fmt="%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
            fh.setFormatter(fmt)
            self.logger.addHandler(fh)
        
        self.input = input
        
        self.t_start: datetime = datetime.now(timezone.utc)
        self.max_simulation_period: timedelta = timedelta(hours=2)  # 最大仿真时间
        self.t_end: datetime = self.t_start + self.max_simulation_period
        
        self.period_in_num: float = 30
        self.period: timedelta = timedelta(seconds=self.period_in_num)  # 时间步长，默认30秒
        self.max_period_numbers: int = math.ceil(self.max_simulation_period.total_seconds() / self.period_in_num)
        
        self.slot_in_num: float = 0.5
        self.slot: timedelta = timedelta(seconds=self.slot_in_num)  # 时间步长，默认5秒
        self.max_slot_number: int = math.ceil(self.period_in_num / self.slot_in_num)

        self.time_recorder: datetime = self.t_start
        self.period_counter: int = 0
        self.slot_counter: int = 0
        self.frame_counter: int = 0
        
        self.net: Network = None
        
        self.datetime_list: list[datetime] = []
        
        # Entities
        self.sat: List[SatelliteEntity] = []
        self.gs: List[StationEntity] = []
        self.roi: List[ROIEntity] = []
        self.eth: EarthEntity = None
        self.sun: SunEntity = None
        
        # Data storages
        # self._roi_datas: List[dict] = []
        self._gs_datas: List[dict] = []
        self._sat_datas: List[dict] = []
        # self._eth_datas: List[dict] = []
        # self._sun_datas: List[dict] = []
        
        # Entities Managers
        self.EG = EntityCol(input)
        self.TM = TaskManager(self.EG)
        
        # Attributes Managers
        self.SM = StateManager(self.EG.N_PLANE, self.EG.N_SAT)
        self.DM = DecisionManager(self.EG.N_PLANE, self.EG.N_SAT)

        # 重复移动计数 (按任务 id)
        self.repeat_move_counts = {}
        
        # 初始化基本参数
        self.action_space = spaces.MultiDiscrete([6] * MAX_NUM_TASKS)

        # 初始化观察空间 based on manager max sizes (stable shape independent of current _M)
        p = self.SM.P_MAX
        o = self.SM.O_MAX
        n = self.SM.N_MAX
        m = self.SM.M_MAX

        obs_spaces = {
            "energy": spaces.Box(low=-np.inf, high=np.inf, shape=(p, o), dtype=np.float32),
            "sunlight": spaces.Box(low=-np.inf, high=np.inf, shape=(p, o), dtype=np.float32),
            "comm": spaces.Box(low=-np.inf, high=np.inf, shape=(p, o, p, o), dtype=np.float32),
            "location": spaces.Box(low=-np.inf, high=np.inf, shape=(m, 2), dtype=np.float32),
            "progress": spaces.Box(low=-np.inf, high=np.inf, shape=(m,), dtype=np.float32),
            "size": spaces.Box(low=-np.inf, high=np.inf, shape=(m,), dtype=np.float32),
            "workload": spaces.Box(low=-np.inf, high=np.inf, shape=(m,), dtype=np.float32),
        }
        self.observation_space = spaces.Dict(obs_spaces)

    def _align_obs(self, obs: dict) -> dict:
        """Pad or trim observation arrays to match self.observation_space shapes."""
        aligned = {}
        for k, space in self.observation_space.spaces.items():
            wanted_shape = space.shape
            # no special handling for action_mask since it is removed

            dtype = getattr(space, 'dtype', np.float32)
            arr = np.asarray(obs.get(k, np.zeros(wanted_shape, dtype=dtype)), dtype=dtype)
            # if arr has fewer dims, left-pad with batch dim removal
            if arr.shape == wanted_shape:
                aligned[k] = arr
                continue
            # create output container
            out = np.zeros(wanted_shape, dtype=dtype)
            # compute slices
            slices = tuple(slice(0, min(s, t)) for s, t in zip(arr.shape, wanted_shape))
            out[slices] = arr[tuple(slice(0, s) for s in arr.shape)]
            aligned[k] = out
        return aligned
    
    def setup(self, input: ProjectDict) -> None:
        """
        Reset and initialize simulation state using the provided project configuration.
        """
        metadata = load_input_metadata(input, self.max_simulation_period)
        self.t_start = metadata["t_start"]
        
        self.time_recorder = metadata["time_recorder"]
        
        self.period = metadata["period"]
        self.max_period_numbers = metadata["max_period_numbers"]
        
        self.max_slot_number = math.ceil(self.period.total_seconds() / self.slot_in_num)
        
        self.datetime_list = metadata["datetime_list"]
        objs = build_static_objects(input, self.period, self.max_period_numbers, self.datetime_list)
        self.sat = objs['sat']
        self.gs = objs['gs']
        self.roi = objs['roi']
        self.eth = objs['eth']
        self.sun = objs['sun']
        self._sat_datas = objs['sat_datas']
        self._gs_datas = objs['gs_datas']
        # self._roi_datas = objs['roi_datas']
        # self._eth_datas = objs['eth_data']
        # self._sun_datas = objs['sun_data']
        self.net = init_network(input, self._sat_datas, self._gs_datas)
        self.period_update()
        
        
    def period_update(self):
        """
        Update all entities to the specified period time.
        """
        for s in self.sat:
            s.tick(self.period_counter, self.slot_counter)
            
        for g in self.gs:
            g.tick(self.period_counter, self.slot_counter)
            
        for r in self.roi:
            r.tick(self.period_counter, self.slot_counter)
            
        self.net._at(self.period_counter, self.slot_counter)
        
        if self.eth and self.sun:
            self.eth.tick(self.period_counter, self.slot_counter)
            self.sun.tick(self.period_counter, self.slot_counter)
            

    def reset(self, seed=None, options=None):
        # Accept the `options` kwarg used by Gymnasium wrappers (Monitor, VecEnv).
        super().reset(seed=seed)
        
        # 重新生成环境
        self.setup(input=self.input)
        self.period_update()
        
        self.time_recorder = self.t_start
        self.period_counter = 0
        self.slot_counter = 0
        self.frame_counter = 0
        
        edges = self.net._allLinks
        self.EG.reset(self.sat, edges)

        all_nodes, all_edges, all_tasks = self.EG.get_nodes(), self.EG.get_edges(), self.TM.get_tasks()

        self.SM.reset()
        self.DM.reset()
        self.TM.reset()
        self.repeat_move_counts = {}
        
        self.SM.setup(
            all_nodes=all_nodes,
            all_edges=all_edges,
            all_tasks=all_tasks
        )

        obs, info = get_obs(sm=self.SM, dm=self.DM, tm=self.TM, step=self.frame_counter)
        return self._align_obs(obs), info

    def step(self, actions):
        # 初始化数值
        self.SM.clear_progress_counters()
        self.DM.reset()
        action_reward = 0.0
        trans_reqs: List[TransReq] = []
        comp_reqs: List[CompReq] = []

        terminated, truncated = False, False
        terminated_reason, truncated_reason = "None", "None"

        # 获取当前任务和节点状态
        # nodes, edges = self.EG.get_nodes(), self.EG.get_edges()
        nodes = self.sat
        edges = self.net.compute_isl_links_at(self.period_counter, self.slot_counter)

        all_tasks = self.TM.get_tasks()
        tasks = self.TM.get_tasks_at(step=self.frame_counter)
        n_tasks = len(tasks)

        # 获取有效动作
        valid_actions = list(actions)[:n_tasks]

        # 初始化状态管理器和决策管理器的活跃任务数
        self.SM.update(n_tasks)
        self.DM.update(n_tasks)

        assert len(valid_actions) == n_tasks

        for task, act in zip(tasks, valid_actions):
            if DEBUG and task.id == 0:
                state0 = self.TM.task_state(task)
                allowed0 = self.get_allowed_actions(task)
                self.logger.debug(
                    f"[Task0] pre-validate: acted={task.acted} state={state0} allowed={sorted(list(allowed0))} "
                    f"workload_done={task.workload_done} data_sent={task.data_sent} t_start={task.t_start} t_end={task.t_end}"
                )
            
            if task.is_done:
                continue
            
            p, o = task.plane_at, task.order_at

            # node = self.EG.nodes.get((p, o))
            node = next((s for s in self.sat if s.plane == p and s.order == o), None)
            if node is None:
                continue
            
            # validate action; validate_action returns (valid: bool, penalty: float, truncated: bool, reason: str)
            is_valid, penalty, is_truncated, truncated_reason_local = self.validate_action(task, act)
            if not is_valid:
                # apply penalty for invalid action
                action_reward += penalty
                if DEBUG:
                    self.logger.debug(f"[InvalidAction] Task {task.id} act={act} state_penalty={penalty} reason={truncated_reason_local}")

                # Remap to a legal fallback to keep learning signal dense
                allowed = self.get_allowed_actions(task)

                # Prefer compute (5) if allowed and not occupied
                remapped_act = None
                if 5 in allowed and not self.DM.is_po_occupied(p=p, o=o):
                    if task.acted in [0, 1, 2, 3, 4]:
                        action_reward += FIRST_COMPUTE_BONUS
                    remapped_act = 5
                else:
                    # Fallback to no-op if compute isn't available; this stabilizes learning
                    action_reward += NO_ACTION_PENALTY
                    remapped_act = 0

                # task.t_end += 1
                # task.acted = remapped_act
                act = remapped_act
                # Reset repeat counter when not moving
                if remapped_act not in [1, 2, 3, 4]:
                    self.repeat_move_counts[task.id] = 0
                # continue

            # action is valid -> apply effects
            if act == 0:
                action_reward += NO_ACTION_PENALTY

            elif act in [1, 2, 3, 4]:
                # 基础移动惩罚（降低无意义移动的吸引力）
                action_reward += BASE_MOVE_PENALTY

                # 连续移动惩罚逻辑
                prev_act = task.acted
                if prev_act in [1,2,3,4]:
                    self.repeat_move_counts[task.id] = self.repeat_move_counts.get(task.id, 0) + 1
                else:
                    self.repeat_move_counts[task.id] = 1

                if self.repeat_move_counts[task.id] > REPEAT_MOVE_THRESHOLD:
                    excess = self.repeat_move_counts[task.id] - REPEAT_MOVE_THRESHOLD
                    penalty = REPEAT_MOVE_PENALTY_BASE * excess
                    # Cap the per-step repeat move penalty to avoid runaway negatives
                    if penalty < REPEAT_MOVE_PENALTY_CAP:
                        penalty = REPEAT_MOVE_PENALTY_CAP
                    action_reward += penalty
                    if DEBUG:
                        self.logger.debug(f"[Penalty] Task {task.id} repeat move count={self.repeat_move_counts[task.id]} penalty={penalty:.3f}")

                # movement actions
                if act == 1:
                    dst = ((p + 1) % self.EG.N_PLANE, o)
                elif act == 2:
                    dst = ((p - 1) % self.EG.N_PLANE, o)
                elif act == 3:
                    dst = (p, (o + 1) % self.EG.N_SAT)
                else:
                    dst = (p, (o - 1) % self.EG.N_SAT)

                if ((p, o), dst) in self.EG.edges_dict:
                    # only record legal link usage into DM
                    self.DM.write_rho(u=(p, o), v=dst, m=task.id, value=True)
                    data_bits = LAYER_OUTPUT_DATA_SIZE[task.layer_id]
                    node.is_communicating_isl = True
                    trans_reqs.append(
                        TransReq(
                            task_id=task.id,
                            src=(p, o),
                            dst=dst,
                        )
                    )
                else:
                    # illegal edge: apply penalty, and try to remap to compute if allowed
                    action_reward += WRONG_EDGE_PENALTY
                    # 重置该任务的重复移动计数，避免惩罚爆炸
                    self.repeat_move_counts[task.id] = 0
                    if DEBUG:
                        self.logger.debug(f"[IllegalLink] Task {task.id} src={(p,o)} dst={dst} penalty={WRONG_EDGE_PENALTY}")
                    allowed = self.get_allowed_actions(task)
                    if 5 in allowed and not self.DM.is_po_occupied(p=p, o=o):
                        # workload = LAYER_PROCESS_STEP_COST[task.layer_id]
                        self.DM.write_pi(p=p, o=o, m=task.id, value=True)
                        node.is_processing = True
                        comp_reqs.append(
                            CompReq(
                                task_id=task.id,
                                node_id=(p, o),
                                layer_id=task.layer_id,
                            )
                        )
                        if task.acted in [0, 1, 2, 3, 4]:
                            action_reward += FIRST_COMPUTE_BONUS
                        # mark effective action as compute for bookkeeping
                        act = 5
                    else:
                        # fallback to no-op once for stability (avoid stacking penalties)
                        act = 0
                        action_reward += NO_ACTION_PENALTY
                    # proceed without 'continue' so that acted/t_end update below applies

            elif act == 5:
                # 使用 DecisionManager 的占用检查（按步重置，更适合并发约束）
                is_occupied = self.DM.is_po_occupied(p=p, o=o)
                if not is_occupied:
                    # workload = LAYER_PROCESS_STEP_COST[task.layer_id]
                    self.DM.write_pi(p=p, o=o, m=task.id, value=True)
                    node.is_processing = True
                    comp_reqs.append(
                        CompReq(
                            task_id=task.id,
                            node_id=(p, o),
                            layer_id=task.layer_id,
                        )
                    )
                    # 从 idle 或 transferring 切到 compute 时给一次额外奖励
                    if task.acted in [0,1,2,3,4]:
                        action_reward += FIRST_COMPUTE_BONUS
                    else:
                        # 连续计算时的持续奖励，鼓励坚持计算
                        action_reward += SUSTAINED_COMPUTE_BONUS
                else:
                    action_reward += NO_ACTION_PENALTY

            task.t_end += 1
            task.acted = act

            # 非移动动作重置计数
            if act not in [1,2,3,4]:
                self.repeat_move_counts[task.id] = 0

        # 执行传输与计算
        action_reward += do_transferring(slot=self.slot_in_num, tasks=tasks, trans_reqs=trans_reqs, sm=self.SM, dm=self.DM)
        action_reward += do_computing(slot=self.slot_in_num, tasks=tasks, comp_reqs=comp_reqs, sm=self.SM, dm=self.DM)
        do_energy_updating(slot=self.slot_in_num, nodes=nodes, sm=self.SM)

        # 计算目标向导奖励（与动作奖励合并前先计算，以便最终汇总）
        aim_reward = settle_reward(delay_penalty=compute_delay_penalty(self.slot_in_num, tasks), energy_penalty=compute_energy_penalty(nodes))

        # 终止/截断判定
        if all_tasks_completed(all_tasks):
            action_reward += ALL_TASK_COMPLETION_REWARD
            terminated = True
            terminated_reason = "all_tasks_completed"
            
        elif any_satellite_depleted(nodes):
            action_reward += ENERGY_DROWN_PENALTY
            terminated = True
            terminated_reason = "satellite_energy_depleted"

        if all_tasks_overtimed(tasks):
            action_reward += OVERTIME_PENALTY
            truncated = True
            truncated_reason = "all_tasks_overtimed"
            
        elif any_illegal_link(self.SM, self.DM):
            action_reward += WRONG_EDGE_PENALTY
            truncated = True
            truncated_reason = "any_illegal_link"

        # 终端/截断调整后，合并最终奖励
        reward = action_reward + aim_reward
        if DEBUG:
            self.logger.debug(f"[StepSummary] frame={self.frame_counter} action_reward={action_reward:.3f} aim_reward={aim_reward:.3f} total={reward:.3f}")
            if self.repeat_move_counts:
                self.logger.debug(f"[RepeatMoves] {self.repeat_move_counts}")

        # 产出观测和可序列化的 info
        obs, dbg_info = get_obs(sm=self.SM, dm=self.DM, tm=self.TM, step=self.frame_counter)

        # 使用 dict 替代 Info 对象，确保可序列化返回
        info_serial = {
            "num_nodes": len(nodes),
            "num_edges": len(edges),
            "num_tasks": n_tasks,
            "reward": float(reward),
            "truncated_reason": truncated_reason,
            "terminated_reason": terminated_reason,
            "is_truncated": bool(truncated),
            "is_terminated": bool(terminated),
        }

        self.frame_counter += 1
        if self.slot_counter < self.max_slot_number - 1:
            self.time_recorder = self.time_recorder + self.slot
            self.slot_counter += 1
        else:
            self.slot_counter = 0
            next_period = self.period_counter + 1
            # If next period would exceed available timeline, truncate episode
            if next_period >= self.max_period_numbers:
                truncated = True
                truncated_reason = "max_period_reached"
                # clamp to last available period index and keep current time
                self.period_counter = self.max_period_numbers - 1
                # ensure time_recorder stays within bounds
                if self.datetime_list:
                    self.time_recorder = self.datetime_list[self.period_counter]
            else:
                self.period_counter = next_period
                # update time to the new period boundary
                self.time_recorder = self.datetime_list[self.period_counter]
                self.period_update()

        return self._align_obs(obs), reward, terminated, truncated, info_serial

    # action_masks removed: environment no longer emits or supports action masks.
    def get_valid_dirs(self, task: Task) -> List[int]:
        p, o = task.plane_at, task.order_at
        
        valid_dirs = []
        
        for a in [1, 2, 3, 4]:
            if a == 1:
                dst = ((p + 1) % self.EG.N_PLANE, o)
            elif a == 2:
                dst = ((p - 1) % self.EG.N_PLANE, o)
            elif a == 3:
                dst = (p, (o + 1) % self.EG.N_SAT)
            else:
                dst = (p, (o - 1) % self.EG.N_SAT)
                
            if ((p, o), dst) in self.EG.edges_dict:
                valid_dirs.append(a)
                
        return valid_dirs
    
    def get_allowed_actions(self, task: Task):
        """Return the allowed action set for the given task based on its state."""
        state = self.TM.task_state(task)
        valid_dirs = self.get_valid_dirs(task)
        if state == "under_processing":
            return {0, 5}
        if state == "under_transferring":
            # allow no-op, continue same direction, or switch to compute
            return {0, task.acted, 5}
        if state == "done":
            return {0}
        # idle
        return {0, *valid_dirs, 5}

    def validate_action(self, task: Task, act: int):
        """
        Returns (valid: bool, penalty: float, truncated: bool, reason: str)
        """
        allowed = self.get_allowed_actions(task)
        if act not in allowed:
            reason = "processing_interrupted" if self.TM.task_state(task) == "under_processing" else (
                "transfer_interrupted" if self.TM.task_state(task) == "under_transferring" else "illegal_action"
            )
            return (False, INTERRUPTION_PENALTY, True, reason)
        return (True, 0.0, False, "None")