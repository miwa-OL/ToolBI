import os
import platform
from pathlib import Path

_system = platform.system()

if _system == "Windows":
    APP_DATA_DIR = Path(os.environ["APPDATA"]) / "ToolBI"
elif _system == "Darwin":
    APP_DATA_DIR = Path.home() / "Library" / "Application Support" / "ToolBI"
else:
    APP_DATA_DIR = Path.home() / ".local" / "share" / "ToolBI"

DATASETS_DIR = APP_DATA_DIR / "datasets"
DB_PATH = APP_DATA_DIR / "app.db"
PORT = 8000

APP_DATA_DIR.mkdir(parents=True, exist_ok=True)
DATASETS_DIR.mkdir(parents=True, exist_ok=True)
