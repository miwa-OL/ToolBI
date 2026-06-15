import { useCallback, useEffect, useId, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Activity, BarChart2, Calculator, ChevronDown, GitMerge, LayoutGrid, Loader2, Pencil,
  PieChart, Plus, Trash2, TrendingUp, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { cn } from '@/lib/utils'
import { useReportStore } from '@/store/reportStore'
import { useDatasetsStore } from '@/store/datasetsStore'
import { listComputedColumns } from '@/api/datasets'
import { getDistinctValues, runAggregation } from '@/api/query'
import type {
  AggregationType, ChartConfigOut, ChartType, ColumnSchema,
  ComputedColumn, DatasetMeta, FilterOperator, FilterSpec, JoinedDataset,
} from '@/types'

const SOLID_PALETTES: string[][] = [
  ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
  ['#3b82f6', '#1d4ed8', '#60a5fa', '#93c5fd', '#bfdbfe'],
  ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#bbf7d0'],
  ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#fed7aa'],
  ['#8b5cf6', '#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe'],
]

const GRADIENT_PALETTES: string[][] = [
  ['#007AFF|#5856D6', '#34C759|#00C389', '#FF9500|#FF3B30', '#AF52DE|#FF2D55', '#5AC8FA|#0063E5'],
  ['#FF6B6B|#FF8E53', '#FECA57|#FF9F43', '#48DBFB|#0ABDE3', '#1DD1A1|#10AC84', '#FF9FF3|#F368E0'],
  ['#00B4D8|#0077B6', '#52B788|#1B4332', '#E63946|#C1121F', '#7400B8|#6930C3', '#FFC300|#FF5733'],
  ['#F72585|#7209B7', '#4CC9F0|#4361EE', '#06D6A0|#118AB2', '#FFB703|#FB8500', '#EF233C|#D90429'],
]

const PALETTES: string[][] = [...SOLID_PALETTES, ...GRADIENT_PALETTES]

function PaletteColorSwatch({ color }: { color: string }) {
  if (color.includes('|')) {
    const [from, to] = color.split('|')
    return (
      <span
        className="w-5 h-5 rounded-sm shrink-0"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      />
    )
  }
  return <span className="w-5 h-5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
}

const CHART_TYPES: Array<{ type: ChartType; label: string; Icon: React.ElementType }> = [
  { type: 'bar', label: 'Bar', Icon: BarChart2 },
  { type: 'line', label: 'Line', Icon: Activity },
  { type: 'area', label: 'Area', Icon: TrendingUp },
  { type: 'pie', label: 'Pie', Icon: PieChart },
  { type: 'scatter', label: 'Scatter', Icon: BarChart2 },
  { type: 'heatmap', label: 'Heatmap', Icon: LayoutGrid },
]

const AGG_OPTIONS: Array<{ value: AggregationType; label: string }> = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'distinct_count', label: 'Distinct Count' },
]

const OP_OPTIONS: Array<{ value: FilterOperator; label: string }> = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'contains', label: 'contains' },
  { value: 'in', label: 'in (csv)' },
]

const TYPE_COLOR: Record<string, string> = {
  text: 'bg-blue-100 text-blue-700',
  number: 'bg-green-100 text-green-700',
  date: 'bg-orange-100 text-orange-700',
  boolean: 'bg-purple-100 text-purple-700',
}

interface FormFilter {
  field: string
  operator: FilterOperator
  valueStr: string
}

interface FormState {
  title: string
  chartType: ChartType
  datasetId: string
  xField: string
  yField: string
  aggregation: AggregationType
  groupBy: string[]
  filters: FormFilter[]
  colorField: string
  colorPalette: string[]
  sortOrder: number
}

const DEFAULT_FORM: FormState = {
  title: 'New Chart',
  chartType: 'bar',
  datasetId: '',
  xField: '',
  yField: '',
  aggregation: 'count',
  groupBy: [],
  filters: [],
  colorField: '',
  colorPalette: PALETTES[0],
  sortOrder: 0,
}

function toFilterSpec(f: FormFilter): FilterSpec {
  return {
    field: f.field,
    operator: f.operator,
    value:
      f.operator === 'in'
        ? f.valueStr.split(',').map((s) => s.trim()).filter(Boolean)
        : f.valueStr,
  }
}

function fromFilterSpec(f: FilterSpec): FormFilter {
  return {
    field: f.field,
    operator: f.operator as FilterOperator,
    valueStr: Array.isArray(f.value)
      ? (f.value as unknown[]).join(', ')
      : String(f.value ?? ''),
  }
}

function fromChartConfig(c: ChartConfigOut): FormState {
  return {
    title: c.title,
    chartType: c.chart_type as ChartType,
    datasetId: c.dataset_id,
    xField: c.x_field,
    yField: c.y_field ?? '',
    aggregation: c.aggregation as AggregationType,
    groupBy: c.group_by,
    filters: c.filters.map((f) => fromFilterSpec(f as FilterSpec)),
    colorField: c.color_field ?? '',
    colorPalette: c.color_palette.length ? c.color_palette : PALETTES[0],
    sortOrder: c.sort_order,
  }
}

function ChartPreview({ form }: { form: FormState }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!form.datasetId || !form.xField) {
      setRows([])
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const resp = await runAggregation({
          dataset_id: form.datasetId,
          x_field: form.xField,
          y_field: form.yField || null,
          aggregation: form.aggregation,
          group_by: form.groupBy.filter(Boolean),
          filters: form.filters.map(toFilterSpec),
          limit: 100,
        })
        if (!cancelled) setRows(resp.rows)
      } catch {
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [
    form.datasetId,
    form.xField,
    form.yField,
    form.aggregation,
    JSON.stringify(form.groupBy),
    JSON.stringify(form.filters),
  ])

  if (!form.datasetId || !form.xField) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#AEAEB2] select-none">
        <BarChart2 size={48} className="mb-3 opacity-20" />
        <p className="text-sm">Select a dataset and X field to preview</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-[#AEAEB2]" size={24} />
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-full text-[#AEAEB2]">
        <p className="text-sm">No data for current configuration</p>
      </div>
    )
  }

  return (
    <ChartRenderer
      chartType={form.chartType}
      xField={form.xField}
      colorPalette={form.colorPalette}
      rows={rows}
    />
  )
}

function FilterRow({
  filter,
  datasetId,
  columns,
  onChange,
  onRemove,
}: {
  filter: FormFilter
  datasetId: string
  columns: ColumnSchema[]
  onChange: (f: FormFilter) => void
  onRemove: () => void
}) {
  const uid = useId()
  const listId = `fv-${uid}`
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (!datasetId || !filter.field || filter.operator === 'in') {
      setSuggestions([])
      return
    }
    getDistinctValues(datasetId, filter.field)
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
  }, [datasetId, filter.field, filter.operator])

  return (
    <div className="flex gap-1.5 items-center">
      <select
        className="flex-1 h-8 rounded border border-black/[0.09] px-2 text-xs text-[#3A3A3C] bg-white min-w-0"
        value={filter.field}
        onChange={(e) => onChange({ ...filter, field: e.target.value })}
      >
        <option value="">Field</option>
        {columns.map((c) => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>
      <select
        className="w-24 h-8 rounded border border-black/[0.09] px-1 text-xs text-[#3A3A3C] bg-white shrink-0"
        value={filter.operator}
        onChange={(e) => onChange({ ...filter, operator: e.target.value as FilterOperator })}
      >
        {OP_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <input
        className="w-24 h-8 rounded border border-black/[0.09] px-2 text-xs text-[#3A3A3C] shrink-0"
        placeholder={filter.operator === 'in' ? 'a, b, c' : 'value'}
        value={filter.valueStr}
        list={suggestions.length ? listId : undefined}
        onChange={(e) => onChange({ ...filter, valueStr: e.target.value })}
      />
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      )}
      <button
        className="shrink-0 text-[#AEAEB2] hover:text-[#FF3B30] transition-colors"
        onClick={onRemove}
      >
        <X size={13} />
      </button>
    </div>
  )
}

function ChartStrip({
  charts,
  editingChartId,
  onSelect,
  onDelete,
  onNew,
}: {
  charts: ChartConfigOut[]
  editingChartId: string | null
  onSelect: (c: ChartConfigOut) => void
  onDelete: (id: string) => void
  onNew: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-black/[0.09] overflow-x-auto shrink-0">
      <Button variant="outline" size="sm" onClick={onNew} className="shrink-0 gap-1">
        <Plus size={13} />
        New Chart
      </Button>
      {charts.map((chart) => (
        <div
          key={chart.id}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm cursor-pointer shrink-0 transition-colors',
            editingChartId === chart.id
              ? 'border-[#007AFF]/30 bg-[#007AFF]/8 text-[#007AFF]'
              : 'border-black/[0.09] bg-white text-[#3A3A3C] hover:bg-[#F5F5F7]',
          )}
          onClick={() => onSelect(chart)}
        >
          <span className="max-w-32 truncate">{chart.title}</span>
          <button
            className="text-[#AEAEB2] hover:text-[#FF3B30] transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(chart.id)
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}

function PalettePicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (p: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const isSelected = (p: string[]) => JSON.stringify(value) === JSON.stringify(p)

  return (
    <div className="relative">
      <label className="text-xs text-[#8E8E93] mb-1.5 block">Color Palette</label>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg border border-black/[0.09] bg-white hover:bg-[#F5F5F7] transition-colors"
      >
        <div className="flex gap-1">
          {value.map((c, i) => (
            <PaletteColorSwatch key={i} color={c} />
          ))}
        </div>
        <ChevronDown
          size={12}
          className={cn('text-[#8E8E93] transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-black/[0.09] rounded-xl shadow-xl z-50 p-2 max-h-64 overflow-y-auto">
          <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-widest px-1.5 pb-1">
            Solid
          </p>
          <div className="space-y-0.5 mb-2">
            {SOLID_PALETTES.map((palette, pi) => (
              <button
                key={pi}
                className={cn(
                  'flex items-center gap-1 w-full px-1.5 py-1.5 rounded-lg border transition-colors',
                  isSelected(palette)
                    ? 'border-[#007AFF]/30 bg-[#007AFF]/8'
                    : 'border-transparent hover:bg-[#F5F5F7]',
                )}
                onClick={() => { onChange(palette); setOpen(false) }}
              >
                {palette.map((c, ci) => (
                  <PaletteColorSwatch key={ci} color={c} />
                ))}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-widest px-1.5 pb-1 border-t border-black/[0.05] pt-2">
            Gradient
          </p>
          <div className="space-y-0.5">
            {GRADIENT_PALETTES.map((palette, pi) => (
              <button
                key={pi}
                className={cn(
                  'flex items-center gap-1 w-full px-1.5 py-1.5 rounded-lg border transition-colors',
                  isSelected(palette)
                    ? 'border-[#007AFF]/30 bg-[#007AFF]/8'
                    : 'border-transparent hover:bg-[#F5F5F7]',
                )}
                onClick={() => { onChange(palette); setOpen(false) }}
              >
                {palette.map((c, ci) => (
                  <PaletteColorSwatch key={ci} color={c} />
                ))}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LeftPanel({
  datasets,
  joinedDatasets,
  form,
  columns,
  computedColumns,
  onChange,
}: {
  datasets: DatasetMeta[]
  joinedDatasets: JoinedDataset[]
  form: FormState
  columns: ColumnSchema[]
  computedColumns: ComputedColumn[]
  onChange: (u: Partial<FormState>) => void
}) {
  const computedNames = new Set(computedColumns.map((c) => c.name))
  const baseColumns = columns.filter((c) => !computedNames.has(c.name))

  return (
    <div className="w-52 shrink-0 bg-white border-r border-black/[0.09] flex flex-col">
      <div className="px-3 py-3 border-b border-black/[0.05]">
        <p className="text-xs font-medium text-[#8E8E93] mb-1.5">Dataset</p>
        <select
          className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C] bg-white"
          value={form.datasetId}
          onChange={(e) =>
            onChange({ datasetId: e.target.value, xField: '', yField: '', groupBy: [], filters: [] })
          }
        >
          <option value="">Select dataset…</option>
          <optgroup label="Datasets">
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </optgroup>
          {joinedDatasets.length > 0 && (
            <optgroup label="Joined Datasets">
              {joinedDatasets.map((j) => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {!form.datasetId && (
          <p className="px-3 py-3 text-xs text-[#AEAEB2]">Select a dataset to see columns</p>
        )}
        {form.datasetId && !columns.length && (
          <p className="px-3 py-3 text-xs text-[#AEAEB2]">No columns found</p>
        )}
        {baseColumns.map((col) => (
          <div
            key={col.name}
            className="flex items-center justify-between px-3 py-1.5 hover:bg-[#F5F5F7]"
          >
            <span className="text-sm text-[#3A3A3C] truncate mr-2 min-w-0">{col.name}</span>
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded font-medium shrink-0',
                TYPE_COLOR[col.type] ?? 'bg-[#F2F2F7] text-[#636366]',
              )}
            >
              {col.type}
            </span>
          </div>
        ))}
        {computedColumns.length > 0 && (
          <>
            <div className="px-3 pt-2 pb-1 text-xs font-medium text-[#AEAEB2] border-t border-black/[0.05] mt-1 flex items-center gap-1">
              <Calculator size={11} />
              Computed
            </div>
            {computedColumns.map((col) => (
              <div
                key={col.name}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-[#F5F5F7]"
              >
                <div className="flex items-center gap-1.5 min-w-0 mr-2">
                  <Calculator size={11} className="text-[#AEAEB2] shrink-0" />
                  <span className="text-sm text-[#3A3A3C] truncate min-w-0">{col.name}</span>
                </div>
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded font-medium shrink-0',
                    TYPE_COLOR[col.result_type] ?? 'bg-[#F2F2F7] text-[#636366]',
                  )}
                >
                  {col.result_type}
                </span>
              </div>
            ))}
          </>
        )}
        {joinedDatasets.some((j) => j.id === form.datasetId) && (
          <div className="px-3 pt-2 pb-1 text-xs text-[#AEAEB2] flex items-center gap-1">
            <GitMerge size={11} />
            Joined dataset
          </div>
        )}
      </div>
    </div>
  )
}

function SectionPanel({
  title,
  defaultOpen = true,
  rightSlot,
  children,
}: {
  title: string
  defaultOpen?: boolean
  rightSlot?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-black/[0.05]">
      <button
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-black/[0.015] transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xs font-semibold text-[#3A3A3C] tracking-wide">{title}</span>
        <div className="flex items-center gap-2">
          {rightSlot}
          <ChevronDown
            size={13}
            className={cn(
              'text-[#AEAEB2] transition-transform duration-200 shrink-0',
              open && 'rotate-180',
            )}
          />
        </div>
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function RightPanel({
  form,
  columns,
  onChange,
  saving,
  onSave,
  editingChartId,
}: {
  form: FormState
  columns: ColumnSchema[]
  onChange: (u: Partial<FormState>) => void
  saving: boolean
  onSave: () => void
  editingChartId: string | null
}) {
  return (
    <div className="w-72 shrink-0 bg-white border-l border-black/[0.09] flex flex-col overflow-y-auto">

      <SectionPanel title="Chart Type">
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          {CHART_TYPES.map(({ type, label, Icon }) => (
            <button
              key={type}
              className={cn(
                'flex flex-col items-center gap-1 py-2 rounded-md border text-xs transition-colors',
                form.chartType === type
                  ? 'border-[#007AFF]/30 bg-[#007AFF]/8 text-[#007AFF]'
                  : 'border-black/[0.09] text-[#636366] hover:bg-[#F5F5F7]',
              )}
              onClick={() => onChange({ chartType: type })}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel title="Axes">
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">X Axis</label>
          <select
            className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C] bg-white"
            value={form.xField}
            onChange={(e) => onChange({ xField: e.target.value })}
          >
            <option value="">Select field…</option>
            {columns.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        {form.chartType !== 'pie' && (
          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Y Axis</label>
            <select
              className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C] bg-white"
              value={form.yField}
              onChange={(e) => onChange({ yField: e.target.value })}
            >
              <option value="">None</option>
              {columns.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Aggregation</label>
          <select
            className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C] bg-white"
            value={form.aggregation}
            onChange={(e) => onChange({ aggregation: e.target.value as AggregationType })}
          >
            {AGG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Group By</label>
          <select
            className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C] bg-white"
            value={form.groupBy[0] ?? ''}
            onChange={(e) => onChange({ groupBy: e.target.value ? [e.target.value] : [] })}
          >
            <option value="">None</option>
            {columns.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </SectionPanel>

      <SectionPanel
        title="Filters"
        defaultOpen={false}
        rightSlot={
          <button
            className="text-xs text-[#007AFF] hover:text-[#0062CC] flex items-center gap-0.5 font-medium"
            onClick={(e) => {
              e.stopPropagation()
              onChange({
                filters: [
                  ...form.filters,
                  { field: columns[0]?.name ?? '', operator: 'eq', valueStr: '' },
                ],
              })
            }}
          >
            <Plus size={11} />
            Add
          </button>
        }
      >
        {form.filters.length === 0 && (
          <p className="text-xs text-[#AEAEB2]">No filters. Click Add to create one.</p>
        )}
        {form.filters.map((f, i) => (
          <FilterRow
            key={i}
            filter={f}
            datasetId={form.datasetId}
            columns={columns}
            onChange={(updated) =>
              onChange({ filters: form.filters.map((x, j) => (j === i ? updated : x)) })
            }
            onRemove={() => onChange({ filters: form.filters.filter((_, j) => j !== i) })}
          />
        ))}
      </SectionPanel>

      <SectionPanel title="Appearance" defaultOpen={false}>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Title</label>
          <input
            className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C]"
            value={form.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
        <PalettePicker
          value={form.colorPalette}
          onChange={(p) => onChange({ colorPalette: p })}
        />
      </SectionPanel>

      <div className="p-4 mt-auto sticky bottom-0 bg-white border-t border-black/[0.05]">
        <Button
          className="w-full gap-2"
          onClick={onSave}
          disabled={saving || !form.datasetId || !form.xField}
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          {editingChartId ? 'Update Chart' : 'Save Chart'}
        </Button>
      </div>
    </div>
  )
}

export default function ReportBuilder() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    activeReport,
    loadReport,
    createReport,
    renameActiveReport,
    addChart,
    updateChart,
    removeChart,
  } = useReportStore()
  const { datasets, joinedDatasets, fetchDatasets, fetchJoinedDatasets } = useDatasetsStore()

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [editingChartId, setEditingChartId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [computedCols, setComputedCols] = useState<ComputedColumn[]>([])

  useEffect(() => {
    fetchDatasets()
    fetchJoinedDatasets()
  }, [fetchDatasets, fetchJoinedDatasets])

  useEffect(() => {
    if (!reportId) return
    if (reportId === 'new') {
      createReport('New Report').then((s) => navigate(`/report/${s.id}`, { replace: true }))
      return
    }
    loadReport(reportId)
  }, [reportId, createReport, loadReport, navigate])

  useEffect(() => {
    if (activeReport) setNameInput(activeReport.name)
  }, [activeReport?.id])

  useEffect(() => {
    const selectChartId = (location.state as { selectChartId?: string } | null)?.selectChartId
    if (!selectChartId || !activeReport) return
    const chart = activeReport.charts.find((c) => c.id === selectChartId)
    if (chart) {
      setForm(fromChartConfig(chart))
      setEditingChartId(chart.id)
    }
  }, [activeReport?.id, location.state])

  useEffect(() => {
    if (!form.datasetId) {
      setComputedCols([])
      return
    }
    const isJoined = joinedDatasets.some((j) => j.id === form.datasetId)
    if (isJoined) {
      setComputedCols([])
      return
    }
    listComputedColumns(form.datasetId)
      .then(setComputedCols)
      .catch(() => setComputedCols([]))
  }, [form.datasetId, joinedDatasets])

  const update = useCallback((updates: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...updates }))
  }, [])

  const selectedDataset = datasets.find((d) => d.id === form.datasetId)
  const selectedJoined = joinedDatasets.find((j) => j.id === form.datasetId)
  const datasetColumns: ColumnSchema[] = selectedDataset?.columns ?? selectedJoined?.columns ?? []
  const computedColsSchema: ColumnSchema[] = computedCols.map((c) => ({
    name: c.name,
    type: c.result_type as ColumnSchema['type'],
  }))
  const columns: ColumnSchema[] = [...datasetColumns, ...computedColsSchema]

  const resetForm = () => {
    setForm({ ...DEFAULT_FORM, sortOrder: activeReport?.charts.length ?? 0 })
    setEditingChartId(null)
  }

  const loadChart = (chart: ChartConfigOut) => {
    setForm(fromChartConfig(chart))
    setEditingChartId(chart.id)
  }

  const handleSave = async () => {
    if (!form.datasetId || !form.xField) return
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        chart_type: form.chartType,
        dataset_id: form.datasetId,
        x_field: form.xField,
        y_field: form.yField || null,
        aggregation: form.aggregation,
        group_by: form.groupBy.filter(Boolean),
        filters: form.filters.map(toFilterSpec),
        color_field: form.colorField || null,
        color_palette: form.colorPalette,
        sort_order: form.sortOrder,
      }
      if (editingChartId) {
        await updateChart(editingChartId, payload)
      } else {
        const chart = await addChart(payload)
        setEditingChartId(chart.id)
      }
    } finally {
      setSaving(false)
    }
  }

  if (reportId === 'new' || !activeReport) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-[#AEAEB2]" size={32} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-black/[0.09] shrink-0">
        {editingName ? (
          <input
            className="text-xl font-semibold text-[#1C1C1E] border-b border-[#AEAEB2] outline-none bg-transparent min-w-48"
            value={nameInput}
            autoFocus
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={() => {
              setEditingName(false)
              if (nameInput.trim() && nameInput !== activeReport.name) {
                renameActiveReport(nameInput.trim())
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
          />
        ) : (
          <button className="flex items-center gap-2 group" onClick={() => setEditingName(true)}>
            <h1 className="text-xl font-semibold text-[#1C1C1E] group-hover:text-[#636366]">
              {activeReport.name}
            </h1>
            <Pencil
              size={14}
              className="text-[#AEAEB2] opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </button>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        <LeftPanel
          datasets={datasets}
          joinedDatasets={joinedDatasets}
          form={form}
          columns={columns}
          computedColumns={computedCols}
          onChange={update}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-[#F5F5F7]">
          <div className="flex-1 min-h-0 p-4">
            <ChartPreview form={form} />
          </div>
          <ChartStrip
            charts={activeReport.charts}
            editingChartId={editingChartId}
            onSelect={loadChart}
            onDelete={removeChart}
            onNew={resetForm}
          />
        </div>

        <RightPanel
          form={form}
          columns={columns}
          onChange={update}
          saving={saving}
          onSave={handleSave}
          editingChartId={editingChartId}
        />
      </div>
    </div>
  )
}
