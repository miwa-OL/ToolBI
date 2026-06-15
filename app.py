import sys
import threading
import time
import urllib.request
from pathlib import Path

import uvicorn
import webview

sys.path.insert(0, str(Path(__file__).parent / "backend"))

from main import app as fastapi_app


def start_server():
    uvicorn.run(fastapi_app, host="127.0.0.1", port=8000, log_level="warning")


server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

server_ready = False
for _ in range(10):
    try:
        with urllib.request.urlopen("http://127.0.0.1:8000/api/v1/health", timeout=1) as resp:
            if resp.status == 200:
                server_ready = True
                break
    except Exception:
        pass
    time.sleep(0.5)

if not server_ready:
    webview.create_window(
        "ToolBI — Startup Error",
        html=(
            "<html><body style='"
            "font-family:-apple-system,BlinkMacSystemFont,sans-serif;"
            "padding:32px;color:#1c1c1e;background:#f2f2f7'"
            ">"
            "<h2 style='color:#ff3b30;margin-top:0'>Failed to start</h2>"
            "<p>The ToolBI server did not respond after 5 seconds.</p>"
            "<p style='color:#636366'>Ensure port 8000 is not in use, then try again.</p>"
            "</body></html>"
        ),
        width=440,
        height=200,
    )
    webview.start()
    raise SystemExit(1)

webview.create_window(
    "ToolBI",
    "http://127.0.0.1:8000",
    width=1400,
    height=900,
    min_size=(1024, 700),
    confirm_close=True,
)

webview.start()
