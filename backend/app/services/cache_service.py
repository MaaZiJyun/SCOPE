from datetime import datetime, timedelta, timezone
import os
import shutil
from typing import List
from app.entities.functions.prepare import TS, preparation_of_earth, preparation_of_roi, preparation_of_satellite, preparation_of_station, preparation_of_sun
from app.models.api_dict.pj import ProjectDict


def clear_cache_folder(cache_dir: str = "cache") -> None:
    """
    Remove all files and subfolders in the cache directory.
    If the folder does not exist, do nothing.
    """
    if os.path.exists(cache_dir):
        shutil.rmtree(cache_dir)
        
def get_cache_folder_size(cache_dir: str = "cache") -> int:
    """
    Calculate the total size (in bytes) of all files in the cache directory (including subfolders).
    Returns the total size in bytes.
    """
    total_size = 0
    if not os.path.exists(cache_dir):
        return total_size
    for root, dirs, files in os.walk(cache_dir):
        for file in files:
            file_path = os.path.join(root, file)
            if os.path.isfile(file_path):
                total_size += os.path.getsize(file_path)
    return total_size

def check_all_cache_integrity(project_id: str, constellation_id: str) -> dict:
    """
    检查所有相关 cache 路径的完整性（能否正常读取 pickle 文件）。
    返回 dict: {业务名: True/False}
    """
    import pickle

    cache_map = {
        "sat_datas": f"cache/{project_id}/sat_datas/{constellation_id}.pkl",
        "gs_datas": f"cache/{project_id}/gs_datas.pkl",
        "roi_datas": f"cache/{project_id}/roi_datas.pkl",
        "sun_datas": "cache/sun_datas.pkl",
        # "moon_datas": "cache/moon_datas.pkl",
        "earth_datas": "cache/earth_datas.pkl",
    }
    result = {}
    for key, path in cache_map.items():
        if not os.path.exists(path):
            result[key] = False
            continue
        try:
            with open(path, "rb") as f:
                pickle.load(f)
            result[key] = True
        except Exception:
            result[key] = False
    return result

def initial_cache_setup(input: ProjectDict) -> ProjectDict:
    print("Initial cache setup", input.experiment.end_time)
    t_start = normalize_time(input.experiment.start_time)
    if input.experiment.end_time is None or input.experiment.end_time < input.experiment.start_time:
        t_end = t_start + timedelta(hours=2)
    else:
        t_end = normalize_time(input.experiment.end_time)
    
    # t_dt = t_start
    max_simulation_duration = t_end - t_start

    if input.experiment.time_slot:
        dt_slot = timedelta(seconds=input.experiment.time_slot)
    else:
        dt_slot = timedelta(seconds=30)  # default 30s time slot

    number_of_steps = int(max_simulation_duration // dt_slot)
    datetime_list = [
        t_start + i * dt_slot for i in range(number_of_steps)
    ]
    
    times = to_times(datetime_list)
    
    print(f"  - Total simulation duration: {max_simulation_duration}, steps: {number_of_steps}")
    print(f"  - Time slot: {dt_slot}, from {t_start} to {t_end}")
    print(f"  - Preparing cache data {times[0]} ~ {times[-1]} ...")
    
    sat, sat_datas = preparation_of_satellite(
        input=input,
        steps=number_of_steps,
        times=times,
        datetimes=datetime_list
    )
    
    gs, gs_datas = preparation_of_station(
        input=input,
        times=times,
        datetimes=datetime_list
    )
    
    roi, roi_datas = preparation_of_roi(
        input=input,
        steps=number_of_steps,
        times=times,
        datetimes=datetime_list
    )
    
    eth, eth_data = preparation_of_earth(
        dt=dt_slot,
        times=times,
        datetimes=datetime_list
    )
    
    sun, sun_data = preparation_of_sun(
        times=times,
        datetimes=datetime_list
    )
    
def normalize_time(t):
        """
        Normalize input time to timezone-aware UTC datetime.
        """
        if isinstance(t, str):
            from dateutil.parser import parse
            t = parse(t)
        if t.tzinfo is None:
            return t.replace(tzinfo=timezone.utc)
        return t.astimezone(timezone.utc)
    
    
def to_times(datetimes: List[datetime]):
    return TS.utc(datetimes)