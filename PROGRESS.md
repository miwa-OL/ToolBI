# ToolBI — Build Progress

## Completed

### Session 1 — Project scaffold (2026-06-03)
Vite + FastAPI skeleton, Tailwind v4, shadcn/ui CSS variables, PyWebView entry point.

### Session 2 — Dataset management backend (2026-06-03)
CSV upload → parse → Parquet; SQLite metadata; five CRUD endpoints; pandas 3.x `dtype=str` fix.

### Session 3 — Data Sources frontend (2026-06-03)
Types, axios wrappers, Zustand store, Button/Badge/Dialog UI primitives, drag-and-drop DataSources page with expandable preview panel and delete confirmation. `npm run build` → zero errors.

### Session 4 — Query engine + DuckDB (2026-06-05)
`run_aggregation` + `run_raw_query` with parameterised filters, field-name validation, datetime serialisation. Two endpoints: POST /query/aggregate and POST /query/raw.

---

### Session 5 — Reports & chart config persistence (2026-06-05)

**`backend/models.py`** — three new SQLModel tables:
- `Report` — id (PK), name, created_at, updated_at
- `ChartConfig` — id (PK), report_id (FK→report.id), title, chart_type, dataset_id, x_field, y_field, aggregation, group_by (JSON str), filters (JSON str), color_field, color_palette (JSON str), sort_order
- `LayoutItem` — id (PK), report_id (FK→report.id), chart_id (FK→chartconfig.id), x, y, w, h

**`backend/schemas.py`** additions:
- `ReportCreate` / `ReportUpdate` — `{name}`
- `ReportSummary` — id, name, chart_count, created_at, updated_at
- `ChartConfigCreate` — all chart fields with typed Literals for chart_type and aggregation
- `ChartConfigOut` — same + id + report_id; JSON arrays deserialized to typed lists
- `LayoutItemIn` / `LayoutItemOut`
- `ReportDetail` — full nested report: id/name/timestamps + `charts: list[ChartConfigOut]` + `layout: list[LayoutItemOut]`

**`backend/services/storage.py`** additions:
- `create_report`, `list_reports`, `get_report`, `update_report_name`, `delete_report` (cascades LayoutItem + ChartConfig in one transaction)
- `count_charts(report_id)` (for ReportSummary chart_count)
- `list_charts`, `get_chart`, `add_chart`, `update_chart`, `delete_chart` — all chart mutation functions bump parent `report.updated_at` in the same session
- `list_layout`, `replace_layout` — atomically clears old layout rows and inserts new ones; bumps `report.updated_at`

**`backend/routers/reports.py`** — 9 endpoints registered under `/api/v1/reports`:
| Method | Path | Action |
|--------|------|--------|
| POST | /reports | Create report → 201 ReportSummary |
| GET | /reports | List all → list[ReportSummary] |
| GET | /reports/{id} | Full detail → ReportDetail |
| PUT | /reports/{id} | Rename → ReportSummary |
| DELETE | /reports/{id} | Delete + cascade → 204 |
| POST | /reports/{id}/charts | Add chart → 201 ChartConfigOut |
| PUT | /reports/{id}/charts/{cid} | Update chart → ChartConfigOut |
| DELETE | /reports/{id}/charts/{cid} | Remove chart → 204 |
| PUT | /reports/{id}/layout | Replace full layout → list[LayoutItemOut] |

Chart ownership is verified on update/delete (chart.report_id must match path report_id → else 404).

**`backend/main.py`** — reports router registered.

**All cases live-tested:**
- Full CRUD lifecycle: create → rename → add 2 charts with filters/palette → update chart → set layout → GET detail (nested charts + layout) → delete chart → cascade delete report
- `updated_at` correctly bumped on rename, chart add/update/delete, layout replace
- 404 on GET/DELETE/PUT against missing or already-deleted resources
- `GET /reports` returns `[]` after cascade delete

---

---

### Session 6 — Report Builder frontend (2026-06-08)

**`frontend/src/types/index.ts`** additions:
- `ChartType`, `AggregationType`, `FilterOperator`, `FilterSpec`
- `ChartConfigCreate`, `ChartConfigOut`, `LayoutItemIn`, `LayoutItemOut`
- `ReportSummary`, `ReportDetail`, `AggregationRequest`, `AggregationResponse`

**`frontend/src/api/query.ts`** — `runAggregation`, `runRawQuery`

**`frontend/src/api/reports.ts`** — typed wrappers for all 9 report endpoints:
`createReport`, `listReports`, `getReport`, `renameReport`, `deleteReport`,
`addChart`, `updateChart`, `deleteChart`, `setLayout`

**`frontend/src/store/reportStore.ts`** — Zustand store:
- `reports`, `activeReport`, `selectedChartId`
- `fetchReports`, `loadReport`, `createReport`, `renameActiveReport`, `deleteReport`
- `addChart`, `updateChart`, `removeChart`, `setLayout`

**`frontend/src/pages/ReportBuilder.tsx`** — full three-panel layout:
- Left panel: dataset dropdown + column list with type-coloured badges
- Center: live chart preview (400ms debounce on config changes) + chart strip
- Right panel: chart type picker, X/Y/aggregation/group-by selectors, filter rows (add/remove), color palette presets, Save/Update Chart button
- Report name: inline-editable (click → input, blur/Enter → saves via API)
- Chart type routing: Bar/Line/Area/Pie → Recharts; Scatter/Heatmap → Plotly.js
- `/report/new` creates a report then redirects to `/report/{id}`
- Loading spinner while report is being fetched or created

**`frontend/src/components/Sidebar.tsx`** — updated:
- Reports section with per-report NavLinks fetched on mount
- `+` button to create a new report

**`frontend/src/App.tsx`** — `/report/:reportId` now renders `ReportBuilder`

**`frontend/vite.config.ts`** — added `optimizeDeps.include` for `react-plotly.js` and `plotly.js`

**`npm run build` → zero TypeScript errors, zero lint errors**

---

---

### Session 7 — Dashboard canvas (2026-06-10)

**`frontend/src/components/charts/ChartRenderer.tsx`** — extracted shared chart rendering:
- All 6 chart types (bar/line/area/pie → Recharts; scatter/heatmap → Plotly.js)
- Props: `chartType`, `xField`, `colorPalette`, `rows`
- Used by both ReportBuilder and Dashboard

**`frontend/src/pages/ReportBuilder.tsx`** — updated:
- `ChartPreview` now delegates rendering to `ChartRenderer`
- Accepts `location.state.selectChartId` to pre-select a chart on navigation from Dashboard

**`frontend/src/pages/Dashboard.tsx`** — full dashboard canvas:
- `DndContext` + `PointerSensor` (5px activation constraint) from `@dnd-kit/core`
- `DraggableWidget` cards: drag via header (grab cursor), resize via bottom-right handle
- Grid: 12 columns × 80px rows; absolute positioning with `translate3d` during drag
- Smooth snap transition (0.12s) after drag/resize ends
- On `DragEnd`: snaps to nearest grid cell, persists via `PUT /api/v1/reports/{id}/layout`
- On resize: live preview during mouse-drag, persists on mouseup
- Auto-generates default 6×4 layout items for charts with no saved position; immediately persists
- Per-widget `ChartData` state: parallel `runAggregation` calls on mount, loading skeleton + error state
- Toolbar: report name (read-only), Edit Report, Add Chart (both → `/report/{id}`), Export (disabled placeholder)
- Empty state with link to Report Builder when no charts exist

**`frontend/src/components/Sidebar.tsx`** — updated:
- Reports section: NavLinks to `/report/{id}` with `+` new-report button
- Dashboards section: same report list, NavLinks to `/dashboard/{id}`

**`frontend/src/App.tsx`** — `/dashboard/:reportId` now renders `Dashboard`

**`npm run build` → zero TypeScript errors**

---

---

### Session 8 — Global filtering and cross-filtering (2026-06-15)

**`backend/services/query_engine.py`** addition:
- `get_distinct_values(dataset_id, field)` — fetches up to 50 distinct string values for a field, sorted alphabetically, using DuckDB

**`backend/routers/query.py`** addition:
- `GET /api/v1/query/distinct-values?dataset_id={id}&field={field}` — returns `list[str]`

**`frontend/src/api/query.ts`** addition:
- `getDistinctValues(datasetId, field)` — typed GET wrapper

**`frontend/src/store/filterStore.ts`** — new Zustand store:
- `GlobalFilterValue` discriminated union: `date` (from/to), `multiselect` (values[]), `contains` (text), `range` (min/max)
- `CrossFilter` interface: `{ sourceChartId, xField, value }`
- Actions: `setApplied`, `clearAll`, `toggleCross`, `reset` (smart no-op when already empty)
- `globalFiltersToSpecs(applied)` helper — converts store state to `FilterSpec[]`

**`frontend/src/components/FilterPanel.tsx`** — new collapsible side panel:
- Auto-discovers filterable fields from chart configs passed by Dashboard
- Per-field controls: date → two date inputs; text (< 50 distinct) → checkboxes; text (≥ 50) → text contains; number → min/max; boolean → select
- Fetches distinct values via `getDistinctValues` for text fields on mount
- Active cross-filter shown as removable chip
- Local `localFilters` state with Apply / Clear All buttons

**`frontend/src/components/charts/ChartRenderer.tsx`** updates:
- New props: `onPointClick?: (xField, value) => void`, `crossFilterValue?: unknown`
- Bar: `onClick` handler + `Cell` opacity dimming when `crossFilterValue` set
- Pie: `onClick` handler + per-`Cell` opacity dimming
- Scatter (Plotly): `onClick` handler + per-marker color dimming

**`frontend/src/pages/Dashboard.tsx`** updates:
- `useFilterStore` for `applied`, `crossFilter`, `toggleCross`, `reset`
- `useDatasetsStore` to resolve field types for FilterPanel
- `fetchSingleChart` — per-chart fetch that merges extra filters over chart's own
- Single data-fetch effect on `[activeReport?.id, charts.length, applied, crossFilter]`; source chart excluded from cross-filter aggregation
- `filterFields` memo: unique `{ field, type, datasetId }` from all chart x_fields + group_bys
- Toolbar: "Filters" toggle button with active-count badge
- Layout: canvas + collapsible `FilterPanel` side-by-side
- `crossFilterValue` prop per widget: highlights bars matching the cross-filter's x-field

**`npm run build` → zero TypeScript errors**

---

### Session 9 — Computed columns and dataset joins (2026-06-15)

**`backend/models.py`** additions:
- `ComputedColumn` — id (PK), dataset_id, name, expression, result_type
- `JoinedDataset` — id (PK), name, left_dataset_id, right_dataset_id, left_key, right_key, join_type, created_at

**`backend/schemas.py`** additions:
- `ComputedColumnCreate` / `ComputedColumnOut`
- `JoinedDatasetCreate` / `JoinedDatasetOut` (includes merged `columns: list[ColumnSchema]`)
- `JoinPreviewResponse` — `{ columns, rows }` for previewing a join before saving

**`backend/services/storage.py`** additions:
- `add_computed_column`, `list_computed_columns`, `get_computed_column`, `delete_computed_column`
- `create_joined_dataset`, `list_joined_datasets`, `get_joined_dataset`, `delete_joined_dataset`

**`backend/services/query_engine.py`** rewrite:
- `resolve_parquet` (renamed from private `_resolve_parquet`)
- `validate_expression(expression, dataset_id) -> tuple[bool, str | None]` — DuckDB dry-run
- `_build_from(dataset_id, join_spec, computed_columns)` — unified FROM clause builder for single parquet, JOIN, or either with computed column wrapping
- `run_aggregation` updated: `computed_columns` and `join_spec` optional kwargs

**`backend/routers/query.py`** updates:
- `POST /aggregate` — auto-detects regular vs joined dataset; injects computed columns or join spec accordingly
- `GET /validate-expression?dataset_id=&expression=` — returns `{ valid, error }`

**`backend/routers/datasets.py`** additions (route order preserved: static before parameterized):
- `POST /datasets/join` — create joined dataset definition
- `POST /datasets/join-preview` — preview 20 rows without saving
- `GET /datasets/joined` — list all joined datasets (includes merged columns)
- `DELETE /datasets/joined/{id}`
- `POST /datasets/{id}/computed-columns` — validate then persist
- `GET /datasets/{id}/computed-columns`
- `DELETE /datasets/{id}/computed-columns/{col_id}`

**`frontend/src/types/index.ts`** additions:
- `ComputedColumn`, `JoinedDataset`

**`frontend/src/api/datasets.ts`** additions:
- `listComputedColumns`, `createComputedColumn`, `deleteComputedColumn`
- `listJoinedDatasets`, `createJoin`, `deleteJoinedDataset`, `previewJoin`

**`frontend/src/api/query.ts`** addition:
- `validateExpression(datasetId, expression)`

**`frontend/src/store/datasetsStore.ts`** additions:
- `joinedDatasets`, `fetchJoinedDatasets`, `createJoin`, `removeJoin`

**`frontend/src/pages/DataSources.tsx`** additions:
- Per-dataset computed columns section in expanded row: list + add dialog (name, expression, validate button with green/red status, result type)
- Joined Datasets section below datasets table: list with create/delete
- Create Join dialog: left/right dataset+key selectors, join type, preview table (20 rows)

**`frontend/src/pages/ReportBuilder.tsx`** updates:
- Dataset selector uses `<optgroup>` to show Datasets and Joined Datasets separately
- Fetches computed columns for selected regular dataset; appends as ColumnSchema to combined columns
- Left panel shows computed columns with Calculator icon under "Computed" separator
- All axis/filter/group-by selectors see full combined column list

**`npm run build` → zero TypeScript errors**

---

## Up Next

### Session 10 — Polish & UX improvements
- Delete report from sidebar (right-click or trash icon)
- Report list sorted by `updated_at` desc
- Dashboard: grid snap indicator lines while dragging
- Dashboard: "Export as PNG" via html2canvas
- DataSources: column search/filter in preview panel
- Global error toast notifications (axios interceptor → toast)
- Empty-state illustrations for Data Sources and Dashboard
- Keyboard shortcuts: `Escape` to cancel rename, `Ctrl+S` to save chart
