import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))
from app.routers import cache, project, simulation, rl_ws
from app.routers import baseline_ws
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SCOPE API", version="0.1.0")

# 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 或前端域名
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(project.router)
# app.include_router(predict.router)
app.include_router(simulation.router)
app.include_router(cache.router)
app.include_router(rl_ws.router)
app.include_router(baseline_ws.router)

