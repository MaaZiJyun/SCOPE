# 根据period_length和dt_max计算时间步数和时间点列表
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from app.entities.functions.prepare import preparation_of_earth, preparation_of_roi, preparation_of_satellite, preparation_of_station, preparation_of_sun
from app.models.api_dict.pj import ProjectDict
from app.services.cache_service import to_times
from app.services.network_service import Network


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


def load_input_metadata(input: ProjectDict, max_simulation_period: float):
    # 初始化时间参数
    t_start = normalize_time(input.experiment.start_time)
    time_recorder = t_start
    
    # 计算周期长度
    if input.experiment.time_slot:
        period = timedelta(seconds=input.experiment.time_slot)
        
    # 计算总周期数
    max_period_numbers = int(max_simulation_period // period)
    
    # 生成时间点列表
    datetime_list = [
        t_start + i * period for i in range(max_period_numbers)
    ]

    return {
        "t_start": t_start,
        "time_recorder": time_recorder,
        "period": period,
        "max_period_numbers": max_period_numbers,
        "datetime_list": datetime_list
    }

def build_static_objects(input: ProjectDict, period: timedelta, max_period_numbers: int, datetime_list: list[datetime]):
    try:
        times = to_times(datetime_list)
        # print(datetime_list)
        sat, sat_datas = preparation_of_satellite(
            input=input,
            steps=max_period_numbers,
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
            steps=max_period_numbers,
            times=times,
            datetimes=datetime_list
        )
        
        eth, eth_data = preparation_of_earth(
            dt=period,
            times=times,
            datetimes=datetime_list
        )
        
        sun, sun_data = preparation_of_sun(
            times=times,
            datetimes=datetime_list
        )
        
        return {
            "sat": sat,
            "sat_datas": sat_datas,
            "gs": gs,
            "gs_datas": gs_datas,
            "roi": roi,
            "roi_datas": roi_datas,
            "eth": eth,
            "eth_data": eth_data,
            "sun": sun,
            "sun_data": sun_data,
        }
        
    except Exception as e:
            import traceback
            print(f"[Build failed: {e}")
            traceback.print_exc()

def init_network(input: ProjectDict, sat_datas: List[Dict[str, Any]], gs_datas: List[Dict[str, Any]]) -> None:
    co_info = input.constellation
    net = Network(
        num_planes=co_info.number_of_planes,
        sat_datas=sat_datas,
        gs_datas=gs_datas
    )
    return net