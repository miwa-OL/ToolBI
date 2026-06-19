import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Calculator,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  GitMerge,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  createComputedColumn,
  deleteComputedColumn,
  listComputedColumns,
  previewDataset,
  previewJoin,
} from '@/api/datasets'
import { validateExpression } from '@/api/query'
import { useDatasetsStore } from '@/store/datasetsStore'
import type { ColumnSchema, ComputedColumn, DatasetMeta, DatasetPreview } from '@/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 100

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

interface PreviewPanelProps {
  preview: DatasetPreview
  dataset: DatasetMeta
  page: number
  pageSize: number
  onPrev: () => void
  onNext: () => void
}

function PreviewPanel({ preview, dataset, page, pageSize, onPrev, onNext }: PreviewPanelProps) {
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const sortedRows = useMemo(() => {
    if (!sortCol) return preview.rows
    return [...preview.rows].sort((a, b) => {
      const aVal = a[sortCol] ?? ''
      const bVal = b[sortCol] ?? ''
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [preview.rows, sortCol, sortDir])

  const totalPages = Math.ceil(dataset.row_count / pageSize)

  return (
    <div className="p-4 border-t border-black/[0.09]">
      <div className="flex flex-wrap gap-2 mb-3">
        {preview.columns.map((col) => (
          <div key={col.name} className="flex items-center gap-1.5">
            <span className="text-xs text-[#8E8E93] font-medium">{col.name}</span>
            <Badge variant={col.type as ColumnSchema['type']}>{col.type}</Badge>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-black/[0.09]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F5F5F7] border-b border-black/[0.09]">
              {preview.columns.map((col) => (
                <th
                  key={col.name}
                  className="px-3 py-2 text-left text-xs font-medium text-[#8E8E93] cursor-pointer select-none whitespace-nowrap hover:bg-[#F2F2F7]"
                  onClick={() => handleSort(col.name)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.name}
                    {sortCol === col.name ? (
                      sortDir === 'asc' ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  'border-b border-black/[0.05] last:border-0',
                  i % 2 === 0 ? 'bg-white' : 'bg-black/[0.02]',
                )}
              >
                {preview.columns.map((col) => (
                  <td
                    key={col.name}
                    className="px-3 py-1.5 text-[#3A3A3C] whitespace-nowrap max-w-[240px] truncate"
                  >
                    {String(row[col.name] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-[#8E8E93]">
          Page {page} of {totalPages} &middot; {dataset.row_count.toLocaleString()} rows total
        </p>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
            <ChevronLeft size={14} className="mr-1" />
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages}>
            Next
            <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface AddComputedColumnDialogProps {
  open: boolean
  datasetId: string
  onClose: () => void
  onAdded: (col: ComputedColumn) => void
}

function AddComputedColumnDialog({
  open,
  datasetId,
  onClose,
  onAdded,
}: AddComputedColumnDialogProps) {
  const [name, setName] = useState('')
  const [expression, setExpression] = useState('')
  const [resultType, setResultType] = useState<'number' | 'text' | 'boolean'>('number')
  const [validating, setValidating] = useState(false)
  const [validation, setValidation] = useState<{ valid: boolean; error: string | null } | null>(
    null,
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setExpression('')
      setResultType('number')
      setValidation(null)
    }
  }, [open])

  const handleValidate = async () => {
    if (!expression.trim()) return
    setValidating(true)
    setValidation(null)
    try {
      const result = await validateExpression(datasetId, expression)
      setValidation(result)
    } finally {
      setValidating(false)
    }
  }

  const handleExpressionChange = (val: string) => {
    setExpression(val)
    setValidation(null)
  }

  const handleSave = async () => {
    if (!name.trim() || !validation?.valid) return
    setSaving(true)
    try {
      const col = await createComputedColumn(datasetId, {
        name: name.trim(),
        expression,
        result_type: resultType,
      })
      onAdded(col)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && !validating && onClose()}>
      <DialogHeader>
        <DialogTitle>Add computed column</DialogTitle>
        <DialogDescription>
          Define a new column using a SQL expression over this dataset's fields.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-[#636366] mb-1 block">Column name</label>
          <input
            className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C]"
            placeholder="e.g. revenue_per_unit"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-[#636366] mb-1 block">Expression</label>
          <textarea
            className="w-full rounded border border-black/[0.09] px-2 py-1.5 text-sm text-[#3A3A3C] font-mono resize-none"
            rows={3}
            placeholder="e.g. revenue / quantity"
            value={expression}
            onChange={(e) => handleExpressionChange(e.target.value)}
          />
          <div className="flex items-center gap-2 mt-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
              disabled={!expression.trim() || validating}
            >
              {validating && <Loader2 size={12} className="mr-1.5 animate-spin" />}
              Validate
            </Button>
            {validation !== null &&
              (validation.valid ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Check size={12} />
                  Valid
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-600 max-w-48 truncate">
                  <AlertCircle size={12} className="shrink-0" />
                  {validation.error ?? 'Invalid'}
                </span>
              ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-[#636366] mb-1 block">Result type</label>
          <select
            className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C] bg-white"
            value={resultType}
            onChange={(e) => setResultType(e.target.value as 'number' | 'text' | 'boolean')}
          >
            <option value="number">Number</option>
            <option value="text">Text</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim() || !validation?.valid || saving}>
          {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          Add column
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

interface CreateJoinDialogProps {
  open: boolean
  datasets: DatasetMeta[]
  onClose: () => void
}

function CreateJoinDialog({ open, datasets, onClose }: CreateJoinDialogProps) {
  const { createJoin } = useDatasetsStore()
  const [name, setName] = useState('')
  const [leftId, setLeftId] = useState('')
  const [rightId, setRightId] = useState('')
  const [leftKey, setLeftKey] = useState('')
  const [rightKey, setRightKey] = useState('')
  const [joinType, setJoinType] = useState<'inner' | 'left' | 'right'>('inner')
  const [previewing, setPreviewing] = useState(false)
  const [previewData, setPreviewData] = useState<{
    columns: { name: string }[]
    rows: Record<string, unknown>[]
  } | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const leftDataset = datasets.find((d) => d.id === leftId)
  const rightDataset = datasets.find((d) => d.id === rightId)

  useEffect(() => {
    if (open) {
      setName('')
      setLeftId('')
      setRightId('')
      setLeftKey('')
      setRightKey('')
      setJoinType('inner')
      setPreviewData(null)
      setPreviewError(null)
    }
  }, [open])

  useEffect(() => {
    setLeftKey('')
  }, [leftId])

  useEffect(() => {
    setRightKey('')
  }, [rightId])

  const handlePreview = async () => {
    if (!leftId || !rightId || !leftKey || !rightKey) return
    setPreviewing(true)
    setPreviewData(null)
    setPreviewError(null)
    try {
      const data = await previewJoin({
        name: name.trim() || '_preview',
        left_dataset_id: leftId,
        right_dataset_id: rightId,
        left_key: leftKey,
        right_key: rightKey,
        join_type: joinType,
      })
      setPreviewData(data)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setPreviewError(detail ?? 'Preview failed')
    } finally {
      setPreviewing(false)
    }
  }

  const canCreate = !!name.trim() && !!leftId && !!rightId && !!leftKey && !!rightKey

  const handleCreate = async () => {
    if (!canCreate) return
    setSaving(true)
    try {
      await createJoin({
        name: name.trim(),
        left_dataset_id: leftId,
        right_dataset_id: rightId,
        left_key: leftKey,
        right_key: rightKey,
        join_type: joinType,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Create joined dataset</DialogTitle>
        <DialogDescription>
          Join two datasets on a common key. The result can be used in reports like a regular
          dataset.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 mt-1">
        <div>
          <label className="text-xs text-[#636366] mb-1 block">Name</label>
          <input
            className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C]"
            placeholder="e.g. orders_with_customers"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-[#636366] block">Left dataset</label>
            <select
              className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C] bg-white"
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
            >
              <option value="">Select…</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C] bg-white"
              value={leftKey}
              onChange={(e) => setLeftKey(e.target.value)}
              disabled={!leftDataset}
            >
              <option value="">Join key…</option>
              {leftDataset?.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#636366] block">Right dataset</label>
            <select
              className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C] bg-white"
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
            >
              <option value="">Select…</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              className="w-full h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C] bg-white"
              value={rightKey}
              onChange={(e) => setRightKey(e.target.value)}
              disabled={!rightDataset}
            >
              <option value="">Join key…</option>
              {rightDataset?.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-[#636366] mb-1 block">Join type</label>
          <select
            className="w-40 h-8 rounded border border-black/[0.09] px-2 text-sm text-[#3A3A3C] bg-white"
            value={joinType}
            onChange={(e) => setJoinType(e.target.value as 'inner' | 'left' | 'right')}
          >
            <option value="inner">Inner Join</option>
            <option value="left">Left Join</option>
            <option value="right">Right Join</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={!leftId || !rightId || !leftKey || !rightKey || previewing}
          >
            {previewing ? (
              <Loader2 size={12} className="mr-1.5 animate-spin" />
            ) : (
              <Eye size={12} className="mr-1.5" />
            )}
            Preview
          </Button>
          {previewError && (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle size={12} />
              {previewError}
            </span>
          )}
        </div>

        {previewData && previewData.rows.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-black/[0.09] max-h-48">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F5F5F7] border-b border-black/[0.09]">
                  {previewData.columns.map((c) => (
                    <th
                      key={c.name}
                      className="px-2 py-1.5 text-left text-[#8E8E93] whitespace-nowrap font-medium"
                    >
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.rows.map((row, i) => (
                  <tr
                    key={i}
                    className={cn(
                      'border-b border-black/[0.05]',
                      i % 2 === 0 ? 'bg-white' : 'bg-black/[0.02]',
                    )}
                  >
                    {previewData.columns.map((c) => (
                      <td
                        key={c.name}
                        className="px-2 py-1 text-[#3A3A3C] whitespace-nowrap max-w-32 truncate"
                      >
                        {String(row[c.name] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {previewData && previewData.rows.length === 0 && (
          <p className="text-xs text-[#8E8E93]">No rows matched the join condition.</p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleCreate} disabled={!canCreate || saving}>
          {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          Create join
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

export default function DataSources() {
  const {
    datasets,
    joinedDatasets,
    fetchDatasets,
    fetchJoinedDatasets,
    uploadDataset,
    removeDataset,
    removeJoin,
  } = useDatasetsStore()

  const [dragOver, setDragOver] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<DatasetPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewPage, setPreviewPage] = useState(1)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [computedCols, setComputedCols] = useState<ComputedColumn[]>([])
  const [computedColsLoading, setComputedColsLoading] = useState(false)
  const [addColOpen, setAddColOpen] = useState(false)

  const [joinOpen, setJoinOpen] = useState(false)
  const [deleteJoinId, setDeleteJoinId] = useState<string | null>(null)
  const [deletingJoin, setDeletingJoin] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDatasets()
    fetchJoinedDatasets()
  }, [fetchDatasets, fetchJoinedDatasets])

  const loadPreview = async (id: string, page: number) => {
    setPreviewLoading(true)
    try {
      const data = await previewDataset(id, page, PAGE_SIZE)
      setPreview(data)
    } finally {
      setPreviewLoading(false)
    }
  }

  const loadComputedCols = async (id: string) => {
    setComputedColsLoading(true)
    try {
      const cols = await listComputedColumns(id)
      setComputedCols(cols)
    } finally {
      setComputedColsLoading(false)
    }
  }

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setPreview(null)
      setComputedCols([])
      return
    }
    setExpandedId(id)
    setPreviewPage(1)
    setPreview(null)
    setComputedCols([])
    loadPreview(id, 1)
    loadComputedCols(id)
  }

  const handlePrevPage = () => {
    if (!expandedId || previewPage <= 1) return
    const next = previewPage - 1
    setPreviewPage(next)
    loadPreview(expandedId, next)
  }

  const handleNextPage = () => {
    if (!expandedId) return
    const next = previewPage + 1
    setPreviewPage(next)
    loadPreview(expandedId, next)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.toLowerCase().endsWith('.csv')) setPendingFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPendingFile(file)
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!pendingFile) return
    setUploading(true)
    setUploadProgress(0)
    try {
      await uploadDataset(pendingFile, setUploadProgress)
      setPendingFile(null)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await removeDataset(deleteId)
      if (expandedId === deleteId) {
        setExpandedId(null)
        setPreview(null)
        setComputedCols([])
      }
      setDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteComputedCol = async (colId: string) => {
    if (!expandedId) return
    await deleteComputedColumn(expandedId, colId)
    setComputedCols((cols) => cols.filter((c) => c.id !== colId))
  }

  const handleDeleteJoin = async () => {
    if (!deleteJoinId) return
    setDeletingJoin(true)
    try {
      await removeJoin(deleteJoinId)
      setDeleteJoinId(null)
    } finally {
      setDeletingJoin(false)
    }
  }

  const deleteTarget = datasets.find((d) => d.id === deleteId)
  const deleteJoinTarget = joinedDatasets.find((j) => j.id === deleteJoinId)

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-xl font-semibold text-[#1C1C1E] mb-6">Data Sources</h1>

      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-slate-500 bg-[#F5F5F7]'
            : 'border-black/[0.09] hover:border-slate-300 hover:bg-black/[0.02]',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !pendingFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
        />

        {pendingFile ? (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <div className="text-[#3A3A3C] text-center">
              <p className="font-medium">{pendingFile.name}</p>
              <p className="text-sm text-[#8E8E93] mt-0.5">{formatBytes(pendingFile.size)}</p>
            </div>
            {uploading && (
              <div className="w-full">
                <div className="h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#007AFF] rounded-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-[#8E8E93] text-center mt-1">{uploadProgress}%</p>
              </div>
            )}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
              <Button variant="ghost" onClick={() => setPendingFile(null)} disabled={uploading}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#AEAEB2] pointer-events-none">
            <Upload size={28} strokeWidth={1.5} />
            <p className="text-sm">
              Drop a CSV file here, or{' '}
              <span className="text-[#636366] underline underline-offset-2">browse</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        {datasets.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-[#AEAEB2] select-none">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-4 opacity-40">
              <rect x="8" y="16" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
              <line x1="8" y1="26" x2="56" y2="26" stroke="currentColor" strokeWidth="2" />
              <line x1="24" y1="26" x2="24" y2="52" stroke="currentColor" strokeWidth="1.5" />
              <rect x="14" y="31" width="6" height="4" rx="1" fill="currentColor" opacity="0.4" />
              <rect x="28" y="31" width="14" height="4" rx="1" fill="currentColor" opacity="0.25" />
              <rect x="14" y="40" width="6" height="4" rx="1" fill="currentColor" opacity="0.4" />
              <rect x="28" y="40" width="20" height="4" rx="1" fill="currentColor" opacity="0.25" />
            </svg>
            <p className="text-sm font-medium text-[#8E8E93]">No datasets yet</p>
            <p className="text-xs text-[#AEAEB2] mt-1">Upload a CSV file above to get started</p>
          </div>
        ) : (
          <div className="border border-black/[0.09] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F5F7] border-b border-black/[0.09]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wide">
                    Rows
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wide">
                    Columns
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wide">
                    Uploaded
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {datasets.map((dataset) => (
                  <Fragment key={dataset.id}>
                    <tr
                      className={cn(
                        'border-b border-black/[0.09] cursor-pointer transition-colors hover:bg-[#F5F5F7]',
                        expandedId === dataset.id && 'bg-[#F5F5F7]',
                      )}
                      onClick={() => handleExpand(dataset.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            size={14}
                            className={cn(
                              'text-[#AEAEB2] transition-transform shrink-0',
                              expandedId === dataset.id && 'rotate-90',
                            )}
                          />
                          <span className="font-medium text-[#1C1C1E]">{dataset.name}</span>
                          <span className="text-xs text-[#AEAEB2]">{dataset.original_filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#636366] tabular-nums">
                        {dataset.row_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#636366]">
                        {dataset.columns.length}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#8E8E93]">
                        {formatDate(dataset.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteId(dataset.id)
                          }}
                          className="text-[#AEAEB2] hover:text-[#FF3B30] hover:bg-[#FF3B30]/8"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>

                    {expandedId === dataset.id && (
                      <tr>
                        <td colSpan={5} className="p-0 bg-white">
                          {previewLoading ? (
                            <div className="flex justify-center py-8">
                              <Loader2 size={20} className="animate-spin text-[#AEAEB2]" />
                            </div>
                          ) : preview ? (
                            <PreviewPanel
                              preview={preview}
                              dataset={dataset}
                              page={previewPage}
                              pageSize={PAGE_SIZE}
                              onPrev={handlePrevPage}
                              onNext={handleNextPage}
                            />
                          ) : null}

                          <div className="px-4 py-3 border-t border-black/[0.09]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-[#8E8E93] flex items-center gap-1.5">
                                <Calculator size={12} />
                                Computed columns
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs gap-1"
                                onClick={() => setAddColOpen(true)}
                              >
                                <Plus size={11} />
                                Add
                              </Button>
                            </div>

                            {computedColsLoading ? (
                              <div className="flex justify-center py-2">
                                <Loader2 size={14} className="animate-spin text-[#AEAEB2]" />
                              </div>
                            ) : computedCols.length === 0 ? (
                              <p className="text-xs text-[#AEAEB2]">No computed columns yet.</p>
                            ) : (
                              <div className="space-y-1">
                                {computedCols.map((col) => (
                                  <div
                                    key={col.id}
                                    className="flex items-center gap-2 text-sm py-0.5"
                                  >
                                    <Calculator size={12} className="text-[#AEAEB2] shrink-0" />
                                    <span className="font-medium text-[#3A3A3C]">{col.name}</span>
                                    <span className="text-[#AEAEB2] font-mono text-xs truncate flex-1 min-w-0">
                                      {col.expression}
                                    </span>
                                    <Badge variant={col.result_type as ColumnSchema['type']}>
                                      {col.result_type}
                                    </Badge>
                                    <button
                                      className="shrink-0 text-[#AEAEB2] hover:text-red-500 transition-colors"
                                      onClick={() => handleDeleteComputedCol(col.id)}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#1C1C1E] flex items-center gap-2">
            <GitMerge size={16} />
            Joined Datasets
          </h2>
          <Button variant="outline" size="sm" onClick={() => setJoinOpen(true)} className="gap-1">
            <Plus size={13} />
            Create Join
          </Button>
        </div>

        {joinedDatasets.length === 0 ? (
          <p className="text-center text-sm text-[#AEAEB2] py-8">
            No joined datasets. Create a join to combine two datasets.
          </p>
        ) : (
          <div className="border border-black/[0.09] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F5F7] border-b border-black/[0.09]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wide">
                    Left
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wide">
                    Right
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wide">
                    Columns
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {joinedDatasets.map((j) => {
                  const leftName =
                    datasets.find((d) => d.id === j.left_dataset_id)?.name ?? j.left_dataset_id
                  const rightName =
                    datasets.find((d) => d.id === j.right_dataset_id)?.name ?? j.right_dataset_id
                  return (
                    <tr key={j.id} className="border-b border-black/[0.09] last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <GitMerge size={13} className="text-[#007AFF] shrink-0" />
                          <span className="font-medium text-[#1C1C1E]">{j.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#636366]">
                        {leftName}{' '}
                        <span className="text-[#AEAEB2]">on</span>{' '}
                        <span className="font-mono text-xs">{j.left_key}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#636366]">
                        {rightName}{' '}
                        <span className="text-[#AEAEB2]">on</span>{' '}
                        <span className="font-mono text-xs">{j.right_key}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#F2F2F7] text-[#636366] font-medium capitalize">
                          {j.join_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#636366]">{j.columns.length}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteJoinId(j.id)}
                          className="text-[#AEAEB2] hover:text-[#FF3B30] hover:bg-[#FF3B30]/8"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!deleteId} onClose={() => !deleting && setDeleteId(null)}>
        <DialogHeader>
          <DialogTitle>Delete dataset</DialogTitle>
          <DialogDescription>
            Permanently delete <strong>{deleteTarget?.name}</strong>? All data will be removed and
            this cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={!!deleteJoinId} onClose={() => !deletingJoin && setDeleteJoinId(null)}>
        <DialogHeader>
          <DialogTitle>Delete joined dataset</DialogTitle>
          <DialogDescription>
            Permanently delete <strong>{deleteJoinTarget?.name}</strong>? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteJoinId(null)} disabled={deletingJoin}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteJoin} disabled={deletingJoin}>
            {deletingJoin ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </Dialog>

      {expandedId && (
        <AddComputedColumnDialog
          open={addColOpen}
          datasetId={expandedId}
          onClose={() => setAddColOpen(false)}
          onAdded={(col) => setComputedCols((prev) => [...prev, col])}
        />
      )}

      <CreateJoinDialog
        open={joinOpen}
        datasets={datasets}
        onClose={() => setJoinOpen(false)}
      />
    </div>
  )
}
