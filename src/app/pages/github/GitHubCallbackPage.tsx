import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Github } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const getBackendCallbackUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'
  return `${new URL(apiBase).origin}/api/github/oauth/callback`
}

export const GitHubCallbackPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, isBootstrapping, refreshGitHubAccount } = useAuthStore()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.has('code')) {
      window.location.replace(`${getBackendCallbackUrl()}${window.location.search}`)
      return
    }

    if (isBootstrapping) return

    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }

    refreshGitHubAccount().finally(() => {
      navigate('/github/connect', { replace: true })
    })
  }, [isAuthenticated, isBootstrapping, navigate, refreshGitHubAccount])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <Github className="h-6 w-6" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Đang hoàn tất kết nối GitHub...</p>
      </div>
    </div>
  )
}
