from typing import List
from app.env.io.state_manager import StateManager
from app.entities.satellite_entity import SatelliteEntity
from typing import List
from app.env.io.decision_manager import DecisionManager
from app.config import DATA_COMPUTE_REWARD, DATA_TRANSFER_PENALTY, DEBUG, LAYER_COMPLETION_REWARD, LAYER_OUTPUT_DATA_SIZE, LAYER_PROCESS_STEP_COST, MAX_NUM_LAYERS, STEP_PER_SECOND, T_STEP, TASK_COMPLETION_REWARD, TASK_COMPLETION_REWARD, TRANS_COMPLETION_REWARD, DELTA_WORKLOAD_REWARD
from app.env.vars.request import CompReq, TransReq
from app.env.vars.task import Task

def do_computing(
    comp_reqs: List[CompReq],
    tasks: List[Task],
    sm: StateManager,
    dm: DecisionManager,
):
    rewards = 0.0
    
    # 处理每个传输请求
    for req in comp_reqs: 
        m = req.task_id
        # n = sm.get_progress(m)
        
        # 找到对应的任务对象
        task = next((task for task in tasks if task.id == m), None)
        if task is None:
            continue
        
        # 得到当前需要计算的总工作量
        n = task.layer_id
        target = LAYER_PROCESS_STEP_COST[n]
        
        # 更新计算进度 (记录前进度以计算增量奖励)
        prev_workload_percent = task.workload_percent
        task.workload_done += 1
        task.workload_percent = task.workload_done / target
        # 奖励塑形：每步计算给予微奖励，降低纯稀疏奖励带来的探索困难
        
        # 加上每次计算奖励
        rewards += DATA_COMPUTE_REWARD

        # 增量工作量奖励 (按本步进度提升比例乘以系数)
        delta = task.workload_percent - prev_workload_percent
        if delta > 0:
            inc_reward = DELTA_WORKLOAD_REWARD * delta
            rewards += inc_reward
            if DEBUG:
                print(f"[Reward] Task {m} workload delta {delta:.4f} inc {inc_reward:.4f}")

        # 检查是否完成计算
        if task.workload_done >= target:
            # 计算完成：进入下一层
            task.layer_id += 1
            task.workload_done = 0
            task.workload_percent = 0.0
            
            # 正确的完成度应基于更新后的 task.layer_id
            task.completion = task.layer_id / MAX_NUM_LAYERS
            
            # 加上层完成奖励
            rewards += LAYER_COMPLETION_REWARD
            
            # 检查任务是否完成
            if task.layer_id >= MAX_NUM_LAYERS:
                task.is_done = True
                rewards += TASK_COMPLETION_REWARD
                
        # 更新任务完成度到StateManager
        sm.write_progress(m=m, value=task.completion)
        # 记录当前任务累计计算进度（按任务）
        sm.write_workload(m=m, value=task.workload_percent)
        
    return rewards


def do_transferring(
    tasks: List[Task],
    trans_reqs: List[TransReq], 
    sm: StateManager,
    dm: DecisionManager,
):
    rewards = 0.0
    
    # 处理每个传输请求
    for req in trans_reqs: 
        m = req.task_id
        dst = req.dst
        
        # 获取任务当前层数和位置
        # src = sm.get_location(m)
        
        # 找到对应的任务对象
        task = next((task for task in tasks if task.id == m), None)
        if task is None:
            continue
        
        # 得到当前需要传输的总数据量
        n = task.layer_id
        src = (task.plane_at, task.order_at)
        target_data_to_send = LAYER_OUTPUT_DATA_SIZE[n]
        
        # 获取当前通信速率
        comm_capacity = sm.get_comm(u=src, v=dst)
        if comm_capacity == 0:
            continue
        
        # 得到使用该链路的所有任务列表
        users_uv = dm.get_rho_by_uv(u=src, v=dst)  # Dict[m, bool]
        # 得到使用该链路的所有任务列表（反向）
        users_vu = dm.get_rho_by_uv(u=dst, v=src)  # Dict[m, bool]
        # 得到所有使用该链路的任务集合（统一链路双向）
        all_ms = set(users_uv.keys()) | set(users_vu.keys())
        
        # 计算所有任务的总数据量
        target_list = []
        for m_other in all_ms:
            if users_uv.get(m_other, False) or users_vu.get(m_other, False):
                _t = next((task for task in tasks if task.id == m_other), None)
                if _t is None:
                    continue
                layer_idx = _t.layer_id
                target_list.append(LAYER_OUTPUT_DATA_SIZE[layer_idx])
        sum_of_data = sum(target_list)
        
        # 计算带宽比例（本地任务数据量占比）
        bandwidth_ratio = target_data_to_send / sum_of_data if sum_of_data > 0 else 0

        # 计算此步可传输的数据量
        data_this_step = comm_capacity * T_STEP * bandwidth_ratio

        # 更新传输进度，位置不变
        task.data_sent += data_this_step
        task.data_percent = task.data_sent / target_data_to_send
        
        # 加上每次传输惩罚
        # rewards += DATA_TRANSFER_PENALTY

        # 检查是否完成传输
        if task.data_sent >= target_data_to_send:
            
            # 传输完成，更新任务位置 (write destination coordinates)
            task.plane_at, task.order_at = dst
            
            # 传输完成，更新任务进度
            task.data_sent = 0.0
            task.data_percent = 0.0
            # sm.write_size(m=m, value=0.0)
            
            # 加上传输完成奖励
            rewards += TRANS_COMPLETION_REWARD
        
        # 写入按任务的累计传输进度（比例）
        sm.write_size(m=m, value=task.data_percent)
        # 更新任务位置
        sm.write_location(m=m, value=(task.plane_at, task.order_at))

    return rewards


def do_energy_updating(slot: float, nodes: List[SatelliteEntity], sm: StateManager):
    for n in nodes:
        n.energy_step(dt=slot)
        sm.write_energy(n.plane, n.order, n.battery_ratio)
