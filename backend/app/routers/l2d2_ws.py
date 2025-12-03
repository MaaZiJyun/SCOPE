import time
from app.env.baselines.L2D2.L2D2Env import L2D2Env
from routers.prefix import SIMULATION_PREFIX
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
from app.env.env import LEOEnv
from app.models.api_dict.pj import ProjectDict

router = APIRouter(prefix=SIMULATION_PREFIX, tags=["l2d2-run"])


def env_to_payload(env: LEOEnv, info: dict) -> dict:
    return {
        "time": env.time_recorder.isoformat(),
        "currentFrame": int(env.frame_counter),
        "slotCounter": int(env.slot_counter),
        "MaxSlotNumbers": int(env.max_slot_number),
        "periodCounter": int(env.period_counter),
        "MaxPeriod": int(env.max_period_numbers),
        "sun": env.sun.serialize() if env.sun else None,
        "earth": env.eth.serialize() if env.eth else None,
        "stations": [g.serialize() for g in env.gs],
        "satellites": [s.serialize() for s in env.sat],
        "rois": [r.serialize() for r in env.roi],
        "links": env.net.serialize() if env.net else {},
        "tasks": [json.loads(t.model_dump_json()) for t in env.TM.tasks],
        "info": info,
    }


@router.websocket("/ws/l2d2")
async def ws_l2d2_run(ws: WebSocket):
    await ws.accept()
    print("[L2D2-WS] client connected")

    # Build env from client init payload
    env: L2D2Env = None
    try:
        init_msg = await ws.receive_text()
        data = json.loads(init_msg)
        if data.get("action") != "init" or "payload" not in data:
            await ws.send_text(json.dumps({"error": "expected init payload"}))
            await ws.close()
            return
        proj = ProjectDict.model_validate(data["payload"])
        env = L2D2Env(proj)
        env.setup(proj)
        env.reset()
    except Exception as e:
        await ws.send_text(json.dumps({"error": f"env init failed: {e}"}))
        await ws.close()
        return

    try:
        playing = False
        target_interval = 0.1

        while True:
            try:
                start = time.time()
                ctrl_raw = await asyncio.wait_for(ws.receive_text(), timeout=0.01)
                try:
                    ctrl = json.loads(ctrl_raw)
                    cmd = ctrl.get("action")
                    if cmd == "play":
                        playing = True
                    elif cmd == "pause":
                        playing = False
                    elif cmd == "stop":
                        await ws.send_text(json.dumps({"stopped": True}))
                        break
                except Exception:
                    pass
            except asyncio.TimeoutError:
                pass

            if playing:
                # decide actions
                reward, terminated, truncated, info = env.step()

                payload = env_to_payload(env, info)
                payload.update({
                    "reward": float(reward),
                    "terminated": bool(terminated),
                    "truncated": bool(truncated),
                })
                await ws.send_text(json.dumps(payload, default=str))

                if terminated:
                    break

            elapsed = time.time() - start
            sleep_time = max(target_interval - elapsed, 0.001)
            await asyncio.sleep(sleep_time)

    except WebSocketDisconnect:
        print("[L2D2-WS] client disconnected")
    except Exception as e:
        await ws.send_text(json.dumps({"error": f"run failed: {e}"}))
        import traceback
        traceback.print_exc()
    finally:
        try:
            await ws.close()
        except Exception:
            pass
