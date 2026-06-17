import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Github, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { SocialLoginPanel } from '../../components/auth/SocialLoginPanel'
import { useAuthStore } from '../../stores/authStore'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { register, error: apiError } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setIsLoading(true)
    try {
      await register(email, password, name)
      navigate('/dashboard')
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
        <Badge variant="info">Tạo tài khoản</Badge>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Bắt đầu với GitAnalyzer
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Tạo tài khoản để lưu phân tích repository, roadmap và cuộc trò chuyện với AI Mentor.
        </p>
      </div>

      <Card className="hover-lift shadow-xl shadow-slate-200/70 dark:shadow-black/20">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || apiError) && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error || apiError}
              </div>
            )}

            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-[2.45rem] h-4 w-4 text-slate-400" />
              <Input
                label="Họ và tên"
                type="text"
                placeholder="Nguyễn Minh"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="pl-9"
                required
              />
            </div>

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
                placeholder="Tạo mật khẩu"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pl-9"
                required
              />
            </div>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-[2.45rem] h-4 w-4 text-slate-400" />
              <Input
                label="Xác nhận mật khẩu"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={error}
                className="pl-9"
                required
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Tạo tài khoản
            </Button>
          </form>

          <SocialLoginPanel onSuccess={() => navigate('/dashboard')} />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
