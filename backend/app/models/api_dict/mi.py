    
from typing import Optional
from pydantic import Field
from app.models.api_dict.basic import CamelModel


class MissionDict(CamelModel):
    id: str
    project_id: str = Field(..., alias="projectId")
    name: str
    target_id: str = Field(..., alias="targetId")
    source_node_id: str = Field(..., alias="sourceNodeId")
    end_node_id: str = Field(..., alias="endNodeId")
    start_time: str = Field(..., alias="startTime")
    end_time: Optional[str] = Field(None, alias="endTime")
    duration: Optional[float] = None  # in seconds