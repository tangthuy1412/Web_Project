import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  FolderGit2,
  MessageSquare,
  Settings,
  TrendingUp,
  Github,
  Home,
  Route,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navigation = [
  { name: 'Trang chủ', to: '/', icon: Home },
  { name: 'Bảng điều khiển', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Kho mã nguồn', to: '/repositories', icon: FolderGit2 },
  { name: 'Lộ trình học', to: '/roadmaps', icon: Route },
  { name: 'AI Mentor', to: '/chat', icon: MessageSquare },
  { name: 'Tiến độ', to: '/progress', icon: TrendingUp },
  { name: 'GitHub', to: '/github/connect', icon: Github },
  { name: 'Cài đặt', to: '/settings', icon: Settings }
]

type SidebarProps = {
  isCollapsed: boolean
  onCollapsedChange: (isCollapsed: boolean) => void
}

export const Sidebar = ({ isCollapsed, onCollapsedChange }: SidebarProps) => {

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-200/60 dark:shadow-black/20 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="soft-pulse h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Github className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                GitAnalyzer
              </span>
            </div>
          )}
          <button
            onClick={() => onCollapsedChange(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )
              }
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800 p-4">
          <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              AJ
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  Nguyễn Minh
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  developer@example.com
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
