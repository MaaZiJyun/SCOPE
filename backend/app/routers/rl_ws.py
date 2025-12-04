import time
from typing import Dict, List
from app.config import LOG_OUTPUT
from app.env.PPO.PPOEnv import PPOEnv
from routers.prefix import SIMULATION_PREFIX
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import os
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import VecNormalize
from app.env.env import LEOEnv
from app.models.api_dict.pj import ProjectDict

router = APIRouter(prefix=SIMULATION_PREFIX, tags=["rl-run"])

MODEL_PATH = "ai_model/ppo_leoenv"  # adjust if needed

def load_model_and_normalizer(model_path: str):
    model = PPO.load(model_path)
    vecnorm = None
    vec_path = model_path + ".vecnormalize"
    if os.path.exists(vec_path):
        try:
            vecnorm = VecNormalize.load(vec_path)
            # disable training mode for evaluation
            vecnorm.training = False
            vecnorm.norm_reward = False
        except Exception:
            vecnorm = None
    return model, vecnorm

def env_to_payload(env: LEOEnv, info: dict, energy_data: Dict[str, List[float]], latency_data: Dict[str, List[float]]):
    payload = {
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
    
    for s in env.sat:
        energy_data.setdefault(s.id, []).append(s.battery_ratio)
        
    for t in env.TM.tasks:
        latency_data.setdefault(t.id, []).append(t.t_end - t.t_start if t.t_end and t.t_start else None)
    
    return payload, energy_data, latency_data

@router.websocket("/ws/rl")
async def ws_rl_run(ws: WebSocket):
    await ws.accept()
    print("[RL-WS] client connected")
    
    energy_data: Dict[str, List[float]] = {}
    latency_data: Dict[str, List[float]] = {}

    # 1) load model (blocking IO, ok for small loads)
    try:
        model, vecnorm = load_model_and_normalizer(MODEL_PATH)
    except Exception as e:
        await ws.send_text(json.dumps({"error": f"failed to load model: {e}"}))
        await ws.close()
        return

    # 2) Build env (you must provide a ProjectDict to initialize the env)
    #    For demo: expecting the client to send an "init" message with project config.
    env: LEOEnv = None
    # env: PPOEnv = None
    try:
        # wait for init message containing project JSON
        init_msg = await ws.receive_text()
        data = json.loads(init_msg)
        if data.get("action") != "init" or "payload" not in data:
            await ws.send_text(json.dumps({"error": "expected init payload"}))
            await ws.close()
            return
        proj = ProjectDict.model_validate(data["payload"])
        print(proj)
        env = LEOEnv(proj)
        # call setup/reset to prepare internal structures
        env.setup(proj)
        obs, _ = env.reset()
    except Exception as e:
        print(f"Environment initialization failed: {e}")
        await ws.send_text(json.dumps({"error": f"env init failed: {e}"}))
        await ws.close()
        return

    # If vecnorm exists and was used in training, wrap obs before predict
    def maybe_normalize_obs(obs_dict):
        if vecnorm is None:
            return obs_dict
        # VecNormalize expects vectorized obs; we can use its normalization util if available
        try:
            # build a single-element batch mapping like vecenv would produce
            return vecnorm.normalize_obs(obs_dict)  # may raise if not available
        except Exception:
            return obs_dict

    try:
        done = False
        truncated = False
        # control flags controllable by client messages {"action":"play"/"pause"/"stop"}
        playing = False
        # main loop: run until done or client disconnects
        target_interval = 0.1
        
        while True:
            # non-blocking check for incoming control messages from client
            try:
                # short timeout so we keep looping at responsive cadence
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
                    # ignore malformed control messages
                    pass
            except asyncio.TimeoutError:
                # no control message this iteration — continue
                pass

            # maybe normalized obs for model
            if playing:
                model_obs = obs
                if vecnorm:
                    try:
                        model_obs = maybe_normalize_obs(obs)
                    except Exception:
                        model_obs = obs

                # predict action (no action_masks)
                action, _ = model.predict(model_obs, deterministic=True)
                # ensure correct shape for env.step
                step_input = action

                obs, reward, terminated, truncated, info = env.step(step_input)

                payload, energy_data, latency_data = env_to_payload(env, info, energy_data, latency_data)
                # optionally include step-level info
                payload.update({"reward": float(reward), "terminated": bool(terminated), "truncated": bool(truncated)})
                await ws.send_text(json.dumps(payload, default=str))
                # paused: periodically send current snapshot (no env.step)
                # payload = env_to_payload(env, info={})

                # if terminated or truncated:
                if terminated:
                    # Save metrics to JSON files under LOG_OUTPUT
                    try:
                        os.makedirs(LOG_OUTPUT, exist_ok=True)
                        base = f"ppo_{env.t_start.strftime('%Y%m%dT%H%M%SZ')}"
                        energy_path = os.path.join(LOG_OUTPUT, f"{base}_energy.json")
                        latency_path = os.path.join(LOG_OUTPUT, f"{base}_latency.json")
                        with open(energy_path, "w") as f:
                            json.dump(energy_data, f, ensure_ascii=False)
                        with open(latency_path, "w") as f:
                            json.dump(latency_data, f, ensure_ascii=False)
                    except Exception as e:
                        await ws.send_text(json.dumps({"error": f"save failed: {e}"}))
                    break
                
            elapsed = time.time() - start
            sleep_time = max(target_interval - elapsed, 0.001)

            await asyncio.sleep(sleep_time)

    except WebSocketDisconnect:
        print("[RL-WS] client disconnected")
    except Exception as e:
        await ws.send_text(json.dumps({"error": f"run failed: {e}"}))
        import traceback
        traceback.print_exc()
    finally:
        try:
            await ws.close()
        except Exception:
            pass