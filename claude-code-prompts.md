# Claude Code Build Prompts — ToolBI

Each prompt is a self-contained Claude Code session. Run them in order.
Start every session by opening the project root so Claude Code can read CLAUDE.md automatically.
Every prompt already begins with reading both CLAUDE.md and PROGRESS.md — just paste and go.
Update PROGRESS.md at the end of each session as instructed in the final line of each prompt.

---

## Pre-Session: Files to Create Manually Before Starting

Create these two files in the project root before running any prompt.

### `CLAUDE.md`

```markdown
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
```
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
```

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
```

### `PROGRESS.md`

```markdown
# ToolBI — Build Progress

## Completed
_Nothing yet._

## Up Next
Session 1 — Project scaffold and environment setup
```

---

## Session 1 — Project Scaffold & Environment Setup

```
Read CLAUDE.md and PROGRESS.md before doing anything else, then set up the full project from scratch.

Create the complete folder structure defined in CLAUDE.md under the current directory.

BACKEND:
- Create backend/requirements.txt with these dependencies:
  fastapi, uvicorn[standard], pandas, pyarrow, duckdb, sqlmodel, python-multipart,
  aiofiles, pywebview, pyinstaller, pillow
- Create backend/config.py that:
  - Detects the OS using platform.system()
  - Resolves APP_DATA_DIR to a platform-appropriate writable directory:
    Windows: Path(os.environ["APPDATA"]) / "ToolBI"
    macOS: Path.home() / "Library" / "Application Support" / "ToolBI"
    Linux: Path.home() / ".local" / "share" / "ToolBI"
  - Defines DATASETS_DIR = APP_DATA_DIR / "datasets"
  - Defines DB_PATH = APP_DATA_DIR / "app.db"
  - Creates APP_DATA_DIR and DATASETS_DIR on import if they do not exist
  - Defines PORT = 8000
- Create backend/main.py with a FastAPI app that:
  - Mounts a /api/v1 router
  - Serves /backend/static as StaticFiles at "/" when the static folder exists (packaged mode)
  - Has a GET /api/v1/health endpoint returning { "status": "ok" }
  - Configures CORS to allow only http://localhost:5173 and http://localhost:8000
  - Initialises the SQLite DB on startup using SQLModel create_all
- Create backend/models.py and backend/schemas.py as empty files for now

FRONTEND:
- Scaffold a Vite + React + TypeScript project in the frontend/ directory using:
  npm create vite@latest frontend -- --template react-ts
- Install dependencies:
  npm install tailwindcss @tailwindcss/vite shadcn-ui recharts plotly.js react-plotly.js
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zustand react-router-dom axios
  @types/react-plotly.js
- Initialise Tailwind CSS following Vite integration docs
- Initialise shadcn/ui with the "slate" base color and CSS variables enabled
- Configure vite.config.ts to proxy all /api requests to http://localhost:8000
- Replace the default App.tsx with a minimal shell that renders "ToolBI is running"
  and fetches /api/v1/health on mount, logging the result to console

PACKAGING ENTRY POINT:
- Create app.py at the project root that:
  - Starts uvicorn serving the FastAPI app on 127.0.0.1:8000 in a daemon thread
  - Waits 1.5 seconds for the server to be ready
  - Opens a PyWebView window titled "ToolBI" pointing to http://127.0.0.1:8000
    with width=1400, height=900, min_size=(1024, 700)
  - Calls webview.start()

Verify everything works:
- Backend: cd backend && uvicorn main:app --reload --port 8000 — health endpoint must return 200
- Frontend: cd frontend && npm run dev — browser must show "ToolBI is running"

Update PROGRESS.md: mark Session 1 complete, describe what was built, list Session 2 as next.
```

---

## Session 2 — Backend: Dataset Upload & Management

```
Read CLAUDE.md and PROGRESS.md before doing anything else, then build the full dataset management backend.

Create backend/services/csv_parser.py with:
- parse_csv(file_path: Path) -> dict  that:
  - Reads the CSV with Pandas
  - Infers each column's type as one of: "text" | "number" | "date" | "boolean"
    using dtype inspection and pd.to_datetime attempts on object columns
  - Returns { "row_count": int, "columns": [{ "name": str, "type": str }] }
- save_as_parquet(df: DataFrame, dest_path: Path) -> None

Create backend/services/storage.py with functions to:
- init_db() — creates all SQLModel tables
- save_dataset_record(id, name, filename, row_count, columns_json) -> DatasetRecord
- list_dataset_records() -> list[DatasetRecord]
- get_dataset_record(id) -> DatasetRecord | None
- delete_dataset_record(id) -> None

Update backend/models.py with a DatasetRecord SQLModel table:
- id: str (UUID, primary key)
- name: str
- original_filename: str
- row_count: int
- columns: str (JSON string of column list)
- created_at: datetime

Update backend/schemas.py with Pydantic schemas:
- ColumnSchema: name, type
- DatasetMeta: id, name, original_filename, row_count, columns (list[ColumnSchema]), created_at
- DatasetPreview: columns (list[ColumnSchema]), rows (list[dict]), total_rows, page, page_size

Create backend/routers/datasets.py with these endpoints:

POST /api/v1/datasets/upload
  Accepts multipart/form-data with a CSV file
  Generates a UUID for the dataset
  Saves the file to a temp path, parses it, converts to parquet saved at
  DATASETS_DIR / {uuid}.parquet
  Saves metadata to SQLite
  Returns DatasetMeta

GET /api/v1/datasets
  Returns list[DatasetMeta]

GET /api/v1/datasets/{id}
  Returns DatasetMeta or 404

GET /api/v1/datasets/{id}/preview?page=1&page_size=100
  Reads the parquet file with Pandas
  Returns DatasetPreview

DELETE /api/v1/datasets/{id}
  Deletes the parquet file and the SQLite record
  Returns 204

Register the datasets router in backend/main.py.

Write a brief manual test plan in PROGRESS.md confirming each endpoint can be tested
with curl or the FastAPI /docs UI.

Update PROGRESS.md: mark Session 2 complete, list Session 3 as next.
```

---

## Session 3 — Frontend: Data Sources Page

```
Read CLAUDE.md and PROGRESS.md before doing anything else, then build the Data Sources page in the frontend.

Create frontend/src/types/index.ts with TypeScript types matching the backend schemas:
- ColumnSchema, DatasetMeta, DatasetPreview (and any others needed)

Create frontend/src/api/datasets.ts with typed async functions wrapping axios:
- uploadDataset(file: File) -> Promise<DatasetMeta>
- listDatasets() -> Promise<DatasetMeta[]>
- getDataset(id: string) -> Promise<DatasetMeta>
- previewDataset(id: string, page: number, pageSize: number) -> Promise<DatasetPreview>
- deleteDataset(id: string) -> Promise<void>

Create frontend/src/pages/DataSources.tsx:
- CSV upload zone (drag-and-drop + click to browse) using native HTML drag events
  Shows filename and size before upload, progress indicator during upload
- List of uploaded datasets showing: name, row count, column count, upload date
- Clicking a dataset row expands a preview panel showing:
  - Column list with type badges (colour-coded: blue=text, green=number, orange=date, purple=boolean)
  - Paginated data table with sortable columns (client-side sort on current page)
  - "Next page" / "Prev page" controls
- Delete button per dataset with a confirmation step before calling the API

Set up React Router in App.tsx with routes:
- / -> DataSources page
- /report/:reportId -> placeholder page (to be built in Session 6)
- /dashboard/:dashboardId -> placeholder page (to be built in Session 7)

Add a persistent left sidebar with navigation icons/labels for:
- Data Sources (/)
- Reports (/report/new)
- Dashboards (placeholder)

Use shadcn/ui components (Button, Badge, Table, Dialog for confirmations) throughout.
Use Tailwind for all layout and spacing.
The overall design should be clean and professional, dark sidebar with light content area.

Update PROGRESS.md: mark Session 3 complete, list Session 4 as next.
```

---

## Session 4 — Backend: Query Engine

```
Read CLAUDE.md and PROGRESS.md before doing anything else, then build the query engine that powers all charts.

Create backend/services/query_engine.py using DuckDB to query parquet files directly.

It must expose one primary function:

run_aggregation(
  dataset_id: str,
  x_field: str,
  y_field: str | None,
  aggregation: str,       # "count" | "sum" | "avg" | "min" | "max" | "distinct_count"
  group_by: list[str],
  filters: list[FilterSpec],
  limit: int = 1000
) -> list[dict]

Where FilterSpec is a dataclass/Pydantic model with:
  field: str
  operator: str   # "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in"
  value: any

The function must:
- Resolve the parquet path using DATASETS_DIR / f"{dataset_id}.parquet"
- Build a DuckDB SQL query dynamically from the parameters
- Sanitise all field names (alphanumeric + underscore only) before interpolating into SQL
- Use parameterised values for all filter values to prevent injection
- Return results as a list of dicts

Also expose:
run_raw_query(dataset_id: str, sql: str) -> list[dict]
  Executes arbitrary SQL against the parquet file (for power users)
  Validates that the SQL is a SELECT statement before executing

Create backend/schemas.py additions:
- FilterSpec schema
- AggregationRequest schema: dataset_id, x_field, y_field, aggregation, group_by, filters, limit
- AggregationResponse: list of result dicts + row_count

Create backend/routers/query.py:

POST /api/v1/query/aggregate
  Accepts AggregationRequest
  Returns AggregationResponse

POST /api/v1/query/raw
  Accepts { dataset_id: str, sql: str }
  Returns list of result dicts

Register the query router in backend/main.py.

Update PROGRESS.md: mark Session 4 complete, list Session 5 as next.
```

---

## Session 5 — Backend: Reports & Charts CRUD

```
Read CLAUDE.md and PROGRESS.md before doing anything else, then build the reports and chart configuration persistence layer.

A Report contains:
- Metadata (id, name, created_at, updated_at)
- An ordered list of ChartConfig records
- A layout record per chart (position and size on the dashboard canvas)

Update backend/models.py with SQLModel tables:

Report:
  id: str (UUID, primary key)
  name: str
  created_at: datetime
  updated_at: datetime

ChartConfig:
  id: str (UUID, primary key)
  report_id: str (foreign key -> Report.id)
  title: str
  chart_type: str   # "bar" | "line" | "area" | "pie" | "scatter" | "heatmap"
  dataset_id: str
  x_field: str
  y_field: str | None
  aggregation: str
  group_by: str     # JSON array
  filters: str      # JSON array of FilterSpec
  color_field: str | None
  color_palette: str   # JSON array of hex strings
  sort_order: int

LayoutItem:
  id: str (UUID, primary key)
  report_id: str
  chart_id: str
  x: int
  y: int
  w: int
  h: int

Update backend/schemas.py with full request/response schemas for all three models.
Include a ReportDetail schema that nests ChartConfig list and LayoutItem list.

Add CRUD functions to backend/services/storage.py for Report, ChartConfig, LayoutItem.

Create backend/routers/reports.py:

POST   /api/v1/reports                    Create report (name only to start)
GET    /api/v1/reports                    List all reports (summary, no charts)
GET    /api/v1/reports/{id}              Full report with charts and layout
PUT    /api/v1/reports/{id}              Update report name
DELETE /api/v1/reports/{id}             Delete report and all its charts and layout items

POST   /api/v1/reports/{id}/charts              Add chart to report
PUT    /api/v1/reports/{id}/charts/{chart_id}   Update chart config
DELETE /api/v1/reports/{id}/charts/{chart_id}   Remove chart from report

PUT    /api/v1/reports/{id}/layout       Replace full layout (array of LayoutItems)

Register the reports router in backend/main.py.

Update PROGRESS.md: mark Session 5 complete, list Session 6 as next.
```

---

## Session 6 — Frontend: Chart Builder & Report Page

```
Read CLAUDE.md and PROGRESS.md before doing anything else, then build the Report Builder page where users create and configure charts.

Create frontend/src/api/reports.ts and frontend/src/api/query.ts with typed wrappers
for all endpoints from Sessions 4 and 5.

Create frontend/src/store/reportStore.ts using Zustand to hold:
- Current report (ReportDetail)
- Currently selected chart id
- Actions: setReport, addChart, updateChart, removeChart, setLayout

Create frontend/src/pages/ReportBuilder.tsx:

LEFT PANEL — Dataset & Field Selector:
  - Dropdown to select an uploaded dataset
  - Once selected, shows all columns with their type badges
  - Columns are draggable onto axis drop zones

CENTER — Chart Preview:
  - Renders the currently configured chart live as settings change
  - Shows a loading spinner while fetching aggregation data
  - Shows an empty state illustration when no fields are configured yet

RIGHT PANEL — Chart Configuration:
  Chart type selector (icon buttons): Bar, Line, Area, Pie, Scatter, Heatmap
  
  Axis configuration:
  - X Axis: field selector dropdown, shows only applicable field types per chart type
  - Y Axis: field selector dropdown + aggregation selector
    (Count, Sum, Avg, Min, Max, Distinct Count)
  - Color / Group By: optional field selector
  
  Filters section:
  - Add filter button → opens a row with: field selector, operator selector, value input
  - Multiple filters supported
  - Remove button per filter row
  
  Appearance section:
  - Chart title input
  - Color palette: 5 preset palettes + custom hex input

  Save Chart button → calls POST /api/v1/reports/{id}/charts

Chart rendering rules:
- Bar, Line, Area: use Recharts (ResponsiveContainer, BarChart/LineChart/AreaChart)
  with XAxis, YAxis, Tooltip, Legend
- Pie: use Recharts PieChart with Tooltip and Legend
- Scatter: use Plotly.js scatter trace
- Heatmap: use Plotly.js heatmap trace

Below the chart preview, show a horizontal list of all charts in the current report.
Clicking a chart in the list loads it into the editor panel for modification.
Each chart in the list has a delete button.

The report name is editable inline at the top of the page (click to edit, blur to save).

Update the React Router so /report/new creates a new report via the API then redirects
to /report/{id}, and /report/:reportId loads the existing report.

Update the sidebar navigation to show a list of saved reports under the Reports section,
fetched on sidebar mount.

Update PROGRESS.md: mark Session 6 complete, list Session 7 as next.
```

---

## Session 7 — Frontend: Dashboard Canvas

```
Read CLAUDE.md and PROGRESS.md before doing anything else, then build the Dashboard view where all charts in a report are displayed on a resizable, draggable canvas.

A Report IS the dashboard — the same report that was configured in the Report Builder
is displayed here in a free-form layout.

Create frontend/src/pages/Dashboard.tsx:

CANVAS:
- Uses dnd-kit (@dnd-kit/core, @dnd-kit/sortable) for drag-and-drop
- Each chart is a ChartWidget card that can be dragged to reposition
- Layout is a grid: 12 columns, rows of 80px
- Each widget has a resize handle (bottom-right corner) for changing w and h
- After any drag or resize, call PUT /api/v1/reports/{id}/layout to persist positions
- Widgets render their chart using the same Recharts/Plotly components from Session 6
  (extract them into frontend/src/components/charts/ so they are shared)

CHART WIDGET CARD:
- Header: chart title, edit icon (navigates back to ReportBuilder with that chart selected),
  remove icon
- Body: the rendered chart, filling the card
- Loading skeleton while data is being fetched
- Error state if the query fails

TOOLBAR (top of dashboard):
- Report name (read-only display)
- "Edit Report" button → navigates to /report/{id}
- "Add Chart" button → navigates to /report/{id} in chart-add mode
- "Export" button → placeholder for Session 11

DATA FETCHING:
- On mount, load the full ReportDetail
- For each ChartConfig, call POST /api/v1/query/aggregate with its configuration
- Store chart data in local component state keyed by chart id
- Refetch a chart's data when its config changes

Update React Router:
- /dashboard/:reportId loads Dashboard for that report
- The sidebar "Dashboards" section lists all reports, linking to their dashboard view

Update PROGRESS.md: mark Session 7 complete, list Session 8 as next.
```

---

## Session 8 — Filters & Cross-Filtering

```
Read CLAUDE.md and PROGRESS.md before doing anything else, then add global filtering and cross-filtering to the Dashboard and Report Builder.

GLOBAL FILTER PANEL:
Create frontend/src/components/FilterPanel.tsx:
- Collapsible side panel on the Dashboard (toggle button in toolbar)
- Automatically generates filter controls for every field used across all charts in the report
- For "date" fields: date range picker (two date inputs, from/to)
- For "text" fields with low cardinality (≤ 50 distinct values): multi-select dropdown
  (fetch distinct values via a new backend endpoint)
- For "text" fields with high cardinality: text contains input
- For "number" fields: min/max range inputs
- "Apply Filters" button sends the current filter state to the store
- "Clear All" button resets all filters

Add a Zustand store slice for active dashboard filters.

When filters are applied, re-fetch all chart data with the global filters merged into
each chart's own filter list (global filters take precedence on the same field).

CROSS-FILTERING:
When a user clicks a bar, slice, or data point on any chart:
- Extract the x-axis value of the clicked element
- Push a filter { field: xField, operator: "eq", value: clickedValue } into the
  dashboard filter store as a "cross-filter"
- All other charts re-fetch with this cross-filter applied
- The clicked element is visually highlighted (full opacity) while others dim (40% opacity)
- Clicking the same element again removes the cross-filter
- Cross-filters are shown as removable chips in the filter panel

BACKEND ADDITION:
Add to backend/routers/query.py:

GET /api/v1/query/distinct-values?dataset_id={id}&field={field}
  Returns up to 50 distinct values for a field, sorted alphabetically

Update PROGRESS.md: mark Session 8 complete, list Session 9 as next.
```

---

## Session 9 — Computed Columns & Dataset Joins

```
Read CLAUDE.md and PROGRESS.md before doing anything else, then add computed columns and dataset join capabilities.

COMPUTED COLUMNS:

Backend:
Add a ComputedColumn SQLModel table:
  id: str (UUID)
  dataset_id: str
  name: str
  expression: str   # e.g. "revenue / quantity" or "price * 1.2"
  result_type: str  # "number" | "text" | "boolean"

Add to backend/services/query_engine.py:
  validate_expression(expression: str, dataset_id: str) -> bool
    Uses DuckDB to dry-run the expression against the parquet file
    Returns True if valid, False if error
  The run_aggregation function must inject computed columns as DuckDB
  virtual columns (using SELECT *, {expression} AS {name} FROM ...)

Add to backend/routers/datasets.py:
  POST /api/v1/datasets/{id}/computed-columns     Create computed column
  GET  /api/v1/datasets/{id}/computed-columns     List computed columns
  DELETE /api/v1/datasets/{id}/computed-columns/{col_id}

Frontend:
In DataSources.tsx, add a "Computed Columns" section per dataset:
  - Shows existing computed columns with their expression and type
  - "Add Computed Column" button opens a dialog with:
    - Name input
    - Expression input (e.g. "price * quantity")
    - "Validate" button (calls backend to dry-run)
    - Green/red validation status before allowing save
    - Result type selector
  - Delete button per computed column

In ReportBuilder.tsx, computed columns appear in the field list with a calculator icon.

DATASET JOINS:

Backend:
Add a JoinedDataset SQLModel table:
  id: str (UUID)
  name: str
  left_dataset_id: str
  right_dataset_id: str
  left_key: str
  right_key: str
  join_type: str   # "inner" | "left" | "right"
  created_at: datetime

Add to backend/services/query_engine.py:
  run_aggregation must also accept a joined_dataset_id
  When provided, it joins the two parquets in DuckDB before aggregating:
  SELECT * FROM read_parquet(left) {join_type} JOIN read_parquet(right)
  ON left.{left_key} = right.{right_key}

Add to backend/routers/datasets.py:
  POST /api/v1/datasets/join     Create a joined dataset definition
  GET  /api/v1/datasets/joined   List joined datasets
  DELETE /api/v1/datasets/joined/{id}

Frontend:
In DataSources.tsx, add a "Joined Datasets" section:
  - "Create Join" button opens a dialog with:
    - Name input
    - Left dataset selector + key column selector
    - Join type selector (Inner, Left, Right)
    - Right dataset selector + key column selector
    - Preview button (shows first 20 rows of the join result)
    - Save button

Joined datasets appear in the ReportBuilder dataset selector with a join icon.

Update PROGRESS.md: mark Session 9 complete, list Session 10 as next.
```

---

## Session 10 — PyWebView + PyInstaller Packaging

```
Read CLAUDE.md and PROGRESS.md before doing anything else, then complete the packaging setup for Windows distribution.

FINALISE app.py at the project root:
- Import threading, time, uvicorn, webview, and the FastAPI app from backend/main.py
- Start uvicorn on 127.0.0.1:8000 in a daemon thread
- Poll http://127.0.0.1:8000/api/v1/health in a loop (max 10 attempts, 0.5s apart)
  until the server responds, then open the PyWebView window
- If health check fails after 10 attempts, show a native error dialog and exit
- PyWebView window: title="ToolBI", url="http://127.0.0.1:8000",
  width=1400, height=900, min_size=(1024, 700), confirm_close=True

UPDATE backend/main.py:
- When the /backend/static directory exists (packaged mode), serve it as StaticFiles at "/"
- Add a catch-all route that returns the static index.html for all non-API paths
  (enables React Router to work in packaged mode)

CREATE build.py at the project root:
- Step 1: Run `npm run build` in the frontend/ directory
- Step 2: Copy the frontend/dist/ output to backend/static/
- Step 3: Run PyInstaller with the spec file
- Step 4: Print the output path

CREATE toolbi.spec (PyInstaller spec file):
- Entry point: app.py
- Name: ToolBI
- Windowed mode (no console window): windowed=True
- One-directory mode (not one-file, for faster startup and easier debugging)
- Include datas:
  - backend/static -> static   (built React app)
  - data -> data               (initial data directory, can be empty)
- Hidden imports: uvicorn.logging, uvicorn.loops, uvicorn.loops.auto,
  uvicorn.protocols, uvicorn.protocols.http, uvicorn.protocols.http.auto,
  uvicorn.lifespan, uvicorn.lifespan.on, sqlmodel, duckdb, pyarrow, pandas,
  webview, webview.platforms.winforms
- Exclude unnecessary large packages from the bundle to reduce size:
  matplotlib, scipy, sklearn, notebook, IPython, pytest

Note a clear comment in build.py (exception to the no-comments rule as it is a
user-facing script, not application logic) explaining:
  "For macOS: run this same script on a Mac. The spec file targets both platforms.
   Replace winforms hidden import with webview.platforms.cocoa.
   Sign the resulting .app with: codesign --deep --force --sign - dist/ToolBI.app"

TEST:
- Run python build.py
- Launch dist/ToolBI/ToolBI.exe
- Verify: upload a CSV, build a chart, save a report, view dashboard
- Verify data is written to the correct APP_DATA_DIR for the platform

Update PROGRESS.md: mark Session 10 complete, list Session 11 as next.
```

---

## Session 11 — Polish, Export & Error Handling

```
Read CLAUDE.md and PROGRESS.md before doing anything else, then complete the final polish pass.

EXPORT:

Backend:
Add to backend/routers/reports.py:

GET /api/v1/reports/{id}/export/csv
  Runs all chart queries in the report and returns a ZIP file containing
  one CSV per chart (named by chart title)

Frontend:
Implement the Export button in the Dashboard toolbar with two options:
  "Export Chart Data as CSV" → calls the backend export endpoint, triggers download
  "Export Dashboard as PNG" → uses the browser's html2canvas library
    (add html2canvas to package.json) to capture the dashboard canvas div
    and triggers a PNG download named {report-name}-{date}.png

ERROR HANDLING:

Frontend:
- Create frontend/src/components/ErrorBoundary.tsx (React error boundary)
  Wrap the Router in App.tsx with it
  Shows a user-friendly error card with a "Reload App" button
- Every API call in the api/ layer must catch errors and throw typed ApiError objects
  with { status: number, detail: string }
- Add a global toast notification system (use shadcn/ui Toaster + toast())
  Show error toasts for failed API calls throughout the app
- Show empty state illustrations (SVG inline, not external images) for:
  - No datasets uploaded yet (DataSources page)
  - No charts in a report (ReportBuilder)
  - No reports created yet (Dashboard list)

LOADING STATES:
- Every data fetch must show a skeleton loader (shadcn/ui Skeleton component)
  not a spinner — skeletons for tables, chart areas, and sidebar lists
- The CSV upload zone must show a real progress bar using axios onUploadProgress

COLOUR PALETTE PICKER:
In ReportBuilder chart configuration panel:
- Add 8 preset named palettes: Default, Ocean, Forest, Sunset, Monochrome,
  Pastel, Vivid, Corporate
- Each palette is an array of 8 hex colours applied in order to chart series
- A custom palette option lets the user add/remove/reorder hex swatches
- Palette selection updates the chart preview live

PERFORMANCE:
- In Dashboard.tsx, wrap each ChartWidget in React.memo
- In query fetches, cache results in the Zustand store keyed by
  { chartId, filters hash } and only refetch when the key changes

FINAL QA CHECKLIST — verify each item works end to end:
  [ ] Upload a CSV with mixed column types → correct type inference
  [ ] Preview a large CSV (10k+ rows) → pagination works
  [ ] Build a bar chart, line chart, pie chart, scatter chart
  [ ] Apply global filters → all charts update
  [ ] Click a bar → cross-filter activates on other charts
  [ ] Create a computed column → appears as chartable field
  [ ] Join two datasets → joinable dataset usable in chart builder
  [ ] Save and reload a report → all charts and layout restored correctly
  [ ] Run python build.py → packaged app launches and all features work
  [ ] Packaged app data persists across restarts

Update PROGRESS.md: mark Session 11 complete and the MVP as DONE.
Mark future work: macOS packaging, user-defined SQL mode, additional chart types.
```

---

## Quick Reference: Session Order

| # | Session | Key Output |
|---|---------|------------|
| 1 | Scaffold & Environment | Full folder structure, both servers running, PyWebView entry point |
| 2 | Backend: Datasets | Upload, parse, store as Parquet, SQLite metadata |
| 3 | Frontend: Data Sources | Upload UI, dataset list, data preview table |
| 4 | Backend: Query Engine | DuckDB aggregation and filtering |
| 5 | Backend: Reports CRUD | Report, ChartConfig, LayoutItem persistence |
| 6 | Frontend: Chart Builder | Chart config UI, live preview, Recharts + Plotly rendering |
| 7 | Frontend: Dashboard | dnd-kit canvas, resizable widgets, layout persistence |
| 8 | Filters & Cross-filtering | Global filter panel, click-to-filter between charts |
| 9 | Computed Columns & Joins | Expression-based columns, multi-dataset joins |
| 10 | Packaging | PyInstaller Windows .exe, build script, macOS notes |
| 11 | Polish & Export | CSV/PNG export, error boundaries, toasts, skeletons, QA |
