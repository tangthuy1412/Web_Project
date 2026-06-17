import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Eye, RefreshCw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import {
  adminApi,
  type AdminAdminEntityRef,
  type AdminAiFeedback,
  type AdminPagination
} from '../../services/apis/adminApi'

const defaultPagination: AdminPagination = { page: 1, limit: 20, total: 0, totalPages: 0 }

const formatDate = (value?: string) => {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

const feedbackId = (item: AdminAiFeedback) => item._id || item.id || ''
const asRef = (value?: AdminAdminEntityRef | string) => value && typeof value !== 'string' ? value : null
const ownerName = (item: AdminAiFeedback) => asRef(item.userId)?.fullName || asRef(item.userId)?.name || asRef(item.userId)?.email || 'Người dùng'
const ownerEmail = (item: AdminAiFeedback) => asRef(item.userId)?.email || 'Chưa có email'
const repoName = (item: AdminAiFeedback) => item.fullName || asRef(item.repositoryId)?.fullName || item.repoName || 'Repository'
const containsText = (value: string | undefined | null, search: string) => value?.toLowerCase().includes(search) ?? false

export const AdminAiFeedbackPage = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState<AdminAiFeedback[]>([])
  const [pagination, setPagination] = useState(defaultPagination)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return items
    return items.filter((item) => (
      containsText(repoName(item), keyword) ||
      containsText(item.projectType, keyword) ||
      containsText(item.careerDirection, keyword) ||
      containsText(ownerName(item), keyword) ||
      containsText(ownerEmail(item), keyword)
    ))
  }, [items, search])

  const fetchFeedback = async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await adminApi.getAiFeedbacks({ page, limit: 20 })
      setItems(payload.items ?? [])
      setPagination(payload.pagination ?? defaultPagination)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [page])

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Quản lý phản hồi AI</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Xem các phản hồi AI đã tạo cho repository của người dùng.
          </p>
        </div>
        <Button variant="outline" onClick={fetchFeedback} isLoading={isLoading}>
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
          <CardTitle>Danh sách phản hồi AI</CardTitle>
          <CardDescription>Thông tin này dùng để admin theo dõi chất lượng phản hồi và repo liên quan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Tìm theo repository, người dùng, hướng nghề nghiệp..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Repository</th>
                    <th className="px-4 py-3">Người dùng</th>
                    <th className="px-4 py-3">Định hướng</th>
                    <th className="px-4 py-3">Nội dung chính</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Đang tải phản hồi AI...</td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Chưa có phản hồi phù hợp.</td>
                    </tr>
                  ) : filteredItems.map((item) => {
                    const id = feedbackId(item)

                    return (
                      <tr key={id} className="bg-white align-top dark:bg-slate-950/40">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-950 dark:text-slate-50">{repoName(item)}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.repoName || asRef(item.repositoryId)?.name || 'Chưa có tên ngắn'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{ownerName(item)}</p>
                          <p className="text-xs text-slate-500">{ownerEmail(item)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="info">{item.careerDirection || 'Chưa xác định'}</Badge>
                          <p className="mt-2 text-xs text-slate-500">{item.projectType || 'Chưa rõ loại dự án'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-md line-clamp-3 text-slate-600 dark:text-slate-300">{item.summary || 'Chưa có tóm tắt'}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Button variant="ghost" size="sm" disabled={!id} onClick={() => navigate(`/admin/ai-feedback/${id}`)}>
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
                Trang {pagination.page} / {Math.max(pagination.totalPages, 1)} - tổng {pagination.total} phản hồi
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
