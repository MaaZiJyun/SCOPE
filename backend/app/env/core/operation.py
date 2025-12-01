from typing import List

from app.env.io.state_manager import StateManager
from app.entities.satellite_entity import SatelliteEntity
from typing import List
from app.env.io.decision_manager import DecisionManager
from app.config import DEBUG, LAYER_COMPLETION_REWARD, LAYER_OUTPUT_DATA_SIZE, LAYER_PROCESS_STEP_COST, MAX_NUM_LAYERS, STEP_PER_SECOND, T_STEP, TASK_COMPLETION_REWARD, TASK_COMPLETION_REWARD, TRANS_COMPLETION_REWARD
from app.env.vars.request import CompReq, TransReq
from app.env.vars.task import Task

def do_computing(
    comp_reqs: List[CompReq],
    tasks: List[Task],
    sm: StateManager,
    dm: DecisionManager,
    t: int,
):
    rewards = 0.0
    
    for req in comp_reqs: 
        m = req.task_id
        n = sm.get_progress(m)
        target = LAYER_PROCESS_STEP_COST[n]
        
        task = next((task for task in tasks if task.id == m), None)
        if task is None:
            continue


        # 更新计算进度：写入 StateManager 的 per-step 增量缓冲区。
        # We write the per-step increment first so that sum_workload_before
        # (which now always includes current buffer) reflects the up-to-date
        # cumulative progress.
        sm.write_workload(m=m, n=n, value=1)

        # 当前已经计算的量（使用 StateManager 的累计值作为单一信源）
        # This avoids keeping two separate counters (Task.workload_done and
        # the StateManager buffer) that can drift out of sync due to ordering.
        sent_data = sm.sum_workload_before(m=m, n=n, T=t)

        # keep the task.workload_done synchronized with the state manager
        task.workload_done = int(sent_data)
        task.workload_percent = task.workload_done / LAYER_PROCESS_STEP_COST[task.layer_id]

            # if n == 0:
            #     print(f"Task {m} Layer {n} Workload Done: {task.workload_done}, Sum Workload Before T={t}: {sent_data}, Target: {target}")

        # 检查是否完成计算
        if sent_data >= target:
                # 计算完成，更新任务位置
                sm.write_progress(m=m, value=n+1)
                task.layer_id += 1
                task.infer_percent = task.layer_id / MAX_NUM_LAYERS
                task.workload_done = 0
                task.workload_percent = 0.0
                rewards += LAYER_COMPLETION_REWARD
                
                if task.layer_id >= MAX_NUM_LAYERS:
                    task.is_done = True
                    rewards += TASK_COMPLETION_REWARD

    return rewards


def do_transferring(
    tasks: List[Task],
    trans_reqs: List[TransReq], 
    sm: StateManager,
    dm: DecisionManager,
    t: int,
):
    rewards = 0.0
    
    for req in trans_reqs: 
        m = req.task_id
        n = sm.get_progress(m)
        src = sm.get_location(m)
        dst = req.dst
        
        target_data_to_send = LAYER_OUTPUT_DATA_SIZE[n]
        
        task = next((task for task in tasks if task.id == m), None)
        if task is None:
            continue

        # 获取当前通信速率
        comm_capacity = sm.get_comm(u=src, v=dst)
        if comm_capacity == 0:
            if DEBUG:
                print(f"[trans] req task={m} src={src} dst={dst} comm_capacity=0 — skipping")
            continue

        # 分配带宽比例
        users_uv = dm.get_rho_by_uv(u=src, v=dst)
        users_vu = dm.get_rho_by_uv(u=dst, v=src)
        # combine both directions: include a (m,n) if either uv or vu indicates True
        all_keys = set(users_uv.keys()) | set(users_vu.keys())
        # build target list defensively (handle numpy scalars)
        target_list = []
        for key in all_keys:
            val_uv = users_uv.get(key, False)
            val_vu = users_vu.get(key, False)
            if val_uv or val_vu:
                m_, n_ = key
                idx = int(n_)
                target_list.append(LAYER_OUTPUT_DATA_SIZE[idx])
        sum_of_data = sum(target_list)
        bandwidth_ratio = target_data_to_send / sum_of_data if sum_of_data > 0 else 0

        # 计算每步可传输的数据量
        data_this_step = comm_capacity * T_STEP * bandwidth_ratio

        # Debug prints to help diagnose zero-transfer issues (kept minimal)
        if DEBUG:
            users_count = sum(1 for k in all_keys if users_uv.get(k, False) or users_vu.get(k, False))
            print(
                f"[trans] t={t} task={m} layer={n} src={src} dst={dst} comm={comm_capacity:.3f} "
                f"users={users_count} sum_of_data={sum_of_data:.3f} bw_ratio={bandwidth_ratio:.6f} data_step={data_this_step:.6f}"
            )
            if sum_of_data == 0 and len(target_list) > 0:
                print(f"[trans] detailed targets for users: {target_list}")

        # 更新传输进度
        req.data_sent += data_this_step
        sm.write_size(m=m, n=n, value=data_this_step)
        # 同步 Task.data_sent 使用 StateManager 的累计值作为单一信源，
        # 避免本地计数器与 state buffer 发生漂移。
        # sent_data = sm.sum_size_before(m=m, n=n, T=t)
        # task.data_sent = float(sent_data)
        task.data_sent += data_this_step
        task.data_percent = task.data_sent / LAYER_OUTPUT_DATA_SIZE[task.layer_id]

        # 检查是否完成传输
        # if sent_data >= target_data_to_send:
        if task.data_sent >= target_data_to_send:
            # 传输完成，更新任务位置 (write destination coordinates)
            sm.write_location(m=m, value=dst)
            task.plane_at, task.order_at = dst
            task.data_sent = 0.0
            task.data_percent = 0.0
            trans_reqs.remove(req)
            rewards += TRANS_COMPLETION_REWARD

    return rewards


# def update_static_energy(nodes: List[Node], sm: StateManager):
#     for n in nodes:
        # n.energy = max(n.energy + STATIC_ENERGY_COST, 0.0)
        # sm.write_energy(n.plane_id, n.order_id, n.energy)
        
        # if n.gamma:
        #     n.energy = min(n.energy + ENERGY_HARVEST_AMOUNT, 100.0)
        #     sm.write_energy(n.plane_id, n.order_id, n.energy)


def do_energy_updating(slot: float, nodes: List[SatelliteEntity], sm: StateManager):
    for n in nodes:
        n.energy_step(dt=slot)
        sm.write_energy(n.plane, n.order, n.battery_percent)
