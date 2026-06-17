import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../../stores/authStore'

export const StudentRoute = () => {
  const { user, isBootstrapping } = useAuthStore()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Đang kiểm tra quyền truy cập...
      </div>
    )
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
