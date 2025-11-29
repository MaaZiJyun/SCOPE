

from typing import List, Optional
from pydantic import Field

from app.models.api_dict.basic import CamelModel
from app.models.api_dict.co import ConstellationDict
from app.models.api_dict.exp import ExperimentDict
from app.models.api_dict.gs import GroundStationDict
from app.models.api_dict.hd import HardwareDict
from app.models.api_dict.roi import ROIDict
from app.models.api_dict.sat import SatelliteDict


class ProjectDict(CamelModel):
    id: str
    user_id: Optional[str] = Field(None, alias="userId")
    title: Optional[str]
    description: Optional[str]
    hardware: HardwareDict
    experiment: ExperimentDict
    constellation: ConstellationDict
    satellites: List[SatelliteDict]
    ground_stations: List[GroundStationDict] = Field(..., alias="groundStations")
    rois: List[ROIDict]