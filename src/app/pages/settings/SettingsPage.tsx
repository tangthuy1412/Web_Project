import { useState } from 'react'
import { User, Github, Bell, Palette, LogOut } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/authStore'
import { useTheme } from '../../hooks/useTheme'
import { useNavigate } from 'react-router'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Cài đặt
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Quản lý tài khoản và tùy chọn cá nhân
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Hồ sơ
          </CardTitle>
          <CardDescription>Cập nhật thông tin cá nhân</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Họ và tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-medium">
              {user?.name?.charAt(0)}
            </div>
            <Button variant="outline" size="sm">
              Đổi ảnh đại diện
            </Button>
          </div>
          <div className="flex gap-2 pt-2">
            <Button>Lưu thay đổi</Button>
            <Button variant="outline">Hủy</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Tích hợp GitHub
          </CardTitle>
          <CardDescription>Quản lý kết nối GitHub</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <Github className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  @{user?.githubUsername}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Đã kết nối
                </p>
              </div>
            </div>
            <Badge variant="success">Đang hoạt động</Badge>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Quản lý kết nối
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Thông báo
          </CardTitle>
          <CardDescription>Cấu hình cách bạn nhận cập nhật</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Hoàn tất phân tích
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nhận thông báo khi phân tích repository hoàn tất
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Đề xuất từ AI
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nhận đề xuất nghề nghiệp hằng tuần từ AI
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Cập nhật sản phẩm
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nhận thông tin về tính năng và cải tiến mới
              </p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Giao diện
          </CardTitle>
          <CardDescription>Tùy chỉnh giao diện ứng dụng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Chủ đề
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="w-full h-20 rounded bg-white border border-slate-200 mb-2" />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Sáng
                </p>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="w-full h-20 rounded bg-slate-900 border border-slate-700 mb-2" />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Tối
                </p>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <LogOut className="h-5 w-5" />
            Khu vực nguy hiểm
          </CardTitle>
          <CardDescription>Các thao tác không thể hoàn tác</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                Đăng xuất
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Đăng xuất khỏi tài khoản
              </p>
            </div>
            <Button variant="destructive" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                Xóa tài khoản
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu
              </p>
            </div>
            <Button variant="destructive">
              Xóa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
