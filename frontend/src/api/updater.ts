export interface UpdateInfo {
  current: string
  latest: string | null
  update_available: boolean
  download_url: string | null
  asset_name: string | null
  notes: string
}

export interface DownloadProgress {
  status: 'idle' | 'downloading' | 'ready' | 'error'
  progress: number
  path: string | null
  error: string | null
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  const res = await fetch('/api/v1/update/check')
  if (!res.ok) throw new Error('check failed')
  return res.json()
}

export async function startDownload(download_url: string, asset_name: string): Promise<void> {
  await fetch('/api/v1/update/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ download_url, asset_name }),
  })
}

export async function getProgress(): Promise<DownloadProgress> {
  const res = await fetch('/api/v1/update/progress')
  return res.json()
}

export async function applyUpdate(): Promise<void> {
  await fetch('/api/v1/update/apply', { method: 'POST' })
}
