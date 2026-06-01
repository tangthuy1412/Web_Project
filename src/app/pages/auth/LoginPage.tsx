import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Github, LockKeyhole, Mail } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/authStore'

export const LoginPage = () => {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    await login(email, password)
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
        <Badge variant="info">Chào mừng trở lại</Badge>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Đăng nhập GitAnalyzer
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Tiếp tục vào workspace phân tích repository của bạn
        </p>
      </div>

      <Card className="hover-lift shadow-xl shadow-slate-200/70 dark:shadow-black/20">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-700" />
                <span className="text-slate-600 dark:text-slate-400">Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Quên mật khẩu?
              </a>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Đăng nhập
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500 dark:bg-slate-900">Hoặc tiếp tục với</span>
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
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Đăng ký
        </Link>
      </p>
    </div>
  )
}
