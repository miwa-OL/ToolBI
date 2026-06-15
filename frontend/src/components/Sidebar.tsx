import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart2, ChevronLeft, Database, HelpCircle, LayoutDashboard, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReportStore } from '@/store/reportStore'
import { ToolBILogo } from '@/components/ToolBILogo'

interface SidebarProps {
  onCollapse: () => void
}

export function Sidebar({ onCollapse }: SidebarProps) {
  const navigate = useNavigate()
  const { reports, fetchReports, createReport } = useReportStore()

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleNewReport = async () => {
    const summary = await createReport('New Report')
    navigate(`/report/${summary.id}`)
  }

  const navItem = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150',
      isActive
        ? 'bg-[#007AFF]/10 text-[#007AFF] font-medium'
        : 'text-[#3A3A3C] hover:bg-black/5 hover:text-[#1C1C1E]',
    )

  return (
    <nav className="w-56 h-full shrink-0 bg-white/80 backdrop-blur-xl border-r border-black/[0.08] flex flex-col overflow-y-auto">
      <div className="px-4 pt-4 pb-3 shrink-0 flex items-center justify-between">
        <ToolBILogo />
        <button
          onClick={onCollapse}
          className="text-[#AEAEB2] hover:text-[#636366] transition-colors p-1 rounded-lg hover:bg-black/5"
          title="Collapse sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-0.5 px-2 pb-3 shrink-0">
        <NavLink to="/" end className={navItem}>
          <Database size={15} className="shrink-0" />
          Data Sources
        </NavLink>
      </div>

      <div className="px-2 pt-3 pb-2 border-t border-black/[0.06] shrink-0">
        <div className="flex items-center justify-between px-3 pb-1.5">
          <span className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-widest">
            Reports
          </span>
          <button
            className="text-[#8E8E93] hover:text-[#007AFF] transition-colors rounded-md p-0.5 hover:bg-[#007AFF]/10"
            onClick={handleNewReport}
            title="New report"
          >
            <Plus size={13} />
          </button>
        </div>
        <div className="flex flex-col gap-0.5">
          {reports.map((r) => (
            <NavLink key={r.id} to={`/report/${r.id}`} className={navItem}>
              <BarChart2 size={13} className="shrink-0" />
              <span className="truncate">{r.name}</span>
            </NavLink>
          ))}
          {!reports.length && (
            <p className="px-3 py-1 text-xs text-[#AEAEB2]">No reports yet</p>
          )}
        </div>
      </div>

      <div className="px-2 pt-3 pb-2 border-t border-black/[0.06]">
        <div className="flex items-center px-3 pb-1.5">
          <span className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-widest">
            Dashboards
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {reports.map((r) => (
            <NavLink key={r.id} to={`/dashboard/${r.id}`} className={navItem}>
              <LayoutDashboard size={13} className="shrink-0" />
              <span className="truncate">{r.name}</span>
            </NavLink>
          ))}
          {!reports.length && (
            <p className="px-3 py-1 text-xs text-[#AEAEB2]">No dashboards yet</p>
          )}
        </div>
      </div>
      <div className="mt-auto px-2 pt-2 pb-4 border-t border-black/[0.06]">
        <NavLink to="/help" className={navItem}>
          <HelpCircle size={14} className="shrink-0" />
          Help
        </NavLink>
      </div>
    </nav>
  )
}
