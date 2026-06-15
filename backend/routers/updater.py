import json
import os
import subprocess
import sys
import tempfile
import threading
import urllib.request
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from version import VERSION

GITHUB_REPO = "miwa-OL/ToolBI"
RELEASES_API = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"

router = APIRouter()

_state: dict = {"status": "idle", "progress": 0, "path": None, "error": None}


def _version_tuple(v: str) -> tuple:
    try:
        return tuple(int(x) for x in v.strip().split("."))
    except Exception:
        return (0,)


class DownloadBody(BaseModel):
    download_url: str
    asset_name: str


@router.get("/update/check")
def check_update():
    req = urllib.request.Request(
        RELEASES_API,
        headers={"Accept": "application/vnd.github+json", "User-Agent": "ToolBI-Updater"},
    )
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read())
    except Exception:
        return {"current": VERSION, "latest": None, "update_available": False}

    tag = data.get("tag_name", "").lstrip("v")
    if not tag:
        return {"current": VERSION, "latest": None, "update_available": False}

    update_available = _version_tuple(tag) > _version_tuple(VERSION)

    download_url = None
    asset_name = None
    for asset in data.get("assets", []):
        name = asset.get("name", "")
        if name.lower().endswith((".exe", ".zip")):
            download_url = asset.get("browser_download_url")
            asset_name = name
            break

    return {
        "current": VERSION,
        "latest": tag,
        "update_available": update_available,
        "download_url": download_url,
        "asset_name": asset_name,
        "notes": (data.get("body") or "")[:400],
    }


def _download_worker(url: str, dest: Path):
    _state.update({"status": "downloading", "progress": 0, "path": None, "error": None})
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ToolBI-Updater"})
        with urllib.request.urlopen(req) as resp:
            total = int(resp.headers.get("Content-Length") or 0)
            done = 0
            with dest.open("wb") as f:
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    f.write(chunk)
                    done += len(chunk)
                    if total:
                        _state["progress"] = int(done * 100 / total)
        _state.update({"status": "ready", "progress": 100, "path": str(dest)})
    except Exception as exc:
        _state.update({"status": "error", "error": str(exc)})


@router.post("/update/download")
def start_download(body: DownloadBody):
    if _state["status"] == "downloading":
        raise HTTPException(409, "Download already in progress")
    tmp = Path(tempfile.gettempdir()) / "toolbi_update"
    tmp.mkdir(exist_ok=True)
    dest = tmp / body.asset_name
    threading.Thread(
        target=_download_worker, args=(body.download_url, dest), daemon=True
    ).start()
    return {"status": "started"}


@router.get("/update/progress")
def get_progress():
    return _state


@router.post("/update/apply")
def apply_update():
    if _state["status"] != "ready":
        raise HTTPException(400, "No update ready to apply")
    path = Path(_state["path"])
    if not path.exists():
        raise HTTPException(404, "Downloaded file not found")

    popen_kwargs: dict = {}
    if sys.platform == "win32":
        popen_kwargs["creationflags"] = (
            subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
        )
    else:
        popen_kwargs["start_new_session"] = True

    if path.suffix.lower() == ".exe":
        subprocess.Popen([str(path), "/S"], **popen_kwargs)
    else:
        exe_path = Path(sys.executable) if getattr(sys, "frozen", False) else None
        lines = ["@echo off", "timeout /t 1 /nobreak >nul"]
        if exe_path:
            install_parent = str(exe_path.parent.parent)
            lines.append(
                f'powershell -Command "Expand-Archive -Force '
                f'-Path \\"{path}\\" -DestinationPath \\"{install_parent}\\""'
            )
            lines.append(f'start "" "{exe_path}"')
        bat = Path(tempfile.gettempdir()) / "toolbi_updater.bat"
        bat.write_text("\r\n".join(lines), encoding="utf-8")
        subprocess.Popen(["cmd", "/c", str(bat)], **popen_kwargs)

    def _quit():
        import time
        time.sleep(0.8)
        os._exit(0)

    threading.Thread(target=_quit, daemon=True).start()
    return {"status": "quitting"}
