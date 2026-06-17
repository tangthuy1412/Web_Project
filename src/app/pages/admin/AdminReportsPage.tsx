import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Eye, Flag, RefreshCw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import {
  adminApi,
  type AdminAdminEntityRef,
  type AdminPagination,
  type AdminReport
} from '../../services/apis/adminApi'

const defaultPagination: AdminPagination = { page: 1, limit: 20, total: 0, totalPages: 0 }

const statusLabels: Record<string, string> = {
  pending: 'Chờ xử lý',
  resolved: 'Đã xử lý',
  rejected: 'Đã từ chối'
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  resolved: 'success',
  rejected: 'danger'
}

const targetLabels: Record<string, string> = {
  repository: 'Repository'
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

const reportId = (report: AdminReport) => report._id || report.id || ''
const asRef = (value?: AdminAdminEntityRef | string | null) => value && typeof value !== 'string' ? value : null
const reporterName = (report: AdminReport) => asRef(report.reporterId)?.fullName || asRef(report.reporterId)?.name || asRef(report.reporterId)?.email || 'Người dùng'
const reporterEmail = (report: AdminReport) => asRef(report.reporterId)?.email || 'Chưa có email'
const containsText = (value: string | undefined | null, search: string) => value?.toLowerCase().includes(search) ?? false

export const AdminReportsPage = () => {
  const navigate = useNavigate()
  const [reports, setReports] = useState<AdminReport[]>([])
  const [pagination, setPagination] = useState(defaultPagination)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return reports

    return reports.filter((report) => (
      containsText(reporterName(report), keyword) ||
      containsText(reporterEmail(report), keyword) ||
      containsText(report.reason, keyword) ||
      containsText(report.description, keyword) ||
      containsText(report.targetId, keyword)
    ))
  }, [reports, search])

  const fetchReports = async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await adminApi.getReports({
        page,
        limit: 20,
        status: status || undefined
      })
      setReports(payload.items ?? [])
      setPagination(payload.pagination ?? defaultPagination)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [page, status])

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Quản lý báo cáo</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Xem báo cáo từ người dùng và xử lý các nội dung cần quản trị viên kiểm tra.
          </p>
        </div>
        <Button variant="outline" onClick={fetchReports} isLoading={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Danh sách báo cáo
          </CardTitle>
          <CardDescription>
            Admin có thể mở từng báo cáo để phản hồi và cập nhật trạng thái xử lý.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_190px]">
            <Input
              placeholder="Tìm theo người gửi, lý do, mô tả hoặc mã đối tượng..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="resolved">Đã xử lý</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Người báo cáo</th>
                    <th className="px-4 py-3">Đối tượng</th>
                    <th className="px-4 py-3">Lý do</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày gửi</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Đang tải báo cáo...</td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Chưa có báo cáo phù hợp.</td>
                    </tr>
                  ) : filteredReports.map((report) => {
                    const id = reportId(report)

                    return (
                      <tr key={id} className="bg-white align-top dark:bg-slate-950/40">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-950 dark:text-slate-50">{reporterName(report)}</p>
                          <p className="text-xs text-slate-500">{reporterEmail(report)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="info">{targetLabels[report.targetType ?? ''] ?? report.targetType ?? 'Đối tượng'}</Badge>
                          <p className="mt-2 max-w-xs break-all text-xs text-slate-500">{report.targetId || 'Chưa có mã đối tượng'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{report.reason || 'Chưa có lý do'}</p>
                          <p className="mt-1 max-w-md line-clamp-2 text-xs text-slate-500">{report.description || 'Không có mô tả'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariants[report.status ?? ''] ?? 'default'}>
                            {statusLabels[report.status ?? ''] ?? report.status ?? 'Chưa rõ'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(report.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Button variant="ghost" size="sm" disabled={!id} onClick={() => navigate(`/admin/reports/${id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Chi tiết
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
                Trang {pagination.page} / {Math.max(pagination.totalPages, 1)} - tổng {pagination.total} báo cáo
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trước</Button>
                <Button variant="outline" size="sm" disabled={pagination.totalPages === 0 || page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
