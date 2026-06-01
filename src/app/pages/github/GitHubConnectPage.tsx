import { useState } from 'react'
import { AlertCircle, CheckCircle2, Github, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/authStore'

const permissions = [
  'Đọc danh sách repository bạn cho phép',
  'Phân tích metadata, README, tech stack và tín hiệu chất lượng',
  'Tạo insight kỹ năng, skill gap và roadmap cá nhân hóa'
]

const securityNotes = [
  'Không yêu cầu Personal Access Token',
  'Không chỉnh sửa hoặc push code vào repository',
  'Có thể thu hồi quyền bất cứ lúc nào trong GitHub settings',
  'Chỉ dùng quyền truy cập để phục vụ phân tích repository'
]

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
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="info" className="mb-3">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            GitHub OAuth
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Kết nối GitHub
          </h1>
          <p className="mt-1 max-w-2xl text-slate-500 dark:text-slate-400">
            Kết nối tài khoản GitHub bằng OAuth để phân tích repository và tạo lộ trình học cá nhân hóa.
          </p>
        </div>
        {user?.githubConnected && (
          <Badge variant="success" className="w-fit">
            Đã kết nối
          </Badge>
        )}
      </div>

      <Card className={user?.githubConnected ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/20'}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={user?.githubConnected ? 'flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' : 'flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300'}>
                {user?.githubConnected ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              </div>
              <div>
                <h2 className={user?.githubConnected ? 'font-semibold text-emerald-950 dark:text-emerald-100' : 'font-semibold text-amber-950 dark:text-amber-100'}>
                  {user?.githubConnected ? 'GitHub đã được kết nối' : 'Chưa kết nối GitHub'}
                </h2>
                <p className={user?.githubConnected ? 'mt-1 text-sm text-emerald-700 dark:text-emerald-300' : 'mt-1 text-sm text-amber-700 dark:text-amber-300'}>
                  {user?.githubConnected
                    ? <>Tài khoản <strong>@{user.githubUsername}</strong> đang sẵn sàng để phân tích repository.</>
                    : 'Hãy kết nối GitHub để bắt đầu phân tích source code bằng AI.'}
                </p>
              </div>
            </div>

            {user?.githubConnected ? (
              <Button
                variant="outline"
                onClick={disconnectGitHub}
                className="border-emerald-300 bg-white/70 dark:border-emerald-800 dark:bg-slate-950/40"
              >
                Ngắt kết nối
              </Button>
            ) : (
              <Button onClick={handleConnect} isLoading={isConnecting}>
                <Github className="mr-2 h-5 w-5" />
                Kết nối bằng GitHub
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Phương thức kết nối chính thức
            </CardTitle>
            <CardDescription>
              OAuth giúp xác thực an toàn hơn và không cần nhập token thủ công.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Không dùng Personal Access Token</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Người dùng chỉ cần xác nhận quyền qua GitHub OAuth. Cách này giảm rủi ro lộ token và dễ thu hồi quyền hơn.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {permissions.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={handleConnect} isLoading={isConnecting} disabled={user?.githubConnected}>
              <Github className="mr-2 h-5 w-5" />
              {user?.githubConnected ? 'GitHub đã kết nối' : 'Tiếp tục với GitHub'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Bảo mật & quyền riêng tư
            </CardTitle>
            <CardDescription>
              Luồng kết nối được tối giản để người dùng hiểu rõ quyền truy cập.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {securityNotes.map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{item}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
