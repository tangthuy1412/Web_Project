import { Outlet } from 'react-router'
import { Sidebar } from '../components/layout/Sidebar'
import { ScrollToTop } from '../components/layout/ScrollToTop'
import { Topbar } from '../components/layout/Topbar'
import { cn } from '../lib/utils'
import { useState } from 'react'

export const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_26rem),linear-gradient(135deg,#f8fafc,#eef2ff_48%,#f8fafc)] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_28rem),linear-gradient(135deg,#020617,#0f172a_52%,#020617)]">
      <ScrollToTop />
      <Sidebar isCollapsed={isCollapsed} onCollapsedChange={setIsCollapsed} />
      <div className={cn('transition-all duration-300', isCollapsed ? 'pl-16' : 'pl-64')}>
        <Topbar />
        <main className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 [&>*]:mx-auto [&>*]:w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
