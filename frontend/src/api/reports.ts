import client from './client'
import type {
  ChartConfigCreate,
  ChartConfigOut,
  LayoutItemIn,
  LayoutItemOut,
  ReportDetail,
  ReportSummary,
} from '@/types'

const BASE = '/api/v1/reports'

export async function createReport(name: string): Promise<ReportSummary> {
  const { data } = await client.post<ReportSummary>(BASE, { name })
  return data
}

export async function listReports(): Promise<ReportSummary[]> {
  const { data } = await client.get<ReportSummary[]>(BASE)
  return data
}

export async function getReport(id: string): Promise<ReportDetail> {
  const { data } = await client.get<ReportDetail>(`${BASE}/${id}`)
  return data
}

export async function renameReport(id: string, name: string): Promise<ReportSummary> {
  const { data } = await client.put<ReportSummary>(`${BASE}/${id}`, { name })
  return data
}

export async function deleteReport(id: string): Promise<void> {
  await client.delete(`${BASE}/${id}`)
}

export async function addChart(
  reportId: string,
  chart: ChartConfigCreate,
): Promise<ChartConfigOut> {
  const { data } = await client.post<ChartConfigOut>(`${BASE}/${reportId}/charts`, chart)
  return data
}

export async function updateChart(
  reportId: string,
  chartId: string,
  chart: ChartConfigCreate,
): Promise<ChartConfigOut> {
  const { data } = await client.put<ChartConfigOut>(
    `${BASE}/${reportId}/charts/${chartId}`,
    chart,
  )
  return data
}

export async function deleteChart(reportId: string, chartId: string): Promise<void> {
  await client.delete(`${BASE}/${reportId}/charts/${chartId}`)
}

export async function setLayout(
  reportId: string,
  items: LayoutItemIn[],
): Promise<LayoutItemOut[]> {
  const { data } = await client.put<LayoutItemOut[]>(`${BASE}/${reportId}/layout`, items)
  return data
}

export function exportChartDataUrl(reportId: string): string {
  return `${BASE}/${reportId}/export/csv`
}
