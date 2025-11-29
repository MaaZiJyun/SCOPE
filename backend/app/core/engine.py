import json
import time
import asyncio
from typing import List, Optional
from fastapi import WebSocket
from app.models.api_dict.pj import ProjectDict
from app.core.simulation import Simulation
from app.core.input_handler import InputHandler
from app.core.renderer import Renderer

class Engine:
    """
    Tick-driven simulation engine:
    - Drives Simulation forward at fixed timestep.
    - Handles WebSocket inputs.
    - Pushes frames to clients.
    """

    def __init__(self):
        self.sim = Simulation()
        self.input = InputHandler()
        self.client: Optional[WebSocket] = None
        self.renderer = Renderer(self.sim)
        self.running = False
        self.playing = False

    def init(self, project: ProjectDict):
        """
        Setup simulation with input project configuration.
        Called once when simulation starts.
        """
        self.sim.setup(project)

    async def process_input(self):
        """
        Poll queued messages and handle commands (reset, pause, etc).
        """
        for raw in await self.input.poll():
            try:
                data = json.loads(raw)
                cmd = data.get("action")
                if cmd == "init": 
                    project_data = data.get("payload")
                    if project_data:
                        parsed = ProjectDict.model_validate(project_data)
                        self.period = parsed.experiment.time_slot
                        self.init(parsed)

                elif cmd == "play":
                    self.play()
                elif cmd == "pause":
                    self.pause()
                elif cmd == "stop":
                    self.stop()

                # 可扩展更多命令：pause, play, jump_to_frame 等

            except Exception as e:
                print(f"[Engine] Failed to process input: {e}")
                import traceback
                traceback.print_exc()

    def tick(self):
        """
        Advance simulation by one time step.
        """
        self.sim.update()

    async def render(self):
        """
        Push current frame to all connected WebSocket clients.
        """
        ok = await self.renderer.draw(self.client)
        if not ok:
            # 客户端已断开或发送失败，清理引用并停止仿真或等待重连
            print("[Engine] client disconnected or send failed. Clearing client and stopping.")
            self.client = None
            self.stop()

    async def run(self):
        """
        Main async event loop driving the simulation.
        """
        self.running = True
        # 期望的循环间隔（秒），用于控制外层频率
        target_interval = 0.1
        while self.running:
            start = time.time()
            await self.process_input()
            try:
                if self.playing:
                    self.tick()
                    await self.render()
            except Exception as e:
                import traceback
                print(f"[Update failed: {e}")
                traceback.print_exc()
            elapsed = time.time() - start
            # 以 target_interval 为目标间隔，sleep 剩余时间（至少 0）
            sleep_time = max(target_interval - elapsed, 0.001)
            await asyncio.sleep(sleep_time)

    def stop(self):
        """
        Exit the simulation loop.
        """
        print("[Engine] Stopping simulation.")
        self.running = False
        
    def play(self):
        """
        Exit the simulation loop.
        """
        print("[Engine] playing simulation.")
        self.playing = True
        
    def pause(self):
        """
        Exit the simulation loop.
        """
        print("[Engine] playing simulation.")
        self.playing = False