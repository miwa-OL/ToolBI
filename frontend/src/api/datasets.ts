import axios from 'axios'
import type { ComputedColumn, DatasetMeta, DatasetPreview, JoinedDataset } from '@/types'

const BASE = '/api/v1/datasets'

export async function uploadDataset(file: File): Promise<DatasetMeta> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axios.post<DatasetMeta>(`${BASE}/upload`, form)
  return data
}

export async function listDatasets(): Promise<DatasetMeta[]> {
  const { data } = await axios.get<DatasetMeta[]>(BASE)
  return data
}

export async function getDataset(id: string): Promise<DatasetMeta> {
  const { data } = await axios.get<DatasetMeta>(`${BASE}/${id}`)
  return data
}

export async function previewDataset(
  id: string,
  page: number,
  pageSize: number,
): Promise<DatasetPreview> {
  const { data } = await axios.get<DatasetPreview>(
    `${BASE}/${id}/preview?page=${page}&page_size=${pageSize}`,
  )
  return data
}

export async function deleteDataset(id: string): Promise<void> {
  await axios.delete(`${BASE}/${id}`)
}

export async function listComputedColumns(datasetId: string): Promise<ComputedColumn[]> {
  const { data } = await axios.get<ComputedColumn[]>(`${BASE}/${datasetId}/computed-columns`)
  return data
}

export async function createComputedColumn(
  datasetId: string,
  body: { name: string; expression: string; result_type: string },
): Promise<ComputedColumn> {
  const { data } = await axios.post<ComputedColumn>(`${BASE}/${datasetId}/computed-columns`, body)
  return data
}

export async function deleteComputedColumn(datasetId: string, colId: string): Promise<void> {
  await axios.delete(`${BASE}/${datasetId}/computed-columns/${colId}`)
}

export async function listJoinedDatasets(): Promise<JoinedDataset[]> {
  const { data } = await axios.get<JoinedDataset[]>(`${BASE}/joined`)
  return data
}

export async function createJoin(body: {
  name: string
  left_dataset_id: string
  right_dataset_id: string
  left_key: string
  right_key: string
  join_type: string
}): Promise<JoinedDataset> {
  const { data } = await axios.post<JoinedDataset>(`${BASE}/join`, body)
  return data
}

export async function deleteJoinedDataset(id: string): Promise<void> {
  await axios.delete(`${BASE}/joined/${id}`)
}

export async function previewJoin(body: {
  name: string
  left_dataset_id: string
  right_dataset_id: string
  left_key: string
  right_key: string
  join_type: string
}): Promise<{ columns: { name: string; type: string }[]; rows: Record<string, unknown>[] }> {
  const { data } = await axios.post(`${BASE}/join-preview`, body)
  return data
}
