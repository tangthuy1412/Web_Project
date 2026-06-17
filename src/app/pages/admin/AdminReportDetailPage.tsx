import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, CheckCircle2, Flag, RefreshCw, Send } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import {
  adminApi,
  type AdminAdminEntityRef,
  type AdminReport,
  type AdminReportStatus
} from '../../services/apis/adminApi'

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

const asRef = (value?: AdminAdminEntityRef | string | null) => value && typeof value !== 'string' ? value : null
const reporterName = (report?: AdminReport) => asRef(report?.reporterId)?.fullName || asRef(report?.reporterId)?.name || asRef(report?.reporterId)?.email || 'Người dùng'
const reporterEmail = (report?: AdminReport) => asRef(report?.reporterId)?.email || 'Chưa có email'
const resolvedByName = (report?: AdminReport) => asRef(report?.resolvedBy)?.fullName || asRef(report?.resolvedBy)?.name || asRef(report?.resolvedBy)?.email || 'Chưa có'

export const AdminReportDetailPage = () => {
  const { reportId } = useParams()
  const [report, setReport] = useState<AdminReport | null>(null)
  const [nextStatus, setNextStatus] = useState<AdminReportStatus>('resolved')
  const [adminNote, setAdminNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const fetchReport = async () => {
    if (!reportId) {
      setError('Không tìm thấy mã báo cáo.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const payload = await adminApi.getReport(reportId)
      setReport(payload)
      setNextStatus((payload.status === 'resolved' || payload.status === 'rejected') ? payload.status : 'resolved')
      setAdminNote(payload.adminNote ?? '')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [reportId])

  const handleUpdateStatus = async () => {
    if (!reportId) return

    setIsUpdating(true)
    setError('')
    setMessage('')

    try {
      const updated = await adminApi.updateReportStatus(reportId, {
        status: nextStatus,
        adminNote: adminNote.trim()
      })
      setReport((current) => current ? { ...current, status: nextStatus, adminNote: adminNote.trim(), ...updated } : updated)
      setMessage('Đã cập nhật trạng thái báo cáo.')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/admin/reports" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách báo cáo
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">Chi tiết báo cáo</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Xem nội dung báo cáo và phản hồi bằng trạng thái xử lý kèm ghi chú admin.
          </p>
        </div>
        <Button variant="outline" onClick={fetchReport} isLoading={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {message}
        </div>
      )}

      {isLoading ? (
        <Card><CardContent className="p-10 text-center text-slate-500">Đang tải chi tiết báo cáo...</CardContent></Card>
      ) : !report ? (
        <Card><CardContent className="p-10 text-center text-slate-500">Không tìm thấy báo cáo phù hợp.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5" />
                    Nội dung báo cáo
                  </CardTitle>
                  <CardDescription>{report.reason || 'Chưa có lý do báo cáo.'}</CardDescription>
                </div>
                <Badge variant={statusVariants[report.status ?? ''] ?? 'default'}>
                  {statusLabels[report.status ?? ''] ?? report.status ?? 'Chưa rõ'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500">Người báo cáo</p>
                  <p className="font-medium text-slate-950 dark:text-slate-50">{reporterName(report)}</p>
                  <p className="text-xs text-slate-500">{reporterEmail(report)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Đối tượng</p>
                  <p className="font-medium text-slate-950 dark:text-slate-50">{targetLabels[report.targetType ?? ''] ?? report.targetType ?? 'Chưa rõ'}</p>
                  <p className="break-all text-xs text-slate-500">{report.targetId || 'Chưa có mã đối tượng'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ngày gửi</p>
                  <p className="font-medium text-slate-950 dark:text-slate-50">{formatDate(report.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Người xử lý</p>
                  <p className="font-medium text-slate-950 dark:text-slate-50">{resolvedByName(report)}</p>
                  <p className="text-xs text-slate-500">{formatDate(report.resolvedAt)}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả từ người báo cáo</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {report.description || 'Không có mô tả.'}
                </p>
              </div>

              {report.adminNote && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
                  <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Ghi chú admin hiện tại</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{report.adminNote}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Phản hồi xử lý
              </CardTitle>
              <CardDescription>
                Cập nhật trạng thái để người dùng biết báo cáo đã được xem xét.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Trạng thái mới</label>
                  <select
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value as AdminReportStatus)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="resolved">Đã xử lý</option>
                    <option value="rejected">Từ chối báo cáo</option>
                    <option value="pending">Đưa về chờ xử lý</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Ghi chú phản hồi</label>
                  <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    placeholder="Ví dụ: Đã xem xét và xử lý nội dung được báo cáo."
                    className="min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleUpdateStatus} isLoading={isUpdating}>
                  <Send className="mr-2 h-4 w-4" />
                  Cập nhật phản hồi
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
