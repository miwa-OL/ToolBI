import { LayoutDashboard } from 'lucide-react'

export default function DashboardPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
      <LayoutDashboard size={40} strokeWidth={1.5} />
      <p className="text-sm">Dashboard view — coming in Session 7</p>
    </div>
  )
}
