import numpy as np
from typing import Dict, Tuple
from gymnasium import spaces
from app.env.io.decision_manager import DecisionManager
from app.env.io.state_manager import StateManager
from app.env.core.task_manager import TaskManager
from app.config import MAX_NUM_TASKS

def get_obs_space_shape(o: int, p: int, m: int) -> Dict[str, Tuple[int, ...]]:
    obs_spaces = {
        "energy":   spaces.Box(low=-np.inf, high=np.inf, shape=(p, o), dtype=np.float32),
        "sunlight": spaces.Box(low=-np.inf, high=np.inf, shape=(p, o), dtype=np.float32),
        "comm":     spaces.Box(low=-np.inf, high=np.inf, shape=(p, o, p, o), dtype=np.float32),
        "location": spaces.Box(low=-np.inf, high=np.inf, shape=(m, 2), dtype=np.float32),
        "progress": spaces.Box(low=-np.inf, high=np.inf, shape=(m,), dtype=np.float32),
        "size":     spaces.Box(low=-np.inf, high=np.inf, shape=(m,), dtype=np.float32),
        "workload": spaces.Box(low=-np.inf, high=np.inf, shape=(m,), dtype=np.float32),
    }
    return spaces.Dict(obs_spaces)

def _pad_to_space(obs_dict: dict, obs_space: spaces.Dict) -> dict:
    """根据 obs_space 自动将各字段截断/填充到目标 shape 与 dtype。"""
    aligned = {}
    for k, space in obs_space.spaces.items():
        shape = space.shape
        dtype = getattr(space, "dtype", np.float32)
        src = obs_dict.get(k)
        if src is None:
            aligned[k] = np.zeros(shape, dtype=dtype)
            continue
        a = np.asarray(src, dtype=dtype)
        if a.shape == shape:
            aligned[k] = a
            continue
        out = np.zeros(shape, dtype=dtype)
        slices_out = tuple(slice(0, min(a_dim, s_dim)) for a_dim, s_dim in zip(a.shape, shape))
        slices_in = tuple(slice(0, s.stop) for s in slices_out)
        out[slices_out] = a[slices_in]
        aligned[k] = out
    return aligned

def get_obs(sm: StateManager, dm: DecisionManager, tm: TaskManager, step: int):
    beta_t = sm.report(step)

    # 组装原始 obs（可能形状不完全匹配）
    raw_obs = {
        "energy":   beta_t.get("energy"),
        "sunlight": beta_t.get("sunlight"),
        "comm":     beta_t.get("comm"),
        "location": beta_t.get("location"),
        "progress": beta_t.get("progress"),
        "size":     beta_t.get("size"),
        "workload": beta_t.get("workload"),
    }

    # 使用 StateManager 的维度参数构造空间，再统一对齐
    obs_space = get_obs_space_shape(o=sm.O_MAX, p=sm.P_MAX, m=sm.M_MAX or MAX_NUM_TASKS)
    obs = _pad_to_space(raw_obs, obs_space)

    alpha_t = dm.report(step)
    info = {"alpha": alpha_t, "beta": beta_t, "step": step}
    return obs, info
