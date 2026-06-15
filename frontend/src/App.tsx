import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'
import DataSources from '@/pages/DataSources'
import ReportBuilder from '@/pages/ReportBuilder'
import Dashboard from '@/pages/Dashboard'
import Help from '@/pages/Help'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[#F2F2F7]">
        <div
          style={{
            width: sidebarOpen ? '224px' : '0px',
            transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div style={{ width: '224px', height: '100%' }}>
            <Sidebar onCollapse={() => setSidebarOpen(false)} />
          </div>
        </div>

        <main className="flex-1 overflow-auto min-w-0">
          <Routes>
            <Route path="/" element={<DataSources />} />
            <Route path="/report/:reportId" element={<ReportBuilder />} />
            <Route path="/dashboard/:reportId" element={<Dashboard />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>

        <button
          onClick={() => setSidebarOpen(true)}
          title="Open sidebar"
          className={cn(
            'fixed top-4 left-3 z-50 w-8 h-8 bg-white/90 backdrop-blur-sm border border-black/[0.09] rounded-xl shadow-md flex items-center justify-center text-[#636366] hover:text-[#007AFF] hover:bg-white transition-all duration-200',
            sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100',
          )}
        >
          <Menu size={15} />
        </button>
      </div>
    </BrowserRouter>
  )
}
