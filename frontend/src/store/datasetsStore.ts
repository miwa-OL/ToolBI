import { create } from 'zustand'
import type { DatasetMeta, JoinedDataset } from '@/types'
import * as api from '@/api/datasets'

interface DatasetsState {
  datasets: DatasetMeta[]
  joinedDatasets: JoinedDataset[]
  fetchDatasets: () => Promise<void>
  fetchJoinedDatasets: () => Promise<void>
  uploadDataset: (file: File, onProgress?: (pct: number) => void) => Promise<DatasetMeta>
  removeDataset: (id: string) => Promise<void>
  createJoin: (body: {
    name: string
    left_dataset_id: string
    right_dataset_id: string
    left_key: string
    right_key: string
    join_type: string
  }) => Promise<JoinedDataset>
  removeJoin: (id: string) => Promise<void>
}

export const useDatasetsStore = create<DatasetsState>((set) => ({
  datasets: [],
  joinedDatasets: [],

  fetchDatasets: async () => {
    const datasets = await api.listDatasets()
    set({ datasets })
  },

  fetchJoinedDatasets: async () => {
    const joinedDatasets = await api.listJoinedDatasets()
    set({ joinedDatasets })
  },

  uploadDataset: async (file, onProgress) => {
    const dataset = await api.uploadDataset(file, onProgress)
    set((state) => ({ datasets: [...state.datasets, dataset] }))
    return dataset
  },

  removeDataset: async (id) => {
    await api.deleteDataset(id)
    set((state) => ({ datasets: state.datasets.filter((d) => d.id !== id) }))
  },

  createJoin: async (body) => {
    const joined = await api.createJoin(body)
    set((state) => ({ joinedDatasets: [...state.joinedDatasets, joined] }))
    return joined
  },

  removeJoin: async (id) => {
    await api.deleteJoinedDataset(id)
    set((state) => ({ joinedDatasets: state.joinedDatasets.filter((j) => j.id !== id) }))
  },
}))
