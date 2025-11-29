from routers.prefix import PROJECT_PREFIX
from fastapi import APIRouter, HTTPException
from app.models.api_dict.basic import ApiResponse
from app.models.api_dict.pj import ProjectDict
from services.project_service import (
    delete_project_pkl,
    detect_update,
    load_all_projects_from_pkl,
    load_project_from_pkl,
    save_project_to_pkl,
)

router = APIRouter(prefix=PROJECT_PREFIX, tags=["project"])

@router.post("/detect", response_model=ApiResponse[ProjectDict])
async def detect_project_update(input: ProjectDict):
    print("== 接口触发 ==")
    # print(f"Detecting project update...{input}")
    try:
        updated: ProjectDict = detect_update(input)
        return ApiResponse(status="success", data=updated)
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        import traceback
        print(f"[Update failed: {e}")
        traceback.print_exc()

@router.post("/save", response_model=ApiResponse[ProjectDict])
async def upload_project(input: ProjectDict):
   try:
       project_id = save_project_to_pkl(input)
       project = load_project_from_pkl(project_id)
       return ApiResponse(status="success", data=project)
   except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))
   
@router.delete("/delete/{project_id}", response_model=ApiResponse[str])
async def delete_project(project_id: str):
    try:
        result = delete_project_pkl(project_id)
        if result:
            return ApiResponse(status="success", data="deleted")
        else:
            raise HTTPException(status_code=404, detail="Project not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
   
@router.get("/get/{project_id}", response_model=ApiResponse[ProjectDict])
async def get_project_by_id(project_id: str):
    try:
        project = load_project_from_pkl(project_id)
        return ApiResponse(status="success", data=project)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", response_model=ApiResponse[list[ProjectDict]])
async def api_get_projects():
    try:
        projects = load_all_projects_from_pkl()
        return ApiResponse(status="success", data=projects)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
