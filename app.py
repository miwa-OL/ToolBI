import sys
import time
import threading
from pathlib import Path

import uvicorn
import webview

sys.path.insert(0, str(Path(__file__).parent / "backend"))

from backend.main import app as fastapi_app
from backend.config import PORT


def start_server():
    uvicorn.run(fastapi_app, host="127.0.0.1", port=PORT, log_level="warning")


server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

time.sleep(1.5)

window = webview.create_window(
    "ToolBI",
    f"http://127.0.0.1:{PORT}",
    width=1400,
    height=900,
    min_size=(1024, 700),
)

webview.start()
