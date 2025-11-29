from pydantic import Field
from typing import List, Optional
from app.models.api_dict.basic import CamelModel
from app.models.api_dict.mi import MissionDict

class ExperimentDict(CamelModel):
    id: str
    project_id: str = Field(..., alias="projectId")
    start_time: str = Field(..., alias="startTime")
    end_time: Optional[str] = Field(None, alias="endTime")
    time_slot: Optional[float] = Field(None, alias="timeSlot")
    missions: List[MissionDict]