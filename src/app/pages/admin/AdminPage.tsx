import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, RefreshCw, Shield, UserCog, Users } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import {
  adminApi,
  type AdminDashboard,
  type AdminPagination,
  type AdminUser,
  type AdminUserRole,
  type AdminUserStatus
} from '../../services/apis/adminApi'

const defaultPagination: AdminPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
}

const statusLabels: Record<string, string> = {
  active: 'Đang hoạt động',
  banned: 'Đã khóa',
  inactive: 'Tạm ngưng'
}

const roleLabels: Record<string, string> = {
  admin: 'Quản trị viên',
  student: 'Người dùng'
}

const providerLabels: Record<string, string> = {
  local: 'Email',
  google: 'Google',
  github: 'GitHub'
}

const formatDate = (value?: string) => {
  if (!value) return 'Chưa có'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

const userId = (user: AdminUser) => user._id || user.id || ''
const userName = (user: AdminUser) => user.fullName || user.name || user.email || 'Người dùng'
const userAvatar = (user: AdminUser) => user.avatar || user.avatarUrl

export const AdminPage = () => {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [pagination, setPagination] = useState(defaultPagination)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState('')
  const [error, setError] = useState('')

  const dashboardCards = useMemo(() => [
    {
      label: 'Người dùng',
      value: dashboard?.users?.total ?? 0,
      helper: `${dashboard?.users?.active ?? 0} đang hoạt động`,
      icon: Users
    },
    {
      label: 'Repository',
      value: dashboard?.github?.repositories ?? 0,
      helper: 'Đã đồng bộ từ GitHub',
      icon: BarChart3
    },
    {
      label: 'Phân tích',
      value: dashboard?.analysis?.total ?? 0,
      helper: `${dashboard?.aiFeedback?.total ?? 0} phản hồi AI`,
      icon: Shield
    },
    {
      label: 'Roadmap',
      value: dashboard?.roadmaps?.active ?? 0,
      helper: `${dashboard?.reports?.pending ?? 0} báo cáo chờ xử lý`,
      icon: UserCog
    }
  ], [dashboard])

  const chartData = useMemo(() => [
    { name: 'Repository', value: dashboard?.github?.repositories ?? 0 },
    { name: 'Phân tích', value: dashboard?.analysis?.total ?? 0 },
    { name: 'Phản hồi AI', value: dashboard?.aiFeedback?.total ?? 0 },
    { name: 'Roadmap', value: dashboard?.roadmaps?.active ?? 0 }
  ], [dashboard])

  const userStatusData = useMemo(() => [
    { name: 'Hoạt động', value: dashboard?.users?.active ?? 0, color: '#10b981' },
    { name: 'Đã khóa', value: dashboard?.users?.banned ?? 0, color: '#ef4444' },
    {
      name: 'Khác',
      value: Math.max(0, (dashboard?.users?.total ?? 0) - (dashboard?.users?.active ?? 0) - (dashboard?.users?.banned ?? 0)),
      color: '#64748b'
    }
  ], [dashboard])

  const fetchAdminData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [dashboardPayload, usersPayload] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getUsers({
          page,
          limit: 20,
          search: search || undefined,
          role: role || undefined,
          status: status || undefined
        })
      ])
      setDashboard(dashboardPayload)
      setUsers(usersPayload.items ?? [])
      setPagination(usersPayload.pagination ?? defaultPagination)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [page, role, status])

  const handleSearch = () => {
    setPage(1)
    fetchAdminData()
  }

  const handleViewUser = async (user: AdminUser) => {
    const id = userId(user)
    setSelectedUser(user)

    if (!id) return

    try {
      const detail = await adminApi.getUser(id)
      setSelectedUser({ ...user, ...detail })
    } catch {
      setSelectedUser(user)
    }
  }

  const handleRoleChange = async (user: AdminUser, nextRole: AdminUserRole) => {
    const id = userId(user)
    if (!id) return

    setUpdatingUserId(id)
    try {
      const updated = await adminApi.updateUserRole(id, nextRole)
      setUsers((current) => current.map((item) => userId(item) === id ? { ...item, role: nextRole, ...updated } : item))
      setSelectedUser((current) => current && userId(current) === id ? { ...current, role: nextRole, ...updated } : current)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setUpdatingUserId('')
    }
  }

  const handleToggleStatus = async (user: AdminUser) => {
    const id = userId(user)
    if (!id) return

    const nextStatus: AdminUserStatus = user.status === 'active' ? 'banned' : 'active'
    setUpdatingUserId(id)

    try {
      const updated = await adminApi.updateUserStatus(id, nextStatus)
      setUsers((current) => current.map((item) => userId(item) === id ? { ...item, status: nextStatus, ...updated } : item))
      setSelectedUser((current) => current && userId(current) === id ? { ...current, status: nextStatus, ...updated } : current)
      setDashboard((current) => current ? {
        ...current,
        users: {
          ...current.users,
          total: current.users?.total ?? 0,
          active: nextStatus === 'active'
            ? (current.users?.active ?? 0) + 1
            : Math.max(0, (current.users?.active ?? 0) - 1),
          banned: nextStatus === 'banned'
            ? (current.users?.banned ?? 0) + 1
            : Math.max(0, (current.users?.banned ?? 0) - 1)
        }
      } : current)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setUpdatingUserId('')
    }
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Quản trị hệ thống</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Theo dõi tổng quan và quản lý tài khoản người dùng.
          </p>
        </div>
        <Button variant="outline" onClick={fetchAdminData} isLoading={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.helper}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động nền tảng</CardTitle>
            <CardDescription>So sánh nhanh các dữ liệu chính đang có trong hệ thống.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái người dùng</CardTitle>
            <CardDescription>Tỷ lệ tài khoản đang hoạt động và bị khóa.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={userStatusData} dataKey="value" nameKey="name" outerRadius={92} label>
                  {userStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Người dùng</CardTitle>
          <CardDescription>Quản lý role và trạng thái tài khoản. Admin có thể khóa hoặc mở lại tài khoản nhanh bằng nút chuyển trạng thái.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto]">
            <Input
              placeholder="Tìm theo tên, email hoặc GitHub..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch()
              }}
            />
            <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1) }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="">Tất cả role</option>
              <option value="student">Người dùng</option>
              <option value="admin">Quản trị viên</option>
            </select>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="banned">Đã khóa</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
            <Button onClick={handleSearch}>Tìm kiếm</Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Người dùng</th>
                    <th className="px-4 py-3">Đăng nhập</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Đang tải người dùng...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Chưa có người dùng phù hợp.</td>
                    </tr>
                  ) : users.map((user) => {
                    const id = userId(user)
                    const isUpdating = updatingUserId === id

                    return (
                      <tr key={id} className="bg-white dark:bg-slate-950/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {userAvatar(user) ? (
                              <img src={userAvatar(user)} alt={userName(user)} className="h-9 w-9 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                {userName(user).slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-950 dark:text-slate-50">{userName(user)}</p>
                              <p className="text-xs text-slate-500">{user.email || user.githubUsername || 'Chưa có email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="default">{providerLabels[user.provider ?? ''] ?? user.provider ?? 'Khác'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role ?? 'student'}
                            disabled={isUpdating}
                            onChange={(event) => handleRoleChange(user, event.target.value as AdminUserRole)}
                            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                          >
                            <option value="student">Người dùng</option>
                            <option value="admin">Quản trị viên</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.status === 'active' ? 'success' : user.status === 'banned' ? 'danger' : 'warning'}>
                            {statusLabels[user.status ?? ''] ?? user.status ?? 'Chưa rõ'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>Chi tiết</Button>
                            <Button variant={user.status === 'active' ? 'destructive' : 'outline'} size="sm" isLoading={isUpdating} onClick={() => handleToggleStatus(user)}>
                              {user.status === 'active' ? 'Khóa' : 'Mở lại'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.total > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Trang {pagination.page} / {Math.max(pagination.totalPages, 1)} - tổng {pagination.total} người dùng
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trước</Button>
                <Button variant="outline" size="sm" disabled={pagination.totalPages === 0 || page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết người dùng</CardTitle>
            <CardDescription>Thông tin tài khoản được lấy từ hệ thống.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Tên</p>
              <p className="font-medium text-slate-950 dark:text-slate-50">{userName(selectedUser)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium text-slate-950 dark:text-slate-50">{selectedUser.email || 'Chưa có email'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">GitHub</p>
              <p className="font-medium text-slate-950 dark:text-slate-50">{selectedUser.githubUsername ? `@${selectedUser.githubUsername}` : 'Chưa kết nối'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Provider</p>
              <p className="font-medium text-slate-950 dark:text-slate-50">{providerLabels[selectedUser.provider ?? ''] ?? selectedUser.provider ?? 'Khác'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Role</p>
              <p className="font-medium text-slate-950 dark:text-slate-50">{roleLabels[selectedUser.role ?? ''] ?? selectedUser.role ?? 'Chưa rõ'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Trạng thái</p>
              <p className="font-medium text-slate-950 dark:text-slate-50">{statusLabels[selectedUser.status ?? ''] ?? selectedUser.status ?? 'Chưa rõ'}</p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
