import json
from typing import Optional
from fastapi import WebSocket
from app.core.simulation import Simulation

class Renderer:
    def __init__(self, sim: Simulation):
        self.sim = sim

    async def draw(self, client: Optional[WebSocket]) -> bool:
        if not client:
            print("[Renderer] no client, skip draw")
            return False

        try:
            payload = json.dumps(self.sim.serialize(), default=str)
            # debug log: 每次发送前打印时间或 slotCounter
            # print(f"[Renderer] sending payload time={self.sim.time_recorder} slot={self.sim.slot_counter} period={self.sim.period_counter}")
            await client.send_text(payload)
            return True
        except Exception as e:
            import traceback
            print(f"[Renderer] Send failed: {e}")
            traceback.print_exc()
            return False

