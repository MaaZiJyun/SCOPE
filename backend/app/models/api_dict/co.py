from pydantic import Field
from typing import Optional
from app.models.api_dict.basic import CamelModel

class ConstellationDict(CamelModel):
    id: str
    project_id: str = Field(..., alias="projectId")
    name: str
    description: Optional[str] = None
    number_of_planes: int = Field(..., alias="numberOfPlanes")
    number_of_sat_per_planes: int = Field(..., alias="numberOfSatPerPlanes")
    phase_factor: float = Field(..., alias="phaseFactor")
    altitude: float
    inclination: float
    orbital_period: Optional[float] = Field(None, alias="orbitalPeriod")