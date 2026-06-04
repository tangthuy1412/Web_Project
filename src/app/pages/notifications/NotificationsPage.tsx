import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Bell, Check, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import { notificationApi, type NotificationPayload } from '../../services/apis/notificationApi'
import type { NotificationItem } from '../../types'

const normalizeNotification = (payload: unknown): NotificationItem => {
  const item = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}

  return {
    id: String(item.id ?? item._id ?? ''),
    title: String(item.title ?? ''),
    message: String(item.message ?? ''),
    type: String(item.type ?? 'SYSTEM'),
    read: Boolean(item.read ?? item.isRead),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined
  }
}

const toArray = (payload: unknown) => {
  if (Array.isArray(payload)) return payload
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  return Array.isArray(record.items) ? record.items : Array.isArray(record.notifications) ? record.notifications : []
}

export const NotificationsPage = () => {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [type, setType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<NotificationPayload>({
    title: '',
    message: '',
    type: 'SYSTEM'
  })

  const fetchNotifications = async () => {
    setIsLoading(true)
    setError('')
    try {
      const payload = await notificationApi.getMine({ page: 1, limit: 20, unreadOnly, type: type || undefined })
      setItems(toArray(payload).map(normalizeNotification))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [unreadOnly, type])

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items])

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await notificationApi.create(form)
    setForm({ title: '', message: '', type: 'SYSTEM' })
    await fetchNotifications()
  }

  const handleRead = async (id: string) => {
    await notificationApi.markAsRead(id)
    await fetchNotifications()
  }

  const handleDelete = async (id: string) => {
    await notificationApi.remove(id)
    await fetchNotifications()
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Thông báo</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Quản lý thông báo của người dùng hiện tại.</p>
        </div>
        <Badge variant={unreadCount ? 'warning' : 'default'}>{unreadCount} chưa đọc</Badge>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Tạo thông báo</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-[1fr_1fr_220px_auto]">
            <Input label="Tiêu đề" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
            <Input label="Nội dung" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} required />
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Loại
              <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as NotificationPayload['type'] }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <option value="SYSTEM">SYSTEM</option>
                <option value="GITHUB_ANALYSIS_REMINDER">GITHUB_ANALYSIS_REMINDER</option>
                <option value="ROADMAP_TASK_REMINDER">ROADMAP_TASK_REMINDER</option>
                <option value="REPOSITORY_IMPROVEMENT">REPOSITORY_IMPROVEMENT</option>
              </select>
            </label>
            <div className="flex items-end"><Button type="submit">Tạo</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />
              Chỉ hiện chưa đọc
            </label>
            <select value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="">Tất cả loại</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="GITHUB_ANALYSIS_REMINDER">GITHUB_ANALYSIS_REMINDER</option>
              <option value="ROADMAP_TASK_REMINDER">ROADMAP_TASK_REMINDER</option>
              <option value="REPOSITORY_IMPROVEMENT">REPOSITORY_IMPROVEMENT</option>
            </select>
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Đang tải thông báo...</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Không có thông báo.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex gap-3">
                    <Bell className="mt-1 h-5 w-5 text-indigo-600" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                        <Badge variant={item.read ? 'default' : 'info'}>{item.type}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.message}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!item.read && <Button variant="ghost" size="sm" onClick={() => handleRead(item.id)}><Check className="h-4 w-4" /></Button>}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
