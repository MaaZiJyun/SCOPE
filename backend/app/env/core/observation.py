import numpy as np
from typing import Dict, Tuple
from app.env.io.decision_manager import DecisionManager
from app.env.io.state_manager import StateManager
from app.env.core.task_manager import TaskManager
from app.config import MAX_NUM_TASKS
# from envs.snapshot.info import Info

def get_obs(sm: StateManager, dm: DecisionManager, tm: TaskManager, step: int):
    # Extract state snapshot (beta). StateManager now builds dense arrays internally.
    beta_t = sm.report(step)

    # Simple pad helper that avoids heavy numpy ops; only pads/truncates to target shape.
    def _pad(arr, shape: tuple, fill: float = 0.0, dtype=np.float32):
        out = np.full(shape, fill, dtype=dtype)
        if arr is None:
            return out
        a = np.asarray(arr, dtype=dtype)
        # compute slice bounds per-dimension
        slices_out = tuple(slice(0, min(a_dim, o_dim)) for a_dim, o_dim in zip(a.shape, shape))
        slices_in = tuple(slice(0, s.stop) for s in slices_out)
        out[slices_out] = a[slices_in]
        return out

    # Directly use beta_t arrays without normalization to keep logic simple and avoid numpy-heavy ops.
    # Gym spaces expect numpy arrays; we convert minimally.
    energy = np.asarray(beta_t.get("energy"), dtype=np.float32)
    sunlight = np.asarray(beta_t.get("sunlight"), dtype=np.float32)
    comm = np.asarray(beta_t.get("comm"), dtype=np.float32)
    location = _pad(beta_t.get("location", None), (MAX_NUM_TASKS, 2), dtype=np.float32)
    progress = _pad(beta_t.get("progress", None), (MAX_NUM_TASKS,), dtype=np.float32)
    size = _pad(beta_t.get("size", None), (MAX_NUM_TASKS, getattr(sm, "N_MAX", 1)), dtype=np.float32)
    workload = _pad(beta_t.get("workload", None), (MAX_NUM_TASKS, getattr(sm, "N_MAX", 1)), dtype=np.float32)

    obs = {
        "energy": energy,
        "sunlight": sunlight,
        "comm": comm,
        "location": location,
        "progress": progress,
        "size": size,
        "workload": workload,
    }
    
    # ========= 动作掩码 =========
    
    # Build action_mask for all tasks via TaskManager API
    tasks = tm.get_tasks_at(step)
    mask = tm.build_action_mask_for_tasks(tasks)  # shape (MAX_NUM_TASKS, 6), dtype=bool
    # keep action_mask as boolean so Maskable policies and wrappers interpret it correctly
    obs["action_mask"] = mask.astype(bool)

    # ======== 从决策管理器提取动作空间 α_t ========
    alpha_t = dm.report(step)

    # return obs and a plain debug dict; env will build a snapshot Info object later
    info = {
        "alpha": alpha_t,
        "beta": beta_t,
        "step": step,
    }

    return obs, info
