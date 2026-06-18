import { type FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Github, LockKeyhole, Mail } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { SocialLoginPanel } from '../../components/auth/SocialLoginPanel'
import { API_ORIGIN } from '../../config/api'
import { useAuthStore } from '../../stores/authStore'
import {
  getAppTokenFromParams,
  getGithubAccessTokenFromParams,
  getMergedUrlParams,
  getOAuthErrorFromParams
} from '../../lib/authCallback'
import { getDefaultAuthenticatedPath } from '../../lib/authNavigation'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { completeLoginWithToken, isAuthenticated, isBootstrapping, login, loginWithGithub, user, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const goNext = () => {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
    navigate(from ?? getDefaultAuthenticatedPath(useAuthStore.getState().user))
  }

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      navigate(getDefaultAuthenticatedPath(user), { replace: true })
    }
  }, [isAuthenticated, isBootstrapping, navigate, user])

  useEffect(() => {
    const params = getMergedUrlParams()
    const appToken = getAppTokenFromParams(params)
    const githubAccessToken = getGithubAccessTokenFromParams(params)
    const oauthError = getOAuthErrorFromParams(params)

    if (params.has('code') && params.has('state')) {
      window.location.replace(`${API_ORIGIN}/api/auth/github/callback${window.location.search}`)
      return
    }

    if (oauthError) {
      useAuthStore.setState({ isLoading: false, error: `Đăng nhập GitHub thất bại: ${oauthError}` })
      window.history.replaceState(null, '', '/login')
      return
    }

    if (!appToken && !githubAccessToken) return

    const complete = appToken
      ? completeLoginWithToken(appToken)
      : loginWithGithub(githubAccessToken as string)

    complete
      .then(() => {
        window.history.replaceState(null, '', '/login')
        goNext()
      })
      .catch(() => {
        useAuthStore.setState({
          isLoading: false,
          error: 'Không thể hoàn tất đăng nhập GitHub. Vui lòng thử lại.'
        })
        window.history.replaceState(null, '', '/login')
      })
  }, [completeLoginWithToken, loginWithGithub])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      goNext()
    } catch {
      return
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mb-4 flex justify-center lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600">
            <Github className="h-7 w-7 text-white" />
          </div>
        </div>
        <Badge variant="info">Chào mừng trở lại</Badge>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Đăng nhập GitAnalyzer
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Tiếp tục phân tích repository và theo dõi lộ trình của bạn.
        </p>
      </div>

      <Card className="hover-lift shadow-xl shadow-slate-200/70 dark:shadow-black/20">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-[2.45rem] h-4 w-4 text-slate-400" />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="pl-9"
                required
              />
            </div>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-[2.45rem] h-4 w-4 text-slate-400" />
              <Input
                label="Mật khẩu"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pl-9"
                required
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Đăng nhập
            </Button>
          </form>

          <SocialLoginPanel onSuccess={goNext} />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Đăng ký
        </Link>
      </p>
    </div>
  )
}
