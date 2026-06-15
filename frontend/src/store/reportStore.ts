import { create } from 'zustand'
import type { ChartConfigOut, LayoutItemOut, ReportDetail, ReportSummary } from '@/types'
import * as api from '@/api/reports'

interface ReportState {
  reports: ReportSummary[]
  activeReport: ReportDetail | null
  selectedChartId: string | null

  fetchReports: () => Promise<void>
  loadReport: (id: string) => Promise<void>
  setSelectedChart: (id: string | null) => void

  createReport: (name: string) => Promise<ReportSummary>
  renameActiveReport: (name: string) => Promise<void>
  deleteReport: (id: string) => Promise<void>

  addChart: (chart: Parameters<typeof api.addChart>[1]) => Promise<ChartConfigOut>
  updateChart: (chartId: string, chart: Parameters<typeof api.updateChart>[2]) => Promise<ChartConfigOut>
  removeChart: (chartId: string) => Promise<void>
  setLayout: (items: Parameters<typeof api.setLayout>[1]) => Promise<LayoutItemOut[]>
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  activeReport: null,
  selectedChartId: null,

  fetchReports: async () => {
    const reports = await api.listReports()
    set({ reports })
  },

  loadReport: async (id) => {
    const report = await api.getReport(id)
    set({ activeReport: report, selectedChartId: null })
  },

  setSelectedChart: (id) => set({ selectedChartId: id }),

  createReport: async (name) => {
    const summary = await api.createReport(name)
    set((s) => ({ reports: [...s.reports, summary] }))
    return summary
  },

  renameActiveReport: async (name) => {
    const { activeReport } = get()
    if (!activeReport) return
    const updated = await api.renameReport(activeReport.id, name)
    set((s) => ({
      activeReport: s.activeReport ? { ...s.activeReport, name: updated.name } : null,
      reports: s.reports.map((r) => (r.id === updated.id ? updated : r)),
    }))
  },

  deleteReport: async (id) => {
    await api.deleteReport(id)
    set((s) => ({
      reports: s.reports.filter((r) => r.id !== id),
      activeReport: s.activeReport?.id === id ? null : s.activeReport,
    }))
  },

  addChart: async (chart) => {
    const { activeReport } = get()
    if (!activeReport) throw new Error('No active report')
    const created = await api.addChart(activeReport.id, chart)
    set((s) => ({
      activeReport: s.activeReport
        ? { ...s.activeReport, charts: [...s.activeReport.charts, created] }
        : null,
    }))
    return created
  },

  updateChart: async (chartId, chart) => {
    const { activeReport } = get()
    if (!activeReport) throw new Error('No active report')
    const updated = await api.updateChart(activeReport.id, chartId, chart)
    set((s) => ({
      activeReport: s.activeReport
        ? {
            ...s.activeReport,
            charts: s.activeReport.charts.map((c) => (c.id === chartId ? updated : c)),
          }
        : null,
    }))
    return updated
  },

  removeChart: async (chartId) => {
    const { activeReport } = get()
    if (!activeReport) return
    await api.deleteChart(activeReport.id, chartId)
    set((s) => ({
      activeReport: s.activeReport
        ? {
            ...s.activeReport,
            charts: s.activeReport.charts.filter((c) => c.id !== chartId),
          }
        : null,
      selectedChartId: s.selectedChartId === chartId ? null : s.selectedChartId,
    }))
  },

  setLayout: async (items) => {
    const { activeReport } = get()
    if (!activeReport) throw new Error('No active report')
    const layout = await api.setLayout(activeReport.id, items)
    set((s) => ({
      activeReport: s.activeReport ? { ...s.activeReport, layout } : null,
    }))
    return layout
  },
}))
