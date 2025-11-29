import json
from skyfield.api import load
from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from app.entities.earth_entity import EarthEntity
from app.entities.roi_entity import ROIEntity
from app.entities.sun_entity import SunEntity
from app.services.network_service import Network
from app.entities.functions.prepare import preparation_of_earth, preparation_of_roi, preparation_of_satellite, preparation_of_station, preparation_of_sun, to_times
from app.entities.satellite_entity import SatelliteEntity
from app.entities.station_entity import StationEntity
from app.models.api_dict.pj import ProjectDict

TS = load.timescale()

class Simulation:
    """
    Core simulation engine:
    - Handles the initialization and time-stepped progression of a satellite-ground station network.
    """

    def __init__(self):
        self.t_start: datetime = datetime.now(timezone.utc)
        self.max_simulation_period: timedelta = timedelta(hours=2)  # 最大仿真时间
        self.t_end: datetime = self.t_start + self.max_simulation_period
        
        self.period: timedelta = timedelta(seconds=30.0)  # 时间步长，默认30秒
        self.slot: timedelta = timedelta(seconds=1.0)  # 时间步长，默认1秒
        self.max_period_numbers: int = int(self.max_simulation_period.seconds // self.period.seconds)
        self.max_slot_number: int = int(self.period.seconds / self.slot.seconds)

        self.time_recorder: datetime = self.t_start
        self.period_counter: int = 0
        self.slot_counter: int = 0
        self.frame_counter: int = 0
        
        self.net: Network = None
        
        self.datetime_list: list[datetime] = []
        self.sat: List[SatelliteEntity] = []
        self.gs: List[StationEntity] = []
        self.roi: List[ROIEntity] = []
        self.earth: EarthEntity = None
        self.sun: SunEntity = None
        
        self._roi_datas: List[dict] = []
        self._gs_datas: List[dict] = []
        self._sat_datas: List[dict] = []
        self._eth_datas: List[dict] = []
        self._sun_datas: List[dict] = []

    def setup(self, input: ProjectDict) -> None:
        """
        Reset and initialize simulation state using the provided project configuration.
        """
        self._load_input_metadata(input)
        self._build_static_objects(input)
        self._init_network(input)
        
    def reset(self) -> None:
        """
        Reset simulation to initial state.
        """
        self.time_recorder = self.t_start
        self.period_counter = 0
        self.slot_counter = 0
        self.frame_counter = 0
        
        # for s in self.sat:
        #     s.reset()
            
        # for g in self.gs:
        #     g.reset()
            
        # for r in self.roi:
        #     r.reset()
            
        # if self.eth and self.sun:
        #     self.eth.reset()
        #     self.sun.reset()

    def update(self):
        try:
            # 已到末尾则不推进
            within_bounds = self.period_counter < self.max_period_numbers - 1
            if not within_bounds:
                return
            
            # 当前时间
            current_slot_time = self.time_recorder
            
            if self.frame_counter == 0:
                self.period_update()
                
            else:
                if self.slot_counter >= self.max_slot_number - 1:
                    self.slot_counter = 0
                    self.period_counter += 1
                    self.time_recorder = self.datetime_list[self.period_counter + 1]
                    # period 级别更新（例如慢频率的 entity）
                    self.period_update()

                else:
                    self.time_recorder = self.time_recorder + self.slot
                    self.slot_counter += 1
                    
            self.frame_counter += 1

        except Exception as e:
            import traceback
            print(f"[Update failed: {e}")
            traceback.print_exc()
                
    def period_update(self):
        """
        Update all entities to the specified period time.
        """
        try:
            for s in self.sat:
                s.tick(self.period_counter, self.slot_counter)
                
            for g in self.gs:
                g.tick(self.period_counter, self.slot_counter)
                
            for r in self.roi:
                r.tick(self.period_counter, self.slot_counter)

            self.net._at(self.period_counter, self.slot_counter)

            if self.eth and self.sun:
                self.eth.tick(self.period_counter, self.slot_counter)
                self.sun.tick(self.period_counter, self.slot_counter)
                
        except Exception as e:
                import traceback
                print(f"[Period update failed: {e}")
                traceback.print_exc()

    def serialize(self) -> Dict[str, Any]:
        """
        Return the current simulation state as a serializable dictionary.
        """
        return {
            "time": self.time_recorder.isoformat(),
            "currentFrame": self.frame_counter,
            "slotCounter": self.slot_counter,
            "MaxSlotNumbers": self.max_slot_number,
            "periodCounter": self.period_counter,
            "MaxPeriod": self.max_period_numbers,
            "sun": self.sun.serialize(),
            "earth": self.eth.serialize(),
            "stations": [g.serialize() for g in self.gs],
            "satellites": [s.serialize() for s in self.sat],
            "rois": [r.serialize() for r in self.roi],
            "links": self.net.serialize(),
        }
        
    def to_payload(self) -> str:
        return json.dumps(self.serialize(), default=str)

    # Helper methods for time normalization and metadata loading

    def _normalize_time(self, t):
        """
        Normalize input time to timezone-aware UTC datetime.
        """
        if isinstance(t, str):
            from dateutil.parser import parse
            t = parse(t)
        if t.tzinfo is None:
            return t.replace(tzinfo=timezone.utc)
        return t.astimezone(timezone.utc)
    
    # 根据period_length和dt_max计算时间步数和时间点列表
    def _load_input_metadata(self, input: ProjectDict) -> None:
        # 初始化时间参数
        self.t_start = self._normalize_time(input.experiment.start_time)
        self.time_recorder = self.t_start
        
        # 计算周期长度
        if input.experiment.time_slot:
            self.period = timedelta(seconds=input.experiment.time_slot)
            
        # 计算总周期数
        self.max_period_numbers = int(self.max_simulation_period // self.period)
        
        # 生成时间点列表
        self.datetime_list = [
            self.t_start + i * self.period for i in range(self.max_period_numbers)
        ]
        
    def _build_static_objects(self, input: ProjectDict) -> None:
        try:     
            times = to_times(self.datetime_list)
            # print(self.datetime_list)

            self.sat, sat_datas = preparation_of_satellite(
                input=input,
                steps=self.max_period_numbers,
                times=times,
                datetimes=self.datetime_list
            )
            
            self.gs, gs_datas = preparation_of_station(
                input=input,
                times=times,
                datetimes=self.datetime_list
            )
            
            self.roi, roi_datas = preparation_of_roi(
                input=input,
                steps=self.max_period_numbers,
                times=times,
                datetimes=self.datetime_list
            )
            
            self.eth, eth_data = preparation_of_earth(
                dt=self.period,
                times=times,
                datetimes=self.datetime_list
            )
            
            self.sun, sun_data = preparation_of_sun(
                times=times,
                datetimes=self.datetime_list
            )

            self._sat_datas = sat_datas
            self._gs_datas = gs_datas
            self._roi_datas = roi_datas
            self._eth_datas = eth_data
            self._sun_datas = sun_data
            
        except Exception as e:
                import traceback
                print(f"[Build failed: {e}")
                traceback.print_exc()
                
    def _init_network(self, input: ProjectDict) -> None:
        co_info = input.constellation
        self.net = Network(
            num_planes=co_info.number_of_planes,
            sat_datas=self._sat_datas,
            gs_datas=self._gs_datas
        )


