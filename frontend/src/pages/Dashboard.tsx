import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { BarChart2, Download, Filter, Loader2, Pencil, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { FilterPanel, type FilterField } from '@/components/FilterPanel'
import { cn } from '@/lib/utils'
import { useReportStore } from '@/store/reportStore'
import { useDatasetsStore } from '@/store/datasetsStore'
import { globalFiltersToSpecs, useFilterStore } from '@/store/filterStore'
import { runAggregation } from '@/api/query'
import { setLayout as apiSetLayout } from '@/api/reports'
import type {
  AggregationType, ChartConfigOut, ChartType,
  FilterOperator, FilterSpec, LayoutItemOut, ReportDetail,
} from '@/types'

const ROW_H = 80

interface ChartData {
  rows: Record<string, unknown>[]
  loading: boolean
  error: boolean
}

function buildInitialLayout(report: ReportDetail, prev: LayoutItemOut[]): LayoutItemOut[] {
  const prevMap = new Map(prev.map((i) => [i.chart_id, i]))
  const reportMap = new Map(report.layout.map((i) => [i.chart_id, i]))

  let autoIdx = 0
  const maxY =
    report.layout.length > 0
      ? Math.max(...report.layout.map((i) => i.y + i.h))
      : 0

  return report.charts.map((c) => {
    if (prevMap.has(c.id)) return prevMap.get(c.id)!
    if (reportMap.has(c.id)) return reportMap.get(c.id)!
    const item: LayoutItemOut = {
      id: `auto-${c.id}`,
      report_id: report.id,
      chart_id: c.id,
      x: (autoIdx % 2) * 6,
      y: maxY + Math.floor(autoIdx / 2) * 4,
      w: 6,
      h: 4,
    }
    autoIdx++
    return item
  })
}

function DraggableWidget({
  item,
  chart,
  data,
  colW,
  onEdit,
  onRemove,
  onResize,
  onPointClick,
  crossFilterValue,
}: {
  item: LayoutItemOut
  chart: ChartConfigOut
  data: ChartData
  colW: number
  onEdit: () => void
  onRemove: () => void
  onResize: (chartId: string, w: number, h: number) => void
  onPointClick?: (xField: string, value: unknown) => void
  crossFilterValue?: unknown
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.chart_id,
  })

  const colWRef = useRef(colW)
  colWRef.current = colW
  const itemRef = useRef(item)
  itemRef.current = item

  const [resizeSize, setResizeSize] = useState<{ w: number; h: number } | null>(null)

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const startX = e.clientX
      const startY = e.clientY
      const startW = itemRef.current.w
      const startH = itemRef.current.h
      const startItemX = itemRef.current.x
      const sizeTracker = { w: startW, h: startH }

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        const newW = Math.max(2, Math.min(12 - startItemX, Math.round(startW + dx / colWRef.current)))
        const newH = Math.max(2, Math.round(startH + dy / ROW_H))
        sizeTracker.w = newW
        sizeTracker.h = newH
        setResizeSize({ w: newW, h: newH })
      }

      const onUp = () => {
        onResize(itemRef.current.chart_id, sizeTracker.w, sizeTracker.h)
        setResizeSize(null)
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [onResize],
  )

  const displayW = resizeSize?.w ?? item.w
  const displayH = resizeSize?.h ?? item.h

  const style: React.CSSProperties = {
    position: 'absolute',
    left: item.x * colW,
    top: item.y * ROW_H,
    width: displayW * colW,
    height: displayH * ROW_H,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 100 : 1,
    transition: isDragging || resizeSize ? 'none' : 'left 0.12s, top 0.12s',
    boxSizing: 'border-box',
    padding: 6,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className={cn(
          'h-full bg-white rounded-lg border border-black/[0.09] flex flex-col overflow-hidden group',
          isDragging ? 'shadow-xl ring-2 ring-indigo-300' : 'shadow-sm',
        )}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 border-b border-black/[0.05] shrink-0 select-none"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          {...listeners}
        >
          <span className="text-sm font-medium text-[#3A3A3C] truncate flex-1">{chart.title}</span>
          <button
            className="shrink-0 text-[#AEAEB2] hover:text-[#007AFF] transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onEdit() }}
          >
            <Pencil size={13} />
          </button>
          <button
            className="shrink-0 text-[#AEAEB2] hover:text-red-500 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove() }}
          >
            <X size={13} />
          </button>
        </div>

        <div className="flex-1 min-h-0 relative p-2">
          {data.loading && (
            <div className="absolute inset-0 flex flex-col gap-2 p-3">
              <div className="h-3 bg-[#F2F2F7] animate-pulse rounded w-3/4" />
              <div className="flex-1 bg-[#F2F2F7] animate-pulse rounded" />
            </div>
          )}
          {!data.loading && data.error && (
            <div className="flex items-center justify-center h-full text-xs text-red-400">
              Failed to load chart data
            </div>
          )}
          {!data.loading && !data.error && !data.rows.length && (
            <div className="flex items-center justify-center h-full text-xs text-[#AEAEB2]">
              No data
            </div>
          )}
          {!data.loading && !data.error && data.rows.length > 0 && (
            <ChartRenderer
              chartType={chart.chart_type as ChartType}
              xField={chart.x_field}
              colorPalette={chart.color_palette}
              rows={data.rows}
              onPointClick={onPointClick}
              crossFilterValue={crossFilterValue}
            />
          )}
        </div>

        <div
          className="absolute bottom-1 right-1 w-5 h-5 opacity-0 group-hover:opacity-60 transition-opacity"
          style={{ cursor: 'se-resize' }}
          onMouseDown={handleResizeMouseDown}
        >
          <svg viewBox="0 0 10 10" className="w-full h-full text-[#AEAEB2]" fill="none">
            <path d="M2 10 L10 2M6 10 L10 6M10 10 L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const { activeReport, loadReport, removeChart } = useReportStore()
  const { datasets, fetchDatasets } = useDatasetsStore()
  const { applied, crossFilter, toggleCross, reset } = useFilterStore()

  const [localLayout, setLocalLayout] = useState<LayoutItemOut[]>([])
  const prevLayoutRef = useRef<LayoutItemOut[]>([])
  const [chartData, setChartData] = useState<Map<string, ChartData>>(new Map())
  const [colW, setColW] = useState(80)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  useEffect(() => {
    if (!reportId) return
    loadReport(reportId)
  }, [reportId, loadReport])

  useEffect(() => {
    fetchDatasets()
  }, [fetchDatasets])

  useEffect(() => {
    if (!activeReport) return
    const layout = buildInitialLayout(activeReport, prevLayoutRef.current)
    setLocalLayout(layout)
    prevLayoutRef.current = layout
    const hasAutoItems = layout.some((i) => i.id.startsWith('auto-'))
    if (hasAutoItems && reportId) {
      apiSetLayout(
        reportId,
        layout.map(({ chart_id, x, y, w, h }) => ({ chart_id, x, y, w, h })),
      ).catch(() => {})
    }
  }, [activeReport?.id, activeReport?.charts.length])

  useEffect(() => {
    reset()
  }, [activeReport?.id])

  useEffect(() => {
    if (!canvasRef.current) return
    const obs = new ResizeObserver((entries) => {
      setColW(entries[0].contentRect.width / 12)
    })
    obs.observe(canvasRef.current)
    return () => obs.disconnect()
  }, [])

  const fetchSingleChart = useCallback(
    async (chart: ChartConfigOut, extraFilters: FilterSpec[]) => {
      setChartData((prev) => {
        const next = new Map(prev)
        const existing = prev.get(chart.id)
        next.set(chart.id, {
          rows: existing?.rows ?? [],
          loading: true,
          error: false,
        })
        return next
      })

      const extraFields = new Set(extraFilters.map((f) => f.field))
      const ownFilters = (chart.filters as FilterSpec[]).filter((f) => !extraFields.has(f.field))

      try {
        const resp = await runAggregation({
          dataset_id: chart.dataset_id,
          x_field: chart.x_field,
          y_field: chart.y_field,
          aggregation: chart.aggregation as AggregationType,
          group_by: chart.group_by,
          filters: [...ownFilters, ...extraFilters],
          limit: 500,
        })
        setChartData((prev) => {
          const next = new Map(prev)
          next.set(chart.id, { rows: resp.rows, loading: false, error: false })
          return next
        })
      } catch {
        setChartData((prev) => {
          const next = new Map(prev)
          next.set(chart.id, { rows: [], loading: false, error: true })
          return next
        })
      }
    },
    [],
  )

  useEffect(() => {
    if (!activeReport) return
    const globalSpecs = globalFiltersToSpecs(applied)

    activeReport.charts.forEach((chart) => {
      const isCrossSource = crossFilter?.sourceChartId === chart.id
      const extraSpecs: FilterSpec[] = [
        ...globalSpecs,
        ...(!isCrossSource && crossFilter
          ? [{ field: crossFilter.xField, operator: 'eq' as FilterOperator, value: crossFilter.value }]
          : []),
      ]
      fetchSingleChart(chart, extraSpecs)
    })
  }, [activeReport?.id, activeReport?.charts.length, applied, crossFilter])

  const filterFields = useMemo((): FilterField[] => {
    if (!activeReport) return []
    const seen = new Set<string>()
    const result: FilterField[] = []
    for (const chart of activeReport.charts) {
      const dataset = datasets.find((d) => d.id === chart.dataset_id)
      if (!dataset) continue
      const colMap = new Map(dataset.columns.map((c) => [c.name, c.type]))
      for (const field of [chart.x_field, ...chart.group_by]) {
        const key = `${chart.dataset_id}:${field}`
        if (seen.has(key)) continue
        seen.add(key)
        result.push({
          field,
          type: colMap.get(field) ?? 'text',
          datasetId: chart.dataset_id,
        })
      }
    }
    return result
  }, [activeReport?.id, activeReport?.charts.length, datasets])

  const persistLayout = useCallback(
    async (items: LayoutItemOut[]) => {
      if (!reportId) return
      try {
        const saved = await apiSetLayout(
          reportId,
          items.map(({ chart_id, x, y, w, h }) => ({ chart_id, x, y, w, h })),
        )
        setLocalLayout(saved)
        prevLayoutRef.current = saved
      } catch {
        // no-op
      }
    },
    [reportId],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const chartId = event.active.id as string
      const delta = event.delta
      const item = localLayout.find((i) => i.chart_id === chartId)
      if (!item) return

      const newX = Math.max(0, Math.min(12 - item.w, Math.round(item.x + delta.x / colW)))
      const newY = Math.max(0, Math.round(item.y + delta.y / ROW_H))

      if (newX === item.x && newY === item.y) return

      const updated = localLayout.map((i) =>
        i.chart_id === chartId ? { ...i, x: newX, y: newY } : i,
      )
      setLocalLayout(updated)
      persistLayout(updated)
    },
    [localLayout, colW, persistLayout],
  )

  const handleResize = useCallback(
    (chartId: string, w: number, h: number) => {
      const updated = localLayout.map((i) =>
        i.chart_id === chartId ? { ...i, w, h } : i,
      )
      setLocalLayout(updated)
      persistLayout(updated)
    },
    [localLayout, persistLayout],
  )

  const handleRemoveChart = useCallback(
    async (chartId: string) => {
      await removeChart(chartId)
      setLocalLayout((prev) => prev.filter((i) => i.chart_id !== chartId))
      prevLayoutRef.current = prevLayoutRef.current.filter((i) => i.chart_id !== chartId)
    },
    [removeChart],
  )

  const handlePointClick = useCallback(
    (chartId: string, xField: string, value: unknown) => {
      toggleCross(chartId, xField, value)
    },
    [toggleCross],
  )

  const canvasHeight =
    localLayout.length > 0
      ? (Math.max(...localLayout.map((i) => i.y + i.h)) + 4) * ROW_H
      : 6 * ROW_H

  const activeFilterCount =
    Object.values(applied).filter((v) => globalFiltersToSpecs({ _: v }).length > 0).length +
    (crossFilter ? 1 : 0)

  if (!activeReport) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-[#AEAEB2]" size={32} />
      </div>
    )
  }

  const chartMap = new Map(activeReport.charts.map((c) => [c.id, c]))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-black/[0.09] shrink-0">
        <h1 className="text-xl font-semibold text-[#1C1C1E] flex-1 truncate">
          {activeReport.name}
        </h1>
        <Button
          variant={filterPanelOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterPanelOpen((v) => !v)}
          className="gap-1.5"
        >
          <Filter size={13} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-[#007AFF]/10 text-[#007AFF] text-xs px-1.5 py-0.5 rounded-full leading-none">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/report/${reportId}`)}
          className="gap-1.5"
        >
          <Pencil size={13} />
          Edit Report
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/report/${reportId}`)}
          className="gap-1.5"
        >
          <Plus size={13} />
          Add Chart
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" disabled>
          <Download size={13} />
          Export
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto bg-[#F2F2F7] p-4">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div
              ref={canvasRef}
              className="relative w-full"
              style={{ height: canvasHeight }}
            >
              {localLayout.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-[#AEAEB2] select-none">
                  <BarChart2 size={48} className="mb-3 opacity-20" />
                  <p className="text-sm">No charts in this report yet</p>
                  <button
                    className="mt-3 text-sm text-[#007AFF] hover:text-[#0062CC] underline"
                    onClick={() => navigate(`/report/${reportId}`)}
                  >
                    Open Report Builder to add charts
                  </button>
                </div>
              )}

              {localLayout.map((item) => {
                const chart = chartMap.get(item.chart_id)
                if (!chart) return null
                const data = chartData.get(item.chart_id) ?? {
                  rows: [],
                  loading: true,
                  error: false,
                }
                const crossFilterValue =
                  crossFilter?.xField === chart.x_field ? crossFilter.value : undefined

                return (
                  <DraggableWidget
                    key={item.chart_id}
                    item={item}
                    chart={chart}
                    data={data}
                    colW={colW}
                    onEdit={() =>
                      navigate(`/report/${reportId}`, {
                        state: { selectChartId: item.chart_id },
                      })
                    }
                    onRemove={() => handleRemoveChart(item.chart_id)}
                    onResize={handleResize}
                    onPointClick={(xField, value) =>
                      handlePointClick(item.chart_id, xField, value)
                    }
                    crossFilterValue={crossFilterValue}
                  />
                )
              })}
            </div>
          </DndContext>
        </div>

        {filterPanelOpen && (
          <FilterPanel
            fields={filterFields}
            onClose={() => setFilterPanelOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
