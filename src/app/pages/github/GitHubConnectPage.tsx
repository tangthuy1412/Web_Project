import { useState } from 'react'
import { AlertCircle, CheckCircle2, Github } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/authStore'

export const GitHubConnectPage = () => {
  const { user, connectGitHub, disconnectGitHub } = useAuthStore()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    connectGitHub(user?.githubUsername || 'nguyenminh')
    setIsConnecting(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Kết nối GitHub
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Chọn phương thức kết nối để bắt đầu phân tích repository.
        </p>
      </div>

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
                  {user?.githubConnected ? (
                    <Badge variant="success">Đã kết nối</Badge>
                  ) : (
                    <Badge variant="default">Chưa kết nối</Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {user?.githubConnected
                    ? <>Đang kết nối với tài khoản <strong>@{user.githubUsername}</strong>.</>
                    : 'Đăng nhập GitHub để cấp quyền phân tích repository.'}
                </p>
              </div>
            </div>

            {user?.githubConnected ? (
              <Button variant="outline" onClick={disconnectGitHub}>
                Ngắt kết nối
              </Button>
            ) : (
              <Button onClick={handleConnect} isLoading={isConnecting}>
                <Github className="mr-2 h-5 w-5" />
                Kết nối GitHub
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!user?.githubConnected && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>Bạn cần kết nối GitHub trước khi phân tích repository.</p>
        </div>
      )}
    </div>
  )
}
