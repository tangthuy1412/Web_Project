import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AlertCircle, ArrowRight, CheckCircle2, ExternalLink, Github, RefreshCw } from 'lucide-react'
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
    error,
    githubLogoutUrl,
    githubJustDisconnected
  } = useAuthStore()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notice, setNotice] = useState('')
  const [logoutHintVisible, setLogoutHintVisible] = useState(false)
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
  }, [fetchRepositories, location.search, navigate, refreshGitHubAccount])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshGitHubAccount()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDisconnect = async () => {
    await disconnectGitHub()
    setNotice('GitHub đã được ngắt liên kết khỏi hệ thống.')
  }

  const handleOpenGitHubLogout = () => {
    window.open(githubLogoutUrl || 'https://github.com/logout', '_blank', 'noopener,noreferrer')
    setLogoutHintVisible(true)
  }

  const handleConnectAnotherAccount = async () => {
    if (user?.githubConnected) {
      await disconnectGitHub()
    }

    window.open('https://github.com/logout', '_blank', 'noopener,noreferrer')
    setLogoutHintVisible(true)
  }

  const isPostLogoutFlow = (githubJustDisconnected || logoutHintVisible) && !user?.githubConnected

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

      {!isPostLogoutFlow && (
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />
          <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
              <Button className="w-full sm:w-auto" variant="outline" onClick={handleRefresh} isLoading={isRefreshing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Làm mới
              </Button>
              {user?.githubConnected ? (
                <>
                  <Button className="w-full sm:w-auto" variant="outline" onClick={handleDisconnect} isLoading={isLoading}>
                    Ngắt kết nối
                  </Button>
                  <Button className="w-full whitespace-nowrap sm:w-auto" onClick={handleConnectAnotherAccount} isLoading={isLoading}>
                    Kết nối GitHub khác
                  </Button>
                </>
              ) : (
                <Button className="w-full sm:w-auto" onClick={() => connectGitHub()} isLoading={isLoading}>
                  <Github className="mr-2 h-5 w-5" />
                  Kết nối GitHub
                </Button>
              )}
            </div>
          </div>

          <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
            Ngắt kết nối trong app chỉ ngắt liên kết GitHub khỏi hệ thống. Nếu GitHub vẫn tự dùng tài khoản cũ, hãy đăng xuất GitHub.com hoặc dùng cửa sổ ẩn danh.
          </p>

          {user?.githubConnected && (
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt=""
                  className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700"
                />
              )}
              <div className="text-sm">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {user.githubUsername ? `@${user.githubUsername}` : 'Tài khoản GitHub đã kết nối'}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Ngắt kết nối trong app chỉ ngắt liên kết GitHub khỏi hệ thống.
                </p>
              </div>
            </div>
          )}
          </CardContent>
        </Card>
      )}

      {isPostLogoutFlow && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  GitHub đã được ngắt liên kết
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Ngắt kết nối trong app chỉ ngắt liên kết GitHub khỏi hệ thống. Nếu GitHub vẫn tự dùng tài khoản cũ, hãy đăng xuất GitHub.com hoặc dùng cửa sổ ẩn danh.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => connectGitHub({ forceAccountSelection: true })} isLoading={isLoading}>
                  <Github className="mr-2 h-5 w-5" />
                  Kết nối lại GitHub
                </Button>
                <Button variant="outline" onClick={handleOpenGitHubLogout}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Đăng xuất GitHub.com để dùng tài khoản khác
                </Button>
              </div>
              {logoutHintVisible && (
                <p className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-300">
                  Đã mở trang đăng xuất GitHub.com. Sau khi đăng xuất xong, quay lại app và bấm Kết nối lại GitHub.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {user?.githubConnected && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Repositories
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Repository đã cache hiện có: {repositories.length}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => fetchRepositories()} isLoading={isRepositoriesLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tải từ cache
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

      {!user?.githubConnected && !isPostLogoutFlow && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>Cần kết nối GitHub trước khi đồng bộ repository và chạy phân tích.</p>
        </div>
      )}
    </div>
  )
}
