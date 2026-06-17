import { useEffect, useMemo, useState } from 'react'
import { Bell, ChevronLeft, ChevronRight, Inbox, RefreshCw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import { notificationApi } from '../../services/apis/notificationApi'
import type { NotificationItem } from '../../types'

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

const defaultPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
}

const typeLabels: Record<string, string> = {
  GITHUB_ANALYSIS_REMINDER: 'Nhắc phân tích GitHub',
  ROADMAP_TASK_REMINDER: 'Nhắc học roadmap',
  REPOSITORY_IMPROVEMENT: 'Gợi ý cải thiện repository',
  SYSTEM: 'Hệ thống'
}

const normalizeNotification = (payload: unknown): NotificationItem => {
  const item = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}

  return {
    id: String(item.id ?? item._id ?? item.notificationId ?? crypto.randomUUID()),
    title: String(item.title ?? item.subject ?? 'Thông báo'),
    message: String(item.message ?? item.content ?? item.description ?? ''),
    type: String(item.type ?? 'SYSTEM'),
    read: Boolean(item.read ?? item.isRead),
    createdAt: typeof item.createdAt === 'string'
      ? item.createdAt
      : typeof item.created_at === 'string'
        ? item.created_at
        : undefined
  }
}

const extractItems = (payload: unknown) => {
  if (Array.isArray(payload)) return payload
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  return Array.isArray(record.items) ? record.items : Array.isArray(record.notifications) ? record.notifications : []
}

const extractPagination = (payload: unknown): Pagination => {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  const pagination = record.pagination && typeof record.pagination === 'object'
    ? record.pagination as Record<string, unknown>
    : {}

  return {
    page: Number(pagination.page ?? defaultPagination.page),
    limit: Number(pagination.limit ?? defaultPagination.limit),
    total: Number(pagination.total ?? defaultPagination.total),
    totalPages: Number(pagination.totalPages ?? defaultPagination.totalPages)
  }
}

const formatDate = (value?: string) => {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value))
  } catch {
    return value
  }
}

export const NotificationsPage = () => {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [pagination, setPagination] = useState<Pagination>(defaultPagination)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items])

  const fetchNotifications = async (nextPage = page) => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await notificationApi.getMine({ page: nextPage, limit: 20 })
      setItems(extractItems(payload).map(normalizeNotification))
      setPagination(extractPagination(payload))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(page)
  }, [page])

  const goToPage = (nextPage: number) => {
    if (nextPage < 1) return
    if (pagination.totalPages > 0 && nextPage > pagination.totalPages) return
    setPage(nextPage)
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Thông báo</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Xem các cập nhật quan trọng về tài khoản, repository và roadmap của bạn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={unreadCount ? 'warning' : 'default'}>{unreadCount} chưa đọc</Badge>
          <Button variant="outline" onClick={() => fetchNotifications(page)} isLoading={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-500">
              Đang tải thông báo...
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Inbox className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Chưa có thông báo</h2>
              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Khi có cập nhật mới về phân tích repository hoặc lộ trình học, thông báo sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((item) => (
                <article key={item.id} className="flex gap-4 p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60">
                  <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950 dark:text-slate-50">{item.title}</h2>
                      <Badge variant={item.read ? 'default' : 'info'}>
                        {typeLabels[item.type] ?? item.type}
                      </Badge>
                      {!item.read && <span className="h-2 w-2 rounded-full bg-indigo-500" aria-label="Chưa đọc" />}
                    </div>
                    {item.message && (
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>
                    )}
                    {item.createdAt && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDate(item.createdAt)}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pagination.total > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Hiển thị trang {pagination.page} / {Math.max(pagination.totalPages, 1)} - tổng {pagination.total} thông báo
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Trước
            </Button>
            <Button variant="outline" size="sm" disabled={pagination.totalPages === 0 || pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)}>
              Sau
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
