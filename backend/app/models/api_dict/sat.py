from typing import Optional
from pydantic import Field
from app.models.api_dict.basic import CamelModel


class SatelliteDict(CamelModel):
    id: str
    constellation_id: Optional[str] = Field(None, alias="constellationId")
    name: Optional[str] = None
    order: Optional[int] = None
    plane: Optional[int] = None
    tle1: Optional[str] = None
    tle2: Optional[str] = None