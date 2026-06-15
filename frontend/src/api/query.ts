import axios from 'axios'
import type { AggregationRequest, AggregationResponse } from '@/types'

const BASE = '/api/v1/query'

export async function runAggregation(req: AggregationRequest): Promise<AggregationResponse> {
  const { data } = await axios.post<AggregationResponse>(`${BASE}/aggregate`, req)
  return data
}

export async function getDistinctValues(datasetId: string, field: string): Promise<string[]> {
  const { data } = await axios.get<string[]>(`${BASE}/distinct-values`, {
    params: { dataset_id: datasetId, field },
  })
  return data
}

export async function validateExpression(
  datasetId: string,
  expression: string,
): Promise<{ valid: boolean; error: string | null }> {
  const { data } = await axios.get<{ valid: boolean; error: string | null }>(
    `${BASE}/validate-expression`,
    { params: { dataset_id: datasetId, expression } },
  )
  return data
}

export async function runRawQuery(
  dataset_id: string,
  sql: string,
): Promise<Record<string, unknown>[]> {
  const { data } = await axios.post<Record<string, unknown>[]>(`${BASE}/raw`, { dataset_id, sql })
  return data
}
