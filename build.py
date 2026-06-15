import shutil
import subprocess
import sys
from pathlib import Path

# For macOS: run this same script on a Mac. The spec file targets both platforms.
# Replace webview.platforms.winforms hidden import with webview.platforms.cocoa.
# Sign the resulting .app with: codesign --deep --force --sign - dist/ToolBI.app

ROOT = Path(__file__).parent
FRONTEND = ROOT / "frontend"
DIST_STATIC = ROOT / "backend" / "static"
FRONTEND_DIST = FRONTEND / "dist"


def run(cmd, cwd=None):
    subprocess.run(cmd, cwd=cwd, check=True)


npm = shutil.which("npm")
if npm is None:
    raise RuntimeError("npm not found in PATH")

print("Step 1: Building frontend...")
run([npm, "run", "build"], cwd=FRONTEND)

print("Step 2: Copying frontend build to backend/static...")
if DIST_STATIC.exists():
    shutil.rmtree(DIST_STATIC)
shutil.copytree(FRONTEND_DIST, DIST_STATIC)

print("Step 3: Ensuring data directory exists...")
(ROOT / "data" / "datasets").mkdir(parents=True, exist_ok=True)

print("Step 4: Generating app icon...")
run([sys.executable, str(ROOT / "create_icon.py")])

print("Step 5: Running PyInstaller...")
run([sys.executable, "-m", "PyInstaller", "--noconfirm", "toolbi.spec"], cwd=ROOT)


output = ROOT / "dist" / "ToolBI"
print(f"\nBuild complete. Output: {output}")
