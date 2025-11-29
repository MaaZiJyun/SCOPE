from typing import Dict
from pydantic import BaseModel

from app.config import LAYER_OUTPUT_DATA_SIZE, LAYER_PROCESS_STEP_COST

"""
Each task record Z = {m, n, p, o, start, end} 
- m: task index
- n: layer index
- p: plane index
- o: satellite index
- start: int
- end: int
"""

class Task(BaseModel):
    id: int
    plane_at: int
    order_at: int
    t_start: int
    t_end: int
    
    # functional counters
    layer_id: int = 0
    infer_percent: float = 0.0
    acted: int = 0 # to record action taken
    workload_done: int = 0 # to record computation progress
    workload_percent: float = 0.0
    data_sent : int = 0 # to record transmission progress
    data_percent: float = 0.0
    is_done: bool = False