from pydantic import Field
from app.models.api_dict.basic import CamelModel, LatLon

class GroundStationDict(CamelModel):
    id: str
    project_id: str = Field(..., alias="projectId")
    name: str
    location: LatLon