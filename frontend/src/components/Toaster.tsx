import { X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'

export function Toaster() {
  const { toasts, remove } = useToastStore()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[100] pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm pointer-events-auto max-w-sm ${
            t.type === 'error'
              ? 'bg-white border-red-100 text-red-700'
              : 'bg-white border-green-100 text-green-700'
          }`}
        >
          <span className="flex-1">{t.message}</span>
          <button
            className="shrink-0 text-current opacity-40 hover:opacity-100 transition-opacity mt-0.5"
            onClick={() => remove(t.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
