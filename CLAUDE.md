# ToolBI — Claude Code Instructions

## Project Purpose
A local-only Power BI–style app called ToolBI. No cloud calls, no external APIs.
All data stays on disk under /data/. PII safety is a hard requirement.

## Stack
- Backend: Python 3.11, FastAPI, Pandas, DuckDB, SQLite via SQLModel, PyWebView
- Frontend: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Recharts, Plotly.js, dnd-kit
- Packaging: PyInstaller (Windows .exe, macOS .app later)

## Running the App (Development)
- Backend: `cd backend && uvicorn main:app --reload --port 8000`
- Frontend: `cd frontend && npm run dev` (port 5173, proxies /api to 8000)
- Packaged: `python app.py` (PyWebView opens native window, serves built frontend)

## Project Structure
toolbi/
├── CLAUDE.md
├── PROGRESS.md
├── app.py                      ← PyWebView entry point (packaged mode)
├── build.py                    ← PyInstaller build script
├── toolbi.spec                 ← PyInstaller spec file
├── data/
│   ├── datasets/               ← Uploaded CSVs converted to parquet
│   └── app.db                  ← SQLite database
├── backend/
│   ├── main.py
│   ├── config.py               ← Platform-aware paths, constants
│   ├── models.py               ← SQLModel DB models
│   ├── schemas.py              ← Pydantic request/response schemas
│   ├── routers/
│   │   ├── datasets.py
│   │   ├── reports.py
│   │   └── query.py
│   ├── services/
│   │   ├── csv_parser.py
│   │   ├── query_engine.py
│   │   └── storage.py
│   └── requirements.txt
└── frontend/
├── src/
│   ├── api/                ← Typed fetch wrappers
│   ├── components/         ← Shared UI components
│   ├── pages/              ← DataSources, ReportBuilder, Dashboard
│   ├── store/              ← Zustand global state
│   └── types/              ← Shared TypeScript types
├── package.json
└── vite.config.ts

## API Conventions
- All routes prefixed with /api/v1
- JSON request and response bodies throughout
- Errors always return { detail: string } with appropriate HTTP status

## Data Conventions
- Uploaded CSVs are parsed and stored as Parquet in /data/datasets/
- Each dataset has a UUID as its identifier
- Column types: "text" | "number" | "date" | "boolean"
- Chart configs are JSON stored in SQLite as part of a Report record
- Report layout positions are stored as JSON (x, y, w, h per chart widget)

## Cross-Platform Requirements
- Always use pathlib.Path for all file paths — never string concatenation with separators
- Resolve platform-specific app data directories at runtime using platform.system() in config.py
- Never use Windows-only shell commands or APIs
- All subprocess calls must use lists, not shell strings

## Code Style — Strictly Enforced
- No comments of any kind: no inline comments, no block comments, no docstrings
- No annotations, no TODO/FIXME/NOTE markers, no section dividers
- No unused imports, no dead code, no placeholder functions
- Code must be self-explanatory through clear naming alone
- If a piece of code requires a comment to be understood, rewrite it until it does not

## Packaging
- app.py starts FastAPI in a daemon thread then opens PyWebView on port 8000
- React must be built to /backend/static/ before packaging
- PyInstaller bundles Python, FastAPI, built React files, and all dependencies
- Entry point for PyInstaller is app.py
- macOS .app packaging will be done later on a Mac using the same spec file with minor adjustments