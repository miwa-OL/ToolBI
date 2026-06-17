import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import DataSources from '@/pages/DataSources'
import ReportBuilder from '@/pages/ReportBuilder'
import Dashboard from '@/pages/Dashboard'
import Help from '@/pages/Help'
import { UpdateBanner } from '@/components/UpdateBanner'

const SIDEBAR_TIMING = 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const splash = document.getElementById('splash')
    if (!splash) return
    splash.classList.add('out')
    const t = setTimeout(() => splash.remove(), 380)
    return () => clearTimeout(t)
  }, [])

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[#F2F2F7]">
        <div
          style={{
            width: sidebarOpen ? '224px' : '0px',
            transition: SIDEBAR_TIMING,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div style={{ width: '224px', height: '100%' }}>
            <Sidebar onCollapse={() => setSidebarOpen(false)} />
          </div>
        </div>

        <div
          style={{
            width: sidebarOpen ? '0px' : '40px',
            transition: SIDEBAR_TIMING,
            overflow: 'hidden',
            flexShrink: 0,
            background: 'white',
          }}
        >
          <div style={{ width: '40px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              title="Open sidebar"
              style={{
                opacity: sidebarOpen ? 0 : 1,
                transition: sidebarOpen ? 'opacity 0s' : 'opacity 0.15s ease 0.22s',
              }}
              className="w-8 h-8 flex items-center justify-center text-[#8E8E93] hover:text-[#007AFF] hover:bg-black/5 rounded-xl transition-colors"
            >
              <Menu size={15} />
            </button>
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

        <UpdateBanner />
      </div>
    </BrowserRouter>
  )
}
