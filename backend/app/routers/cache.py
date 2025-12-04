import multiprocessing
import threading
from app.core.simulation import Simulation
from app.env.train_and_run import train_model
from app.env.baselines.auto_testing import AutoTester
from routers.prefix import CACHE_PREFIX
from fastapi import APIRouter, HTTPException
from app.models.api_dict.pj import ProjectDict
from app.models.api_dict.basic import ApiResponse
from services.cache_service import (
    check_all_cache_integrity,
    clear_cache_folder,
    get_cache_folder_size,
    initial_cache_setup,
)

router = APIRouter(prefix=CACHE_PREFIX, tags=["cache"])

@router.get("/size", response_model=ApiResponse[int])
async def get_cache_size():
    size = get_cache_folder_size()
    return ApiResponse(status="success", data=size)

@router.post("/clear", response_model=ApiResponse[str])
async def clear_cache():
    clear_cache_folder()
    return ApiResponse(status="success", data="cache cleared")

@router.post("/check_integrity", response_model=ApiResponse[dict])
async def check_cache_integrity(input: ProjectDict):
    try:
        result = check_all_cache_integrity(input.id, input.constellation.id)
        return ApiResponse(status="success", data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/initial", response_model=ApiResponse[str])
async def initial_cache(input: ProjectDict):
    initial_cache_setup(input)
    return ApiResponse(status="success", data="cache initialized")

@router.post("/train", response_model=ApiResponse[str])
async def train_model_route(input: ProjectDict):
    try:
        p = multiprocessing.Process(target=train_model, args=(input,))
        p.daemon = False
        p.start()
        # Spawn a lightweight watcher that prints when the process finishes
        def _on_proc_exit(proc: multiprocessing.Process):
            try:
                proc.join()
                print(f"[Cache] training process finished (pid={proc.pid}, exitcode={proc.exitcode})")
            except Exception as ex:
                print(f"[Cache] training watcher error: {ex}")

        threading.Thread(target=_on_proc_exit, args=(p,), daemon=True).start()
        return ApiResponse(status="success", data=f"cache initialized, training started (pid={p.pid})")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed to start training process: {e}")

@router.post("/auto_testing", response_model=ApiResponse[str])
async def auto_testing_route(input: ProjectDict):
    # initial_cache_setup(input)
    # train_model(input)
    try:
        tester = AutoTester(input)
        tester.run()
        return ApiResponse(status="success", data="model run")
    except Exception as e:
        import traceback
        print(f"[Update failed: {e}")
        traceback.print_exc()