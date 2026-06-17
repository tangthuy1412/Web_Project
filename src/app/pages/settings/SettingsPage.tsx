import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircle, Github, LockKeyhole, LogOut, Palette, RefreshCw, Save, User } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { useTheme } from '../../hooks/useTheme'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import { useAuthStore } from '../../stores/authStore'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, profile, fetchProfile, saveProfile, changePassword, logout, isLoading, error } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    university: '',
    major: '',
    year: 1,
    targetCareer: '',
    currentSkills: '',
    githubUsername: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [success, setSuccess] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false)

  const fillProfileForm = () => {
    setProfileForm({
      fullName: profile?.fullName || user?.name || '',
      university: profile?.university || '',
      major: profile?.major || '',
      year: profile?.year || 1,
      targetCareer: profile?.targetCareer || '',
      currentSkills: profile?.currentSkills?.join(', ') || '',
      githubUsername: profile?.githubUsername || user?.githubUsername || ''
    })
  }

  useEffect(() => {
    setIsRefreshingProfile(true)
    fetchProfile().finally(() => setIsRefreshingProfile(false))
  }, [fetchProfile])

  useEffect(() => {
    fillProfileForm()
  }, [profile, user])

  const updateProfileField = (field: keyof typeof profileForm, value: string | number) => {
    setProfileForm((current) => ({ ...current, [field]: value }))
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccess('')
    setPasswordError('')
    setPasswordMessage('')

    try {
      await saveProfile({
        fullName: profileForm.fullName,
        university: profileForm.university,
        major: profileForm.major,
        year: Number(profileForm.year),
        targetCareer: profileForm.targetCareer,
        currentSkills: profileForm.currentSkills.split(',').map((skill) => skill.trim()).filter(Boolean),
        githubUsername: profileForm.githubUsername || undefined
      })
      setSuccess('Đã lưu hồ sơ của bạn.')
    } catch {
      return
    }
  }

  const handleRefreshProfile = async () => {
    setSuccess('')
    setIsRefreshingProfile(true)
    try {
      await fetchProfile()
      setSuccess('Đã tải lại thông tin tài khoản.')
    } finally {
      setIsRefreshingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')
    setSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.')
      return
    }

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword, passwordForm.confirmPassword)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage('Đã đổi mật khẩu thành công.')
    } catch (err) {
      setPasswordError(getApiErrorMessage(err) || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin.')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Cài đặt
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Quản lý hồ sơ, kết nối GitHub và bảo mật tài khoản.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Thông tin tài khoản</CardTitle>
          <CardDescription>Thông tin đăng nhập hiện tại của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input label="Email" value={user?.email || ''} disabled />
          <Input label="Tên hiển thị" value={user?.name || ''} disabled />
          <div className="flex flex-wrap items-center gap-2 md:col-span-2">
            <Badge variant={user?.githubConnected ? 'success' : 'default'}>
              {user?.githubConnected ? 'GitHub đã kết nối' : 'GitHub chưa kết nối'}
            </Badge>
            {user?.githubUsername && <Badge variant="info">@{user.githubUsername}</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Hồ sơ cá nhân</CardTitle>
              <CardDescription>Cập nhật thông tin để AI gợi ý phân tích và roadmap phù hợp hơn.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleRefreshProfile} isLoading={isRefreshingProfile}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tải lại
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
            <Input label="Họ và tên" value={profileForm.fullName} onChange={(event) => updateProfileField('fullName', event.target.value)} required />
            <Input label="Trường đại học" value={profileForm.university} onChange={(event) => updateProfileField('university', event.target.value)} required />
            <Input label="Ngành học" value={profileForm.major} onChange={(event) => updateProfileField('major', event.target.value)} required />
            <Input label="Năm học" type="number" min={1} value={profileForm.year} onChange={(event) => updateProfileField('year', Number(event.target.value))} required />
            <Input label="Định hướng nghề nghiệp" value={profileForm.targetCareer} onChange={(event) => updateProfileField('targetCareer', event.target.value)} required />
            <Input label="GitHub username" value={profileForm.githubUsername} onChange={(event) => updateProfileField('githubUsername', event.target.value)} />
            <div className="md:col-span-2">
              <Input label="Kỹ năng hiện có" value={profileForm.currentSkills} onChange={(event) => updateProfileField('currentSkills', event.target.value)} placeholder="JavaScript, React, Node.js" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" isLoading={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                Lưu hồ sơ
              </Button>
              <Button type="button" variant="outline" className="ml-2" onClick={fillProfileForm}>
                Hoàn tác
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Github className="h-5 w-5" />GitHub</CardTitle>
          <CardDescription>Quản lý kết nối GitHub dùng để phân tích repository.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                @{user?.githubUsername || profileForm.githubUsername || 'chưa kết nối'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {user?.githubConnected ? 'Tài khoản GitHub đã sẵn sàng để đồng bộ repository.' : 'Bạn chưa kết nối GitHub.'}
              </p>
            </div>
            <Badge variant={user?.githubConnected ? 'success' : 'default'}>
              {user?.githubConnected ? 'Đang hoạt động' : 'Chưa kết nối'}
            </Badge>
          </div>
          <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/github/connect')}>
            Quản lý GitHub
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5" />Đổi mật khẩu</CardTitle>
          <CardDescription>Chọn mật khẩu mới để bảo vệ tài khoản của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          {passwordMessage && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
              {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {passwordError}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="grid gap-4 md:grid-cols-3">
            <Input label="Mật khẩu hiện tại" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} required />
            <Input label="Mật khẩu mới" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} required />
            <Input label="Xác nhận mật khẩu" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} required />
            <div className="md:col-span-3">
              <Button type="submit" variant="outline" isLoading={isLoading}>Đổi mật khẩu</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Giao diện</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Sáng</Button>
          <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Tối</Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">Đăng xuất</p>
            <p className="text-sm text-red-700 dark:text-red-300">Rời khỏi tài khoản trên thiết bị này.</p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
