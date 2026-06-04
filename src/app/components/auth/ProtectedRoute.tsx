import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '../../stores/authStore'

export const ProtectedRoute = () => {
  const location = useLocation()
  const { isAuthenticated, isBootstrapping } = useAuthStore()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Đang kiểm tra đăng nhập...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
