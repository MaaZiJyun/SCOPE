from routers.prefix import SIMULATION_PREFIX
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from app.core.engine import Engine

router = APIRouter(prefix=SIMULATION_PREFIX, tags=["simulation"])

@router.websocket("/websocket")
async def ws_simulator(ws: WebSocket):
    await ws.accept()
    print("[WS] Client connected")

    # 新建一个引擎实例
    engine = Engine()
    engine.client = ws

    # 启动模拟任务
    simulation_task = asyncio.create_task(engine.run())

    try:
        while True:
            data = await ws.receive_text()
            await engine.input.push(data)

    except WebSocketDisconnect:
        print("[WS] Client disconnected")
        engine.client = None
        engine.stop()
        # 可选：取消任务（立即停止）
        simulation_task.cancel()
