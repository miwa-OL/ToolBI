import { create } from 'zustand'

interface Toast {
  id: string
  type: 'error' | 'success'
  message: string
}

interface ToastState {
  toasts: Toast[]
  _add: (t: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  _add: (t) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4000)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))

export const toast = {
  error: (message: string) => useToastStore.getState()._add({ type: 'error', message }),
  success: (message: string) => useToastStore.getState()._add({ type: 'success', message }),
}
