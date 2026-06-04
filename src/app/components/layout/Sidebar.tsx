import { NavLink } from 'react-router'
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  Github,
  Home,
  LayoutDashboard,
  MessageSquare,
  Route,
  Settings,
  TrendingUp
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'

const navigation = [
  { name: 'Trang chủ', to: '/dashboard', icon: Home },
  { name: 'Tổng quan', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Repositories', to: '/repositories', icon: FolderGit2 },
  { name: 'Lộ trình', to: '/roadmaps', icon: Route },
  { name: 'AI Mentor', to: '/chat', icon: MessageSquare },
  { name: 'Tiến độ', to: '/progress', icon: TrendingUp },
  { name: 'GitHub', to: '/github/connect', icon: Github },
  { name: 'Thông báo', to: '/notifications', icon: Bell },
  { name: 'Cài đặt', to: '/settings', icon: Settings }
]

type SidebarProps = {
  isCollapsed: boolean
  onCollapsedChange: (isCollapsed: boolean) => void
}

export const Sidebar = ({ isCollapsed, onCollapsedChange }: SidebarProps) => {
  const user = useAuthStore(state => state.user)
  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-200/60 dark:shadow-black/20 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="soft-pulse flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <Github className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-lg font-semibold text-transparent">
                GitAnalyzer
              </span>
            </div>
          )}
          <button
            onClick={() => onCollapsedChange(!isCollapsed)}
            className="rounded-md p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                )
              }
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-medium text-white">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user?.name || 'Người dùng'}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email || 'Chưa có email'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
