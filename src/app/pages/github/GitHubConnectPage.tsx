import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AlertCircle, ArrowRight, CheckCircle2, Github, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/authStore'
import { useRepositoryStore } from '../../stores/repositoryStore'

export const GitHubConnectPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    user,
    connectGitHub,
    disconnectGitHub,
    refreshGitHubAccount,
    isLoading,
    error
  } = useAuthStore()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notice, setNotice] = useState('')
  const {
    repositories,
    fetchRepositories,
    isLoading: isRepositoriesLoading,
    error: repositoryError
  } = useRepositoryStore()

  useEffect(() => {
    refreshGitHubAccount()
    fetchRepositories().catch(() => undefined)
  }, [fetchRepositories, refreshGitHubAccount])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const hasSuccess = params.get('success') === 'true' || params.get('github') === 'connected' || params.get('connected') === 'true'
    const errorMessage = params.get('error') || params.get('message')

    if (hasSuccess) {
      setNotice('GitHub OAuth đã hoàn tất. Đang cập nhật trạng thái kết nối.')
      refreshGitHubAccount()
      fetchRepositories().catch(() => undefined)
      navigate('/github/connect', { replace: true })
      return
    }

    if (errorMessage) {
      setNotice(`GitHub OAuth thất bại: ${errorMessage}`)
      navigate('/github/connect', { replace: true })
    }
  }, [location.search, navigate, refreshGitHubAccount])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshGitHubAccount()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Kết nối GitHub
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Kết nối OAuth để đồng bộ repository, packages và commits từ GitHub.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {notice && (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-300">
          {notice}
        </div>
      )}

      {repositoryError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{repositoryError}</p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={user?.githubConnected ? 'flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}>
                {user?.githubConnected ? <CheckCircle2 className="h-6 w-6" /> : <Github className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
                    GitHub OAuth
                  </h2>
                  {user?.githubConnected ? <Badge variant="success">Đã kết nối</Badge> : <Badge variant="default">Chưa kết nối</Badge>}
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {user?.githubConnected
                    ? <>Đang kết nối với tài khoản <strong>@{user.githubUsername || 'GitHub'}</strong>.</>
                    : 'Đăng nhập GitHub để cấp quyền đọc repository.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleRefresh} isLoading={isRefreshing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Làm mới
              </Button>
              {user?.githubConnected ? (
                <Button variant="outline" onClick={disconnectGitHub} isLoading={isLoading}>
                  Ngắt kết nối
                </Button>
              ) : (
                <Button onClick={connectGitHub} isLoading={isLoading}>
                  <Github className="mr-2 h-5 w-5" />
                  Kết nối GitHub
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {user?.githubConnected && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Repositories
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Repository cached hiện có: {repositories.length}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => fetchRepositories()} isLoading={isRepositoriesLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tải cached
                </Button>
                <Button onClick={() => fetchRepositories(true)} isLoading={isRepositoriesLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Đồng bộ repositories
                </Button>
                <Link to="/repositories">
                  <Button variant="outline">
                    Mở repositories
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {repositories.length > 0 && (
              <div className="mt-5 space-y-2">
                {repositories.slice(0, 5).map((repo) => (
                  <Link
                    key={repo.id}
                    to={`/repositories/${repo.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm transition-colors hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-indigo-700 dark:hover:bg-slate-800/50"
                  >
                    <span className="font-medium text-slate-900 dark:text-slate-100">{repo.fullName || repo.name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{repo.language}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!user?.githubConnected && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>Cần kết nối GitHub trước khi đồng bộ repository và chạy phân tích.</p>
        </div>
      )}
    </div>
  )
}
