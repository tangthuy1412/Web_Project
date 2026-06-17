import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Github } from 'lucide-react'
import { API_ORIGIN } from '../../config/api'
import { getDefaultAuthenticatedPath } from '../../lib/authNavigation'
import { useAuthStore } from '../../stores/authStore'

const getBackendCallbackUrl = () => {
  return `${API_ORIGIN}/api/github/oauth/callback`
}

const getTokenFromParams = (params: URLSearchParams) => {
  return (
    params.get('accessToken') ||
    params.get('token') ||
    params.get('jwt') ||
    params.get('appToken') ||
    params.get('authToken')
  )
}

const getGithubAccessTokenFromParams = (params: URLSearchParams) => {
  return params.get('githubAccessToken') || params.get('github_token') || params.get('githubToken')
}

export const GitHubCallbackPage = () => {
  const navigate = useNavigate()
  const {
    isAuthenticated,
    isBootstrapping,
    refreshGitHubAccount,
    completeLoginWithToken,
    loginWithGithub
  } = useAuthStore()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const appToken = getTokenFromParams(params)
    const githubAccessToken = getGithubAccessTokenFromParams(params)
    const githubAuthIntent = sessionStorage.getItem('gitanalyzer.githubAuthIntent')

    if (appToken) {
      sessionStorage.removeItem('gitanalyzer.githubAuthIntent')
      completeLoginWithToken(appToken)
        .then(() => navigate(getDefaultAuthenticatedPath(useAuthStore.getState().user), { replace: true }))
        .catch(() => navigate('/login', { replace: true }))
      return
    }

    if (githubAccessToken) {
      sessionStorage.removeItem('gitanalyzer.githubAuthIntent')
      loginWithGithub(githubAccessToken)
        .then(() => navigate(getDefaultAuthenticatedPath(useAuthStore.getState().user), { replace: true }))
        .catch(() => navigate('/login', { replace: true }))
      return
    }

    if (params.has('code')) {
      window.location.replace(`${getBackendCallbackUrl()}${window.location.search}`)
      return
    }

    if (isBootstrapping) return

    if (githubAuthIntent === 'login' && !isAuthenticated) {
      sessionStorage.removeItem('gitanalyzer.githubAuthIntent')
      navigate('/login', { replace: true })
      return
    }

    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }

    refreshGitHubAccount().finally(() => {
      navigate('/github/connect', { replace: true })
    })
  }, [completeLoginWithToken, isAuthenticated, isBootstrapping, loginWithGithub, navigate, refreshGitHubAccount])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <Github className="h-6 w-6" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Đang hoàn tất đăng nhập GitHub...</p>
      </div>
    </div>
  )
}
