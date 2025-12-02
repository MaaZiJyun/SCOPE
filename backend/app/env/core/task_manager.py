# TaskManager: 任务生成与管理
import numpy as np
from typing import List

from app.config import INTERRUPTION_PENALTY, MAX_NUM_TASKS
from app.env.core.entity_col import EntityCol
from app.env.vars.task import Task


class TaskManager:
    def __init__(self, eg: EntityCol):
        self.eg = eg
        self.tasks: List[Task] = []

    def generate(self):
        node_keys = list(self.eg.nodes_dict.keys())
        # 如果没有任何节点，跳过任务生成以避免 np.random.randint(0, 0))
        if len(node_keys) == 0:
            self.tasks = []
            return

        for _id in range(MAX_NUM_TASKS):
            idx = np.random.randint(0, len(node_keys))
            (_plane_at, _order_at) = node_keys[idx]
            _t = np.random.randint(0, 10)
            task_obj = Task(
                id=_id,
                layer_id=0,
                plane_at=_plane_at,
                order_at=_order_at,
                t_start=_t,
                t_end=_t,
                acted=0,
                workload_done=0,
                data_sent=0,
                is_done=False
            )
            # print(f"Generated Task ID {task_obj.id} start time {task_obj.t_start} end time {task_obj.t_end}")
            self.tasks.append(task_obj)

    def reset(self):
        self.tasks.clear()
        self.generate()

    def get_tasks_at(self, step: int) -> List[Task]:
        return [t for t in self.tasks if not t.t_start > step and not t.is_done]

    def get_tasks(self) -> List[Task]:
        return self.tasks
    
    def task_state(self, task: Task):
        
        # idle → anything allowed
        # under_processing → only allow: compute (5), no-op (0)
        # under_transferring → only allow: same direction transfer (1/2/3/4), no-op (0)
        # done → only allow: no-op (0)
        
        # --- Case 1: 已完成 ---
        if task.is_done:
            return "done"

        # --- Case 2: computing ---
        # 条件：上一动作是 compute 且已计算过部分
        if task.acted == 5 and task.workload_done > 0:
            return "under_processing"

        # --- Case 3: transferring ---
        # 条件：上一动作是传输且方向一致
        if task.acted in [1, 2, 3, 4] and task.data_sent > 0:
            return "under_transferring"

        # --- Case 4: idle ---
        return "idle"





