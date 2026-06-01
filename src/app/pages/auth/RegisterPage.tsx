import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Github, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/authStore'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const register = useAuthStore(state => state.register)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setIsLoading(true)
    await register(email, password, name)
    setIsLoading(false)
    navigate('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mb-4 flex justify-center lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600">
            <Github className="h-7 w-7 text-white" />
          </div>
        </div>
        <Badge variant="info">Tạo workspace</Badge>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Tạo tài khoản
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Bắt đầu phân tích repository với GitAnalyzer AI
        </p>
      </div>

      <Card className="hover-lift shadow-xl shadow-slate-200/70 dark:shadow-black/20">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-[2.45rem] h-4 w-4 text-slate-400" />
              <Input
                label="Họ và tên"
                type="text"
                placeholder="Nguyễn Minh"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={error}
                className="pl-9"
                required
              />
            </div>

            <div className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 rounded border-slate-300 dark:border-slate-700" required />
              <span className="text-slate-600 dark:text-slate-400">
                Tôi đồng ý với{' '}
                <a href="#" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  Điều khoản sử dụng
                </a>{' '}
                và{' '}
                <a href="#" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  Chính sách bảo mật
                </a>
              </span>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Tạo tài khoản
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500 dark:bg-slate-900">Hoặc đăng ký với</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="w-full">
                <Github className="mr-2 h-5 w-5" />
                GitHub
              </Button>
              <Button type="button" variant="outline" className="w-full">
                Google
              </Button>
            </div>
          </div>
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
