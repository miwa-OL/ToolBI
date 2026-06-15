import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { getDistinctValues } from '@/api/query'
import {
  globalFiltersToSpecs,
  useFilterStore,
  type GlobalFilterValue,
} from '@/store/filterStore'
import type { ColumnSchema } from '@/types'

export interface FilterField {
  field: string
  type: ColumnSchema['type']
  datasetId: string
}

interface FilterPanelProps {
  fields: FilterField[]
  onClose: () => void
}

function getDateFrom(lf: Record<string, GlobalFilterValue>, field: string): string {
  const v = lf[field]
  return v && v.kind === 'date' ? v.from : ''
}

function getDateTo(lf: Record<string, GlobalFilterValue>, field: string): string {
  const v = lf[field]
  return v && v.kind === 'date' ? v.to : ''
}

function getSelectedValues(lf: Record<string, GlobalFilterValue>, field: string): string[] {
  const v = lf[field]
  return v && v.kind === 'multiselect' ? v.values : []
}

function getContainsText(lf: Record<string, GlobalFilterValue>, field: string): string {
  const v = lf[field]
  return v && v.kind === 'contains' ? v.text : ''
}

function getNumMin(lf: Record<string, GlobalFilterValue>, field: string): string {
  const v = lf[field]
  return v && v.kind === 'range' && v.min !== null && v.min !== undefined ? String(v.min) : ''
}

function getNumMax(lf: Record<string, GlobalFilterValue>, field: string): string {
  const v = lf[field]
  return v && v.kind === 'range' && v.max !== null && v.max !== undefined ? String(v.max) : ''
}

export function FilterPanel({ fields, onClose }: FilterPanelProps) {
  const { applied, crossFilter, setApplied, clearAll, toggleCross } = useFilterStore()
  const [localFilters, setLocalFilters] = useState<Record<string, GlobalFilterValue>>(
    () => ({ ...applied }),
  )
  const [distinctValues, setDistinctValues] = useState<Record<string, string[]>>({})
  const [fetchingFields, setFetchingFields] = useState<Set<string>>(new Set())

  useEffect(() => {
    for (const f of fields) {
      if (f.type !== 'text') continue
      if (f.field in distinctValues) continue
      if (fetchingFields.has(f.field)) continue

      setFetchingFields((prev) => new Set([...prev, f.field]))

      getDistinctValues(f.datasetId, f.field)
        .then((vals) => setDistinctValues((prev) => ({ ...prev, [f.field]: vals })))
        .catch(() => setDistinctValues((prev) => ({ ...prev, [f.field]: [] })))
        .finally(() =>
          setFetchingFields((prev) => {
            const next = new Set(prev)
            next.delete(f.field)
            return next
          }),
        )
    }
  }, [fields])

  function updateLocal(field: string, value: GlobalFilterValue) {
    setLocalFilters((prev) => ({ ...prev, [field]: value }))
  }

  function handleApply() {
    setApplied(localFilters)
  }

  function handleClearAll() {
    setLocalFilters({})
    clearAll()
  }

  const activeGlobalCount = Object.keys(applied).filter((f) => {
    const spec = globalFiltersToSpecs({ [f]: applied[f] })
    return spec.length > 0
  }).length

  return (
    <div className="w-72 shrink-0 bg-white border-l border-black/[0.09] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.09] shrink-0">
        <span className="font-semibold text-sm text-[#3A3A3C]">
          Filters
          {activeGlobalCount > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">
              {activeGlobalCount}
            </span>
          )}
        </span>
        <button
          onClick={onClose}
          className="text-[#AEAEB2] hover:text-[#636366] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {crossFilter && (
          <div className="px-4 py-3 border-b border-black/[0.05]">
            <p className="text-xs font-medium text-[#8E8E93] mb-2 uppercase tracking-wide">
              Cross-filter
            </p>
            <button
              onClick={() =>
                toggleCross(crossFilter.sourceChartId, crossFilter.xField, crossFilter.value)
              }
              className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full text-xs hover:bg-indigo-100 transition-colors"
            >
              <span className="font-medium">{crossFilter.xField}:</span>
              <span className="truncate max-w-28">{String(crossFilter.value)}</span>
              <X size={10} className="shrink-0" />
            </button>
          </div>
        )}

        {fields.length === 0 && (
          <p className="px-4 py-6 text-xs text-[#AEAEB2] text-center">
            No fields to filter.<br />Add charts to the report first.
          </p>
        )}

        {fields.map((f) => (
          <div key={`${f.datasetId}:${f.field}`} className="px-4 py-3 border-b border-black/[0.05]">
            <p className="text-xs font-semibold text-[#636366] mb-2 capitalize">
              {f.field.replace(/_/g, ' ')}
            </p>

            {f.type === 'date' && (
              <div className="flex flex-col gap-1.5">
                <input
                  type="date"
                  value={getDateFrom(localFilters, f.field)}
                  onChange={(e) =>
                    updateLocal(f.field, {
                      kind: 'date',
                      from: e.target.value,
                      to: getDateTo(localFilters, f.field),
                    })
                  }
                  className="text-xs border border-black/[0.09] rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={getDateTo(localFilters, f.field)}
                  onChange={(e) =>
                    updateLocal(f.field, {
                      kind: 'date',
                      from: getDateFrom(localFilters, f.field),
                      to: e.target.value,
                    })
                  }
                  className="text-xs border border-black/[0.09] rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  placeholder="To"
                />
              </div>
            )}

            {f.type === 'number' && (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={getNumMin(localFilters, f.field)}
                  onChange={(e) => {
                    const v = localFilters[f.field]
                    updateLocal(f.field, {
                      kind: 'range',
                      min: e.target.value ? Number(e.target.value) : null,
                      max: v && v.kind === 'range' ? v.max : null,
                    })
                  }}
                  className="text-xs border border-black/[0.09] rounded px-2 py-1 w-1/2 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={getNumMax(localFilters, f.field)}
                  onChange={(e) => {
                    const v = localFilters[f.field]
                    updateLocal(f.field, {
                      kind: 'range',
                      min: v && v.kind === 'range' ? v.min : null,
                      max: e.target.value ? Number(e.target.value) : null,
                    })
                  }}
                  className="text-xs border border-black/[0.09] rounded px-2 py-1 w-1/2 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
              </div>
            )}

            {f.type === 'text' && (
              <>
                {fetchingFields.has(f.field) && (
                  <div className="h-4 bg-slate-100 animate-pulse rounded w-24" />
                )}
                {!fetchingFields.has(f.field) &&
                  distinctValues[f.field] !== undefined &&
                  distinctValues[f.field].length < 50 && (
                    <div className="max-h-36 overflow-y-auto flex flex-col gap-1">
                      {distinctValues[f.field].map((val) => {
                        const selected = getSelectedValues(localFilters, f.field).includes(val)
                        return (
                          <label
                            key={val}
                            className="flex items-center gap-2 cursor-pointer hover:bg-[#F5F5F7] rounded px-1 py-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => {
                                const current = getSelectedValues(localFilters, f.field)
                                const next = e.target.checked
                                  ? [...current, val]
                                  : current.filter((v) => v !== val)
                                updateLocal(f.field, { kind: 'multiselect', values: next })
                              }}
                              className="rounded"
                            />
                            <span className="text-xs text-[#3A3A3C] truncate">{val}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                {!fetchingFields.has(f.field) &&
                  distinctValues[f.field] !== undefined &&
                  distinctValues[f.field].length >= 50 && (
                    <input
                      type="text"
                      placeholder="Contains..."
                      value={getContainsText(localFilters, f.field)}
                      onChange={(e) =>
                        updateLocal(f.field, { kind: 'contains', text: e.target.value })
                      }
                      className="text-xs border border-black/[0.09] rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  )}
              </>
            )}

            {f.type === 'boolean' && (
              <select
                value={
                  getSelectedValues(localFilters, f.field)[0] ?? ''
                }
                onChange={(e) =>
                  updateLocal(f.field, {
                    kind: 'multiselect',
                    values: e.target.value ? [e.target.value] : [],
                  })
                }
                className="text-xs border border-black/[0.09] rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                <option value="">Any</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-black/[0.09] flex gap-2 shrink-0">
        <button
          onClick={handleApply}
          className="flex-1 bg-indigo-600 text-white text-xs font-semibold py-1.5 rounded hover:bg-indigo-700 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClearAll}
          className="flex-1 border border-black/[0.09] text-[#636366] text-xs font-semibold py-1.5 rounded hover:bg-[#F5F5F7] transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  )
}
