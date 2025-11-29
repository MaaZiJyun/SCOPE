import asyncio
from typing import List

class InputHandler:
    """
    Buffers incoming messages (e.g. from WebSocket)
    so the engine can process them each tick.
    """

    def __init__(self):
        self._queue: asyncio.Queue[str] = asyncio.Queue()

    async def push(self, msg: str):
        """Called by the WS handler to enqueue a raw message."""
        await self._queue.put(msg)

    async def poll(self) -> List[str]:
        """
        Return all messages received since the last poll.
        """
        msgs: List[str] = []
        while not self._queue.empty():
            msgs.append(await self._queue.get())
        return msgs
