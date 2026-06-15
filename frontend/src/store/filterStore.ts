import { create } from 'zustand'
import type { FilterSpec } from '@/types'

export type GlobalFilterValue =
  | { kind: 'date'; from: string; to: string }
  | { kind: 'multiselect'; values: string[] }
  | { kind: 'contains'; text: string }
  | { kind: 'range'; min: number | null; max: number | null }

export interface CrossFilter {
  sourceChartId: string
  xField: string
  value: unknown
}

interface FilterState {
  applied: Record<string, GlobalFilterValue>
  crossFilter: CrossFilter | null

  setApplied: (filters: Record<string, GlobalFilterValue>) => void
  clearAll: () => void
  toggleCross: (sourceChartId: string, xField: string, value: unknown) => void
  reset: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  applied: {},
  crossFilter: null,

  setApplied: (filters) => set({ applied: filters }),

  clearAll: () => set({ applied: {}, crossFilter: null }),

  toggleCross: (sourceChartId, xField, value) =>
    set((s) => {
      const cur = s.crossFilter
      if (
        cur?.sourceChartId === sourceChartId &&
        cur?.xField === xField &&
        cur?.value === value
      ) {
        return { crossFilter: null }
      }
      return { crossFilter: { sourceChartId, xField, value } }
    }),

  reset: () =>
    set((s) =>
      Object.keys(s.applied).length === 0 && s.crossFilter === null
        ? {}
        : { applied: {}, crossFilter: null },
    ),
}))

export function globalFiltersToSpecs(
  applied: Record<string, GlobalFilterValue>,
): FilterSpec[] {
  const specs: FilterSpec[] = []
  for (const [field, val] of Object.entries(applied)) {
    if (val.kind === 'date') {
      if (val.from) specs.push({ field, operator: 'gte', value: val.from })
      if (val.to) specs.push({ field, operator: 'lte', value: val.to })
    } else if (val.kind === 'multiselect' && val.values.length > 0) {
      specs.push({ field, operator: 'in', value: val.values })
    } else if (val.kind === 'contains' && val.text) {
      specs.push({ field, operator: 'contains', value: val.text })
    } else if (val.kind === 'range') {
      if (val.min !== null && val.min !== undefined) {
        specs.push({ field, operator: 'gte', value: val.min })
      }
      if (val.max !== null && val.max !== undefined) {
        specs.push({ field, operator: 'lte', value: val.max })
      }
    }
  }
  return specs
}
