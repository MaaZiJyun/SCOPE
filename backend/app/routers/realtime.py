# from fastapi import APIRouter, HTTPException
# from old_models.basemodels import ApiResponse, ProjectDict
# from services.realtime_service import (
#     calc_realtime_data,
#     get_realtime_data_by_constellation,
# )

# router = APIRouter(prefix="/api/realtime", tags=["realtime"])

# @router.post("/calc", response_model=ApiResponse)
# async def calc_realtime(input: ProjectDict):
#     # try:
#         data = calc_realtime_data(input)
#         return ApiResponse(status="success", data=data)
#     # except Exception as e:
#     #     raise HTTPException(status_code=500, detail=str(e))

# @router.get("/frames/{constellation_id}", response_model=ApiResponse)
# async def get_realtime_data(constellation_id: str):
#     try:
#         data = get_realtime_data_by_constellation(constellation_id)
#         return ApiResponse(status="success", data=data)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    
