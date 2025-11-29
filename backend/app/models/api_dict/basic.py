from pydantic import BaseModel
from typing import TypeVar, Generic

T = TypeVar("T")

class XYZ(BaseModel):
    x: float
    y: float
    z: float


class LatLon(BaseModel):
    lat: float
    lon: float
    
class CamelModel(BaseModel):
    class Config:
        validate_by_name = True
        populate_by_name = True

class ApiResponse(BaseModel, Generic[T]):
    status: str
    data: T