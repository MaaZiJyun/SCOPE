from typing import List

from app.config import B_MAX, LAYER_PROCESS_SECOND_COST_GPU, LAYER_PROCESS_STEP_COST, STEP_PER_SLOT, WEIGHT_DELAY, WEIGHT_ENERGY, BATTERY_MAX
from app.env.vars.task import Task
from app.entities.satellite_entity import SatelliteEntity


def compute_delay_penalty(tasks: List[Task]):
    # done_tasks = [t for t in tasks if t.is_done]
    
    # if not done_tasks:
    #     return 0.0

    # MAX_TASK_DELAY = STEP_PER_SLOT * 1.5
    # max_cumulation = max(t.t_end - t.t_start for t in done_tasks)
    
    # # for t in tasks:
    # #     pi = dm.get_pi(t.plane_at, t.order_at, t.layer_id, t.id)
        
    # delay_penalty = max_cumulation / MAX_TASK_DELAY
    
    max_idx = len(LAYER_PROCESS_STEP_COST) - 1
    delays = []
    for t in tasks:
        workload_left = sum(LAYER_PROCESS_STEP_COST[i] for i in range(t.layer_id, max_idx))
        delays.append(workload_left / STEP_PER_SLOT)
        
    delay_penalty = max(delays, default=0.0)
    return min(delay_penalty, 1.0)  # 防止出现负值


def compute_energy_penalty(nodes: List[SatelliteEntity]):
    if not nodes:
        return 0.0

    energy_penalty = max(1 - n.battery_ratio for n in nodes)

    socs = [n.battery_ratio for n in nodes]
    min_soc = min(socs)
    if min_soc < 0.3:
        penalty = (0.3 - min_soc) / 0.3  # 归一到 [0,1]
    else:
        penalty = 0

    return min(energy_penalty + penalty, 1.0)  # 限制在 [0, 1]

def settle_reward(delay_penalty: float, energy_penalty: float, scale: float = 1.0) -> float:
    """
    Lexicographic objective: prioritize one objective first, break ties with the other.

    - If primary == 'delay': minimize delay first (maximize 1-delay), then among equal delay
      prefer lower energy. Implemented as a large weight on the primary objective plus
      a small secondary bonus.
    - Reverse if primary == 'energy'.
    """
    d = min(max(delay_penalty, 0.0), 1.0)
    e = min(max(energy_penalty, 0.0), 1.0)
    return scale * (WEIGHT_ENERGY * (1.0 - e) + WEIGHT_DELAY * (1.0 - d))
