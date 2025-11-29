import datetime
from typing import Any, List
import numpy as np
from pydantic import BaseModel
from app.models.api_dict.basic import XYZ, LatLon
from app.entities.functions.timeslot import date_to_timeslot
from app.services.network_service import LinkSnapshot
from app.config import BATTERY_MAX, COMPUTE_ENERGY_COST, STATIC_ENERGY_COST, TRANSMIT_ENERGY_COST
from app.entities._satellite_modules.energy import equa_solar_income

class SatelliteSnapshot(BaseModel):
    # spatial
    id: str
    plane: int
    order: int
    dimensions: List[float]
    pos: XYZ
    loc: LatLon
    velocityVector: XYZ
    solarVector: XYZ

    # imagery
    imgCornersPos: List[XYZ]
    imgCornersLon: List[LatLon]

    # energy
    batteryPercent: float

    # indicators
    onROI: bool
    onSGL: bool
    onProc: bool
    onISL: bool
    onSun: bool

class SatelliteEntity():
    def __init__(
        self,
        time_series: dict[str, Any], 
    ):
        # === 卫星基本参数 ===
        # 卫星时序数据
        self.time_series: dict[str, Any] = time_series
        # 卫星 ID
        self.id: str = time_series['id']
        # 卫星编号
        self.order: int = time_series['order']
        # 卫星所在轨道平面编号
        self.plane: int = time_series['plane']
        # 卫星扫掠长度（单位：m）
        self.sl: float = time_series['swath_length']
        # 卫星卫星尺寸（长，宽，高）（单位：m）
        self.dimensions: tuple[float, float, float] = (0.3, 0.3, 0.3)
        
        # === 空间与姿态 ===
        # 1. ECEF坐标
        self.pos: XYZ = XYZ(x=0.0, y=0.0, z=0.0)
        # 2. 地理坐标（纬度，经度）
        self.loc: LatLon = LatLon(lat=0.0, lon=0.0) 
        # 3. 图像角点 ECEF 坐标 
        self.img_corners_pos: List[XYZ] = []
        # 4. 图像角点 地理坐标
        self.img_corners_loc: List[LatLon] = []
        # 5. 地面速度（单位：度/秒）
        self.v: float = 0.0
        self.velocity_vector: np.ndarray = np.array([0.0, 0.0, -1.0])
        self.solar_vector: np.ndarray = np.array([0.0, 0.0, -1.0])
        
        # === Indicator 状态 ===
        self.is_charging = False            # 处于阳照区
        self.is_processing = False          # 正在处理
        self.is_observing = False           # 正在观测
        self.is_communicating_isl = False   # 正在通信
        self.is_communicating_sgl = False   # 可与地面通信
        
        # === 电池与能源 ===
        self.battery: float = BATTERY_MAX     # 当前电池电量
        self.battery_percent: float = 100.0    # 当前电池电量百分比

        # === 通信模块 ===
        self.connections: dict[str, LinkSnapshot] = {}  # 当前连接的链路信息

    def tick(self, period_counter: int, slot_counter: int) -> None:
        self._at(period_counter, slot_counter)

    def energy_step(self, dt: float) -> None:
        self.charge(dt)
        self.discharge_static(dt)
        self.discharge_dynamic(dt)
        self.clear_indicators()
        
    def clear_indicators(self) -> None:
        self.is_processing = False
        self.is_observing = False
        self.is_communicating_isl = False
        self.is_communicating_sgl = False

    def charge(self, dt: float) -> None:
        gain = equa_solar_income(
            dt=dt,
            sat_pos=self.pos,
            dimensions=self.dimensions,
            solar_vector=self.solar_vector,
            velocity=self.velocity_vector,
            mu_t=1 if self.is_charging else 0
        )
        self.battery = min(self.battery + gain, BATTERY_MAX)
        self.battery_percent = (self.battery / BATTERY_MAX) * 100.0
        
    def discharge_static(self, dt: float) -> None:
        cost = dt * STATIC_ENERGY_COST
        self.battery = max(self.battery + cost, 0)
        self.battery_percent = (self.battery / BATTERY_MAX) * 100.0
        # print(f"dt {dt} Static discharge for satellite {self.id}: cost={cost:.2f}, battery={self.battery:.2f}, percent={self.battery_percent:.2f}%")

    def discharge_dynamic(self, dt: float) -> None:
        cost = dt * (self.is_communicating_isl * TRANSMIT_ENERGY_COST + self.is_processing * COMPUTE_ENERGY_COST)
        self.battery = max(self.battery + cost, 0)
        self.battery_percent = (self.battery / BATTERY_MAX) * 100.0

    def _at(self, period_counter: int, slot_counter: int) -> None:
        # 更新位置
        pos = self.time_series["space_xyz"][period_counter]
        self.pos = XYZ(x=pos[0], y=pos[1], z=pos[2])
        
        # 更新地理坐标
        lat, lon = self.time_series["subpoint_latlon"][period_counter]
        self.loc = LatLon(lat=lat, lon=lon)
        
        # 更新地面速度
        self.v = self.time_series["azimuth"][period_counter]
        
        # 更新充电状态
        self.is_charging = self.time_series["is_sunlit"][period_counter]
        
        # 更新图像角点位置和地理坐标
        self.img_corners_pos = [
            XYZ(x=corner[0], y=corner[1], z=corner[2]) 
            for corner in self.time_series["footprint_corners_xyz"][period_counter]
        ]
        self.img_corners_loc = [
            LatLon(lat=corner[0], lon=corner[1]) 
            for corner in self.time_series["footprint_corners_latlon"][period_counter]
        ]
        
        self.is_communicating_sgl = any(link.type in ('UL', 'DL') for link in self.connections.values())
        
        self.solar_vector = self.time_series["solar_vector"][period_counter]
        
        # 获取单位化速度向量（-z方向，用于论文坐标系）
        self.velocity_vector = self.time_series["velocity_vector"][period_counter]
        
    def snapshot(self) -> SatelliteSnapshot:
        return SatelliteSnapshot(
            # spatial
            id=self.id,
            plane=self.plane,
            order=self.order,
            dimensions=self.dimensions,
            pos=self.pos,
            loc=self.loc,
            velocityVector=XYZ(x=self.velocity_vector[0],
                    y=self.velocity_vector[1],
                    z=self.velocity_vector[2]),
            solarVector=XYZ(x=self.solar_vector[0],
                    y=self.solar_vector[1],
                    z=self.solar_vector[2]),
            # imagery
            imgCornersPos=self.img_corners_pos,
            imgCornersLon= self.img_corners_loc,
            # Energy
            batteryPercent=self.battery_percent,
            # indicators
            onROI=self.is_observing,
            onSGL=self.is_communicating_sgl,
            onProc=self.is_processing,
            onISL=self.is_communicating_isl,
            onSun=self.is_charging,
        )
        
    def serialize(self) -> dict:
        return self.snapshot().model_dump()