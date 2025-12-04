import logging
import os
from datetime import datetime

from app.config import LOG_OUTPUT


class SystemLogger:
    """Simple file-based logger with debug/info/error methods."""
    def __init__(self, name: str, level: int = logging.INFO) -> None:
        os.makedirs(LOG_OUTPUT, exist_ok=True)

        ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        dated_filename = f"System_{name}_{ts}.log"
        file_path = os.path.join(LOG_OUTPUT, dated_filename)

        logger = logging.getLogger(name)
        logger.setLevel(level)

        if not logger.handlers:
            fh = logging.FileHandler(file_path)
            fh.setLevel(level)
            fh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
            logger.addHandler(fh)

        self._logger = logger

    def debug(self, msg: str, *args, **kwargs) -> None:
        self._logger.debug(msg, *args, **kwargs)

    def info(self, msg: str, *args, **kwargs) -> None:
        self._logger.info(msg, *args, **kwargs)
    
    def warning(self, msg: str, *args, **kwargs) -> None:
        self._logger.warning(msg, *args, **kwargs)

    def error(self, msg: str, *args, **kwargs) -> None:
        self._logger.error(msg, *args, **kwargs)
