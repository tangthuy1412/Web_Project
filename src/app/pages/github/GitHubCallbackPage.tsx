import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Github } from 'lucide-react'
import { API_ORIGIN } from '../../config/api'
import {
  getAppTokenFromParams,
  getGithubAccessTokenFromParams,
  getMergedUrlParams,
  getOAuthErrorFromParams
} from '../../lib/authCallback'
import { getDefaultAuthenticatedPath } from '../../lib/authNavigation'
import { useAuthStore } from '../../stores/authStore'

const getBackendCallbackUrl = () => {
  const pathname = window.location.pathname
  const githubAuthIntent = sessionStorage.getItem('gitanalyzer.githubAuthIntent')
  const isLoginCallback = pathname.includes('/auth/github/callback') || githubAuthIntent === 'login'

  return isLoginCallback
    ? `${API_ORIGIN}/api/auth/github/callback`
    : `${API_ORIGIN}/api/github/oauth/callback`
}

const failGitHubLogin = (message: string) => {
  sessionStorage.removeItem('gitanalyzer.githubAuthIntent')
  useAuthStore.setState({ isLoading: false, error: message })
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
    const params = getMergedUrlParams()
    const appToken = getAppTokenFromParams(params)
    const githubAccessToken = getGithubAccessTokenFromParams(params)
    const githubAuthIntent = sessionStorage.getItem('gitanalyzer.githubAuthIntent')
    const errorMessage = getOAuthErrorFromParams(params)

    if (errorMessage) {
      failGitHubLogin(`Đăng nhập GitHub thất bại: ${errorMessage}`)
      navigate('/login', { replace: true })
      return
    }

    if (appToken) {
      sessionStorage.removeItem('gitanalyzer.githubAuthIntent')
      completeLoginWithToken(appToken)
        .then(() => navigate(getDefaultAuthenticatedPath(useAuthStore.getState().user), { replace: true }))
        .catch(() => {
          failGitHubLogin('Không thể xác thực tài khoản GitHub. Vui lòng thử lại.')
          navigate('/login', { replace: true })
        })
      return
    }

    if (githubAccessToken) {
      sessionStorage.removeItem('gitanalyzer.githubAuthIntent')
      loginWithGithub(githubAccessToken)
        .then(() => navigate(getDefaultAuthenticatedPath(useAuthStore.getState().user), { replace: true }))
        .catch(() => {
          failGitHubLogin('Không thể xác thực tài khoản GitHub. Vui lòng thử lại.')
          navigate('/login', { replace: true })
        })
      return
    }

    if (params.has('code')) {
      window.location.replace(`${getBackendCallbackUrl()}${window.location.search}`)
      return
    }

    if (isBootstrapping) return

    if (githubAuthIntent === 'login' && !isAuthenticated) {
      failGitHubLogin('GitHub đã phản hồi nhưng hệ thống chưa nhận được token đăng nhập. Vui lòng thử lại.')
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
