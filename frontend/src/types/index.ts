export interface ColumnSchema {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean'
}

export interface DatasetMeta {
  id: string
  name: string
  original_filename: string
  row_count: number
  columns: ColumnSchema[]
  created_at: string
}

export interface DatasetPreview {
  columns: ColumnSchema[]
  rows: Record<string, unknown>[]
  total_rows: number
  page: number
  page_size: number
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'heatmap'
export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct_count'
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in'

export interface FilterSpec {
  field: string
  operator: FilterOperator
  value: unknown
}

export interface ChartConfigCreate {
  title: string
  chart_type: ChartType
  dataset_id: string
  x_field: string
  y_field: string | null
  aggregation: AggregationType
  group_by: string[]
  filters: FilterSpec[]
  color_field: string | null
  color_palette: string[]
  sort_order: number
}

export interface ChartConfigOut extends ChartConfigCreate {
  id: string
  report_id: string
}

export interface LayoutItemIn {
  chart_id: string
  x: number
  y: number
  w: number
  h: number
}

export interface LayoutItemOut extends LayoutItemIn {
  id: string
  report_id: string
}

export interface ReportSummary {
  id: string
  name: string
  chart_count: number
  created_at: string
  updated_at: string
}

export interface ReportDetail {
  id: string
  name: string
  created_at: string
  updated_at: string
  charts: ChartConfigOut[]
  layout: LayoutItemOut[]
}

export interface AggregationRequest {
  dataset_id: string
  x_field: string
  y_field: string | null
  aggregation: AggregationType
  group_by: string[]
  filters: FilterSpec[]
  limit?: number
}

export interface AggregationResponse {
  rows: Record<string, unknown>[]
  row_count: number
}

export interface ComputedColumn {
  id: string
  dataset_id: string
  name: string
  expression: string
  result_type: 'number' | 'text' | 'boolean'
}

export interface JoinedDataset {
  id: string
  name: string
  left_dataset_id: string
  right_dataset_id: string
  left_key: string
  right_key: string
  join_type: 'inner' | 'left' | 'right'
  created_at: string
  columns: ColumnSchema[]
}
