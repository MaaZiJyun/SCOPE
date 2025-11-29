from pydantic import Field
from typing import Optional
from app.models.api_dict.basic import CamelModel, LatLon

class ROIDict(CamelModel):
    id: str
    project_id: str = Field(..., alias="projectId")
    name: str
    length: float
    width: Optional[float] = None
    location: LatLon