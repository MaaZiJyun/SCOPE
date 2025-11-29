from typing import List

from app.env.vars.node import Node
from app.env.vars.task import Task
from typing import List
import numpy as np
import logging
from app.config import DEBUG, STEP_PER_SLOT
from app.env.io.decision_manager import DecisionManager
from app.env.io.state_manager import StateManager
from app.entities.satellite_entity import SatelliteEntity

# truncation conditions

def all_tasks_overtimed(tasks: List[Task]):
    result = False
    if len(tasks) > 0:
        result = all((t.t_end - t.t_start) > STEP_PER_SLOT for t in tasks)
    return result

def any_illegal_link(sm: StateManager, dm: DecisionManager, eps: float = 1e-9):
    result = False

    if sm.is_empty() or dm.is_empty():
        return result

    operating_links = np.argwhere(dm.rho != 0)
    if DEBUG:
        logging.debug("any_illegal_link: dm.rho.shape=%s, sm.comm.shape=%s, #ops_raw=%d",
                      getattr(dm, "rho", None).shape if hasattr(dm, "rho") else None,
                      getattr(sm, "comm", None).shape if hasattr(sm, "comm") else None,
                      len(operating_links))

    if operating_links.size == 0:
        return False

    first4 = operating_links[:, :4]
    unique_links = np.unique(first4, axis=0)

    # log summary of unique candidate links
    logging.debug("any_illegal_link: unique_links_count=%d sample=%s", len(unique_links),
                  unique_links[:10].tolist() if len(unique_links) > 0 else [])

    for up, uo, vp, vo in unique_links:
        up, uo, vp, vo = map(int, (up, uo, vp, vo))
        try:
            rho_slice = dm.rho[up, uo, vp, vo]
        except Exception as ex:
            logging.debug("any_illegal_link: cannot read dm.rho[%d,%d,%d,%d]: %s", up, uo, vp, vo, ex)
            continue

        try:
            active = bool(np.any(rho_slice != 0))
        except Exception:
            active = bool(rho_slice != 0)

        if not active:
            continue

        # get comm and neighbor info safely
        try:
            comm_val = sm.get_comm((up, uo), (vp, vo))
            comm_f = float(np.asarray(comm_val).item()) if np.asarray(comm_val).size == 1 else float(np.asarray(comm_val).flatten()[0])
        except Exception as ex:
            logging.debug("any_illegal_link: unable to read sm.comm for U(%d,%d)<->V(%d,%d): %s", up, uo, vp, vo, ex)
            comm_f = 0.0

        if comm_f <= eps:
            # more debug: positions inside rho_slice that are active
            try:
                active_positions = np.argwhere(np.asarray(rho_slice) != 0).tolist()
            except Exception:
                active_positions = "unknown"

            # neighbors currently initialized for each endpoint
            try:
                neighbors_u = np.argwhere(sm.comm[up, uo] != 0).tolist()
            except Exception as ex:
                neighbors_u = f"error:{ex}"
            try:
                neighbors_v = np.argwhere(sm.comm[vp, vo] != 0).tolist()
            except Exception as ex:
                neighbors_v = f"error:{ex}"
            if DEBUG:
                logging.warning(
                    "Problem link: U(%d,%d) <-> V(%d,%d)  dm.rho active_positions=%s  sm.comm=%s  neighbors_U=%s neighbors_V=%s",
                    up, uo, vp, vo, active_positions, comm_f, neighbors_u, neighbors_v
                )
            result = True

    return result


# termination conditions

def all_tasks_completed(tasks: List[Task]):
    """
    检查所有任务是否完成
    :param tasks: 任务列表，每个任务对象需要有 is_done 属性
    :return: 所有任务是否完成 (bool)
    """
    result = False
    if len(tasks) > 0:
        result = all(t.is_done for t in tasks)
    return result

def any_satellite_depleted(nodes: List[SatelliteEntity]):
    """
    检查是否有卫星能量耗尽
    :param nodes: 节点列表，每个节点对象需要有 energy 属性
    :return: 是否有卫星能量耗尽 (bool)
    """
    result = False
    if len(nodes) > 0:
        result = any(n.battery <= 0 for n in nodes)
    return result

