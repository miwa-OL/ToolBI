import { BarChart2 } from 'lucide-react'

export default function ReportPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
      <BarChart2 size={40} strokeWidth={1.5} />
      <p className="text-sm">Report builder — coming in Session 6</p>
    </div>
  )
}
