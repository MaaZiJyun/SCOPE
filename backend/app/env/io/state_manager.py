import numpy as np
from typing import Dict, List, Tuple
import logging

from app.config import DEBUG, MAX_NUM_LAYERS, MAX_NUM_TASKS
from app.env.vars.task import Task
from app.entities.satellite_entity import SatelliteEntity
from app.services.network_service import LinkSnapshot


class StateManager:
    def __init__(self, p_max: int, o_max: int):
        # active task count
        self._M = 0
        # history buffer for snapshots
        self._beta: Dict[int, Dict[str, np.ndarray]] = {}

        # size limits
        self.P_MAX = p_max
        self.O_MAX = o_max
        self.N_MAX = MAX_NUM_LAYERS
        self.M_MAX = MAX_NUM_TASKS

        # Internal storages (sparse dicts). Keys are tuples; values are scalars.
        # Topology
        self.energy: Dict[Tuple[int, int], float] = {}
        self.sunlight: Dict[Tuple[int, int], int] = {}
        # Directed link capacities: (up,uo,vp,vo) -> float rate
        self.comm: Dict[Tuple[int, int, int, int], float] = {}

        # Tasks
        # m -> (p,o)
        self.location: Dict[int, Tuple[int, int]] = {}
        # m -> current layer index
        self.progress: Dict[int, int] = {}
        # (m) -> float
        self.size: Dict[int, float] = {}
        # (m) -> int
        self.workload: Dict[int, int] = {}


    def setup(self, all_nodes: List[SatelliteEntity], all_edges: List[LinkSnapshot], all_tasks: List[Task]):
        for n in all_nodes:
            pp, oo = int(n.plane), int(n.order)
            self.energy[(pp, oo)] = float(n.battery_percent)
            self.sunlight[(pp, oo)] = int(n.is_charging)

        for e in all_edges:
            # defensive: map ids -> nodes (may be None if link is to GS etc)
            u = next((n for n in all_nodes if n.id == e.src), None)
            v = next((n for n in all_nodes if n.id == e.dst), None)
            if u is None or v is None:
                if DEBUG:
                    print("StateManager.setup: skipping edge for unknown node src=%s dst=%s", e.src, e.dst)
                continue

            src_p, src_o = int(u.plane), int(u.order)
            dst_p, dst_o = int(v.plane), int(v.order)

            # avoid duplicate initialization — if already set and similar rate, skip or keep max
            existing = float(self.comm.get((src_p, src_o, dst_p, dst_o), 0.0))
            new_rate = float(e.rate)
            if existing != 0.0:
                # keep the maximum rate to be safe and avoid duplicate prints
                if new_rate > existing:
                    self.comm[(src_p, src_o, dst_p, dst_o)] = new_rate
                    self.comm[(dst_p, dst_o, src_p, src_o)] = new_rate
                    if DEBUG:
                        print("StateManager.setup: updated comm link U(%d,%d)<->V(%d,%d) to higher rate %f", src_p, src_o, dst_p, dst_o, new_rate)
                else:
                    if DEBUG:
                        print("StateManager.setup: skipping duplicate comm link U(%d,%d)<->V(%d,%d) (existing=%f new=%f)", src_p, src_o, dst_p, dst_o, existing, new_rate)
                continue

            self.comm[(src_p, src_o, dst_p, dst_o)] = new_rate
            self.comm[(dst_p, dst_o, src_p, src_o)] = new_rate
            if DEBUG:
                print("StateManager.setup: initialized comm link U(%d,%d) <-> V(%d,%d) with rate %f", src_p, src_o, dst_p, dst_o, new_rate)

        for t in all_tasks:
            self.location[int(t.id)] = (int(t.plane_at), int(t.order_at))
            self.progress[int(t.id)] = int(t.layer_id)
            
    def update(self, current_task_length: int):
        self._M = current_task_length
        
    def report(self, step: int) -> Dict[str, np.ndarray]:
        beta_t = self._to_beta()
        self._beta[step] = beta_t
        return beta_t

    def reset(self):
        self.energy.clear()
        self.sunlight.clear()
        self.comm.clear()
        self.location.clear()
        self.progress.clear()
        self.size.clear()
        self.workload.clear()

    def write_energy(self, p: int, o: int, value: float):
        self.energy[(int(p), int(o))] = float(value)
        
    def write_sunlight(self, p: int, o: int, value: int):
        self.sunlight[(int(p), int(o))] = int(value)
        
    def write_comm(self, u: Tuple[int, int], v: Tuple[int, int], value: float):
        up, uo = int(u[0]), int(u[1])
        vp, vo = int(v[0]), int(v[1])
        self.comm[(up, uo, vp, vo)] = float(value)
        
    def write_location(self, m: int, value: Tuple[int, int]):
        self.location[int(m)] = (int(value[0]), int(value[1]))

    def write_progress(self, m: int, value: int):
        self.progress[int(m)] = int(value)
        
    def write_size(self, m: int, value: float):
        # accumulate size within the current step (per-step increments)
        self.size[int(m)] = float(self.size.get(int(m), 0.0)) + float(value)
            
    def write_workload(self, m: int, value: int):
        # accumulate workload within the current step (per-step increments)
        self.workload[int(m)] = int(self.workload.get(int(m), 0)) + int(value)

    def clear_progress_counters(self):
        """Clear per-step increment counters (call at the start of each env.step)."""
        # workload and size may represent per-step increments
        # Clear per-step increments
        self.workload.clear()
        self.size.clear()
        
    def get_comm(self, u: Tuple[int, int], v: Tuple[int, int]) -> float:
        up, uo = int(u[0]), int(u[1])
        vp, vo = int(v[0]), int(v[1])
        return float(self.comm.get((up, uo, vp, vo), 0.0))
    
    def get_size(self, m: int, n: int) -> float:
        return float(self.size.get((int(m), int(n)), 0.0))
    
    def get_progress(self, m: int) -> int:
        return int(self.progress.get(int(m), 0))
    
    def get_location(self, m: int) -> Tuple[int, int]:
        return tuple(self.location.get(int(m), (0, 0)))

    def neighbors_of(self, u: Tuple[int, int]) -> List[Tuple[int, int]]:
        """Return list of neighbors v for which a link exists from or to u.
        Uses current directed comm entries.
        """
        up, uo = int(u[0]), int(u[1])
        nbrs: List[Tuple[int, int]] = []
        for (sp, so, tp, to), rate in ((k, v) for k, v in self.comm.items() if v and v != 0):
            if sp == up and so == uo:
                nbrs.append((tp, to))
            elif tp == up and to == uo:
                nbrs.append((sp, so))
        # unique
        seen = set()
        uniq = []
        for v in nbrs:
            if v not in seen:
                uniq.append(v)
                seen.add(v)
        return uniq
    
    def _to_beta(self) -> Dict[str, np.ndarray]:
        """Return a snapshot of current state (beta) with topology full-shape
        and task arrays limited to the first self._M active tasks.
        """
        # Build dense arrays for observation compatibility
        energy_arr = np.zeros((self.P_MAX, self.O_MAX), dtype=np.float32)
        for (p, o), val in self.energy.items():
            if 0 <= p < self.P_MAX and 0 <= o < self.O_MAX:
                energy_arr[p, o] = float(val)

        sunlight_arr = np.zeros((self.P_MAX, self.O_MAX), dtype=np.float32)
        for (p, o), val in self.sunlight.items():
            if 0 <= p < self.P_MAX and 0 <= o < self.O_MAX:
                sunlight_arr[p, o] = float(val)

        comm_arr = np.zeros((self.P_MAX, self.O_MAX, self.P_MAX, self.O_MAX), dtype=np.float32)
        for (up, uo, vp, vo), val in self.comm.items():
            if 0 <= up < self.P_MAX and 0 <= uo < self.O_MAX and 0 <= vp < self.P_MAX and 0 <= vo < self.O_MAX:
                comm_arr[up, uo, vp, vo] = float(val)

        # Task arrays limited to first _M tasks
        M = max(int(self._M), 0)
        location_arr = np.zeros((M, 2), dtype=np.int32)
        progress_arr = np.zeros((M,), dtype=np.int32)
        size_arr = np.zeros((M, self.N_MAX), dtype=np.float32)
        workload_arr = np.zeros((M, self.N_MAX), dtype=np.int32)

        for m in range(M):
            if m in self.location:
                p, o = self.location[m]
                location_arr[m, 0] = int(p)
                location_arr[m, 1] = int(o)
            if m in self.progress:
                progress_arr[m] = int(self.progress[m])
            # sizes/workload: iterate layers
            for n in range(self.N_MAX):
                size_arr[m, n] = float(self.size.get((m, n), 0.0))
                workload_arr[m, n] = int(self.workload.get((m, n), 0))

        beta_t = {
            "energy": energy_arr,
            "sunlight": sunlight_arr,
            "comm": comm_arr,
            "location": location_arr,
            "progress": progress_arr,
            "size": size_arr,
            "workload": workload_arr,
        }

        return beta_t

    def sum_size_before(self, m: int, n: int, T: int) -> float:
        """
        获取t时间之前所有size[m, n]历史值，返回float字典。
        """
        result = 0.0
        # Sum historical snapshots strictly before T, then always include
        # the current in-memory buffer. This mirrors sum_workload_before's
        # semantics and prevents timing-dependent under/over-counting.
        for t in range(T):
            beta = self._beta.get(t)
            if beta is None:
                continue
            arr = beta.get("size")
            if arr is None:
                continue
            # ensure indices are in range
            if getattr(arr, 'ndim', 0) >= 2 and 0 <= m < arr.shape[0] and 0 <= n < arr.shape[1]:
                result += float(arr[m, n])
        # always include the current in-memory buffer for step T
        try:
            result += float(self.size.get((int(m), int(n)), 0.0))
        except Exception:
            pass
        return result

    def sum_workload_before(self, m: int, n: int, T: int) -> int:
        """
        获取t时间之前所有workload[m, n]历史值，返回int字典。
        """
        result = 0
        # Sum historical snapshots strictly before T, then always include
        # the current in-memory buffer. This avoids depending on whether
        # a snapshot for T was created earlier (which can happen when
        # observations/action_masks are requested before the step completes)
        # and prevents under- or double-counting the current step.
        for t in range(T):
            beta = self._beta.get(t)
            if beta is None:
                continue
            arr = beta.get("workload")
            if arr is None:
                continue
            # ensure indices are in range
            if getattr(arr, 'ndim', 0) >= 2 and 0 <= m < arr.shape[0] and 0 <= n < arr.shape[1]:
                result += int(arr[m, n])
        # always include the current in-memory buffer for step T
        try:
            result += int(self.workload.get((int(m), int(n)), 0))
        except Exception:
            pass
        return result
    
    def is_empty(self) -> bool:
        """
        检查状态管理器是否为空（没有初始化数据）。
        :return: 是否为空 (bool)
        """
        return self._M == 0
