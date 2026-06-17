import { Bell, LogOut, Moon, Search, Sun } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '../ui/Button'
import { useTheme } from '../../hooks/useTheme'
import { useAuthStore } from '../../stores/authStore'

export const Topbar = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 bg-white/80 shadow-sm shadow-slate-200/60 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-black/10">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex max-w-2xl flex-1 items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm repository, phân tích, feedback..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="ml-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-10 w-10 p-0" title="Đổi giao diện">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="sm" className="relative h-10 w-10 p-0" onClick={() => navigate('/notifications')} title="Thông báo">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={handleLogout} title="Đăng xuất">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
