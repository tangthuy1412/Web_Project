import { Navigate } from 'react-router'
import { LandingPage } from '../../pages/landing/LandingPage'
import { useAuthStore } from '../../stores/authStore'

export const PublicHomeRoute = () => {
  const { isAuthenticated, isBootstrapping } = useAuthStore()

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <LandingPage />
}
