import axios from 'axios'
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { Bot, Headphones, MessageSquare, RefreshCw, Send, UserRound } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/textarea'
import { getApiErrorMessage } from '../../services/apis/core'
import {
  adminApi,
  type AdminChatSession,
  type AdminChatSettings,
  type AdminChatUserRef,
  type AdminPagination
} from '../../services/apis/admin'
import type { ChatMessage, ChatMode, ChatSenderType } from '../../types'

const defaultPagination: AdminPagination = { page: 1, limit: 20, total: 0, totalPages: 0 }

const statusLabels: Record<string, string> = {
  active: 'Đang hoạt động',
  waiting_admin: 'Chờ admin',
  answered: 'Đã trả lời',
  closed: 'Đã đóng'
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'info',
  waiting_admin: 'warning',
  answered: 'success',
  closed: 'default'
}

const modeLabels: Record<string, string> = {
  AI_AUTO: 'AI Auto',
  MANUAL: 'Manual'
}

const getSessionMode = (session?: Pick<AdminChatSession, 'status' | 'effectiveMode' | 'mode'> | null) => {
  if (session?.status === 'closed') return undefined
  return session?.effectiveMode ?? session?.mode
}

const modeBadgeLabel = (session?: Pick<AdminChatSession, 'status' | 'effectiveMode' | 'mode'> | null) => {
  if (session?.status === 'closed') return 'Đã đóng'
  const mode = getSessionMode(session)
  return mode ? modeLabels[mode] ?? mode : 'Chưa rõ'
}

const modeBadgeVariant = (session?: Pick<AdminChatSession, 'status' | 'effectiveMode' | 'mode'> | null): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  if (session?.status === 'closed') return 'default'
  return getSessionMode(session) === 'MANUAL' ? 'warning' : 'info'
}

const modeSourceLabel = (modeSource?: string) => {
  return modeSource === 'GLOBAL' ? 'Global' : modeSource === 'SESSION' ? 'Session' : modeSource || 'Chưa rõ'
}

const senderLabels: Record<ChatSenderType, string> = {
  USER: 'User',
  AI: 'AI Mentor',
  ADMIN: 'Admin'
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

const sessionId = (session: AdminChatSession) => session._id || session.id || ''
const mergeAdminSession = (base: AdminChatSession, next: AdminChatSession): AdminChatSession => ({
  ...base,
  ...next,
  messages: next.messages ?? base.messages
})

const upsertAdminSession = (sessions: AdminChatSession[], session: AdminChatSession) => {
  const id = sessionId(session)
  return sessions.some((item) => sessionId(item) === id)
    ? sessions.map((item) => sessionId(item) === id ? mergeAdminSession(item, session) : item)
    : [session, ...sessions]
}

const asUser = (value?: AdminChatUserRef | string | null) => value && typeof value !== 'string' ? value : null
const sessionUser = (session?: AdminChatSession | null) => session?.user ?? asUser(session?.userId)
const userName = (user?: AdminChatUserRef | null) => user?.fullName || user?.name || user?.email || 'Người dùng'
const userEmail = (user?: AdminChatUserRef | null) => user?.email || 'Chưa có email'

const apiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return 'Bạn không có quyền truy cập admin chat.'
  }
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return 'Session không tồn tại hoặc đã bị xóa.'
  }
  return getApiErrorMessage(error)
}

const normalizeSenderType = (message: Partial<ChatMessage> & Record<string, unknown>): ChatSenderType => {
  if (message.senderType === 'USER' || message.senderType === 'AI' || message.senderType === 'ADMIN') return message.senderType
  const role = String(message.role ?? message.sender ?? message.type ?? '').toLowerCase()
  if (role === 'user' || role === 'human') return 'USER'
  if (role === 'admin' || role === 'support') return 'ADMIN'
  return 'AI'
}

const normalizeMessage = (payload: unknown): ChatMessage | null => {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Partial<ChatMessage> & Record<string, unknown>
  const content = String(record.content ?? record.message ?? record.text ?? '').trim()
  if (!content) return null
  const createdAt = String(record.createdAt ?? record.timestamp ?? new Date().toISOString())
  const senderType = normalizeSenderType(record)

  return {
    _id: typeof record._id === 'string' ? record._id : undefined,
    id: String(record.id ?? record._id ?? `${senderType}-${createdAt}-${content.slice(0, 16)}`),
    senderType,
    role: senderType === 'USER' ? 'user' : 'assistant',
    content,
    createdAt,
    timestamp: createdAt,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined
  }
}

const normalizeMessages = (messages?: ChatMessage[]) => {
  return (messages ?? [])
    .map(normalizeMessage)
    .filter((message): message is ChatMessage => Boolean(message))
    .sort((a, b) => new Date(a.createdAt ?? a.timestamp).getTime() - new Date(b.createdAt ?? b.timestamp).getTime())
}

const renderInlineMarkdown = (text: string, keyPrefix: string): ReactNode[] => {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    nodes.push(match[2]
      ? <strong key={`${keyPrefix}-b-${match.index}`} className="font-semibold">{match[2]}</strong>
      : <em key={`${keyPrefix}-i-${match.index}`} className="italic">{match[3]}</em>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes.length ? nodes : [text]
}

const renderMessageContent = (content: string) => {
  const blocks = content.split(/```/)
  return (
    <div className="space-y-2 break-words text-sm leading-6">
      {blocks.map((block, blockIndex) => {
        if (!block) return null
        if (blockIndex % 2 === 1) {
          return <pre key={blockIndex} className="overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100"><code>{block.trim()}</code></pre>
        }

        const lines = block.split('\n')
        const nodes: ReactNode[] = []
        let list: string[] = []
        let ordered: string[] = []
        const flush = () => {
          if (list.length) {
            const items = list
            nodes.push(<ul key={`ul-${blockIndex}-${nodes.length}`} className="my-2 list-disc space-y-1 pl-5">{items.map((item, index) => <li key={index}>{renderInlineMarkdown(item, `ul-${blockIndex}-${index}`)}</li>)}</ul>)
            list = []
          }
          if (ordered.length) {
            const items = ordered
            nodes.push(<ol key={`ol-${blockIndex}-${nodes.length}`} className="my-2 list-decimal space-y-1 pl-5">{items.map((item, index) => <li key={index}>{renderInlineMarkdown(item, `ol-${blockIndex}-${index}`)}</li>)}</ol>)
            ordered = []
          }
        }

        lines.forEach((raw, lineIndex) => {
          const line = raw.trim()
          if (!line) {
            flush()
            return
          }
          const bullet = line.match(/^[-*]\s+(.+)$/)
          const number = line.match(/^\d+\.\s+(.+)$/)
          if (bullet) {
            if (ordered.length) flush()
            list.push(bullet[1])
            return
          }
          if (number) {
            if (list.length) flush()
            ordered.push(number[1])
            return
          }
          flush()
          nodes.push(<p key={`p-${blockIndex}-${lineIndex}`} className="my-1">{renderInlineMarkdown(line, `p-${blockIndex}-${lineIndex}`)}</p>)
        })
        flush()
        return <div key={blockIndex}>{nodes}</div>
      })}
    </div>
  )
}

export const AdminChatPage = () => {
  const [settings, setSettings] = useState<AdminChatSettings | null>(null)
  const [sessions, setSessions] = useState<AdminChatSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [selectedSession, setSelectedSession] = useState<AdminChatSession | null>(null)
  const [pagination, setPagination] = useState(defaultPagination)
  const [status, setStatus] = useState('waiting_admin')
  const [mode, setMode] = useState('')
  const [modeSource, setModeSource] = useState('')
  const [page, setPage] = useState(1)
  const [reply, setReply] = useState('')
  const [manualReason, setManualReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingsLoading, setIsSettingsLoading] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedUser = sessionUser(selectedSession)
  const messages = useMemo(() => normalizeMessages(selectedSession?.messages), [selectedSession])
  const isSelectedClosed = selectedSession?.status === 'closed'

  const loadSettings = async () => {
    setIsSettingsLoading(true)
    try {
      setSettings(await adminApi.getChatSettings())
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setIsSettingsLoading(false)
    }
  }

  const loadSessions = async () => {
    setIsLoading(true)
    setError('')
    try {
      const payload = await adminApi.getChatSessions({
        page,
        limit: defaultPagination.limit,
        status: status || undefined,
        mode: mode || undefined,
        modeSource: modeSource || undefined
      })
      const items = payload.items ?? []
      setSessions(items)
      setPagination(payload.pagination ?? defaultPagination)
      if (!selectedSession && items[0]) await loadDetail(sessionId(items[0]))
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const loadDetail = async (id: string) => {
    if (!id) return
    setSelectedSessionId(id)
    setSelectedSession(null)
    setIsDetailLoading(true)
    setError('')
    try {
      const detail = await adminApi.getChatSessionDetail(id)
      setSelectedSession(detail)
      if (import.meta.env.DEV) {
        console.debug('Admin chat detail normalized', {
          selectedSessionId: id,
          messagesLength: detail.messages?.length ?? 0
        })
      }
    } catch (err) {
      setSelectedSession(null)
      setError(apiErrorMessage(err))
    } finally {
      setIsDetailLoading(false)
    }
  }

  const refreshAll = async () => {
    await Promise.all([loadSettings(), loadSessions()])
    if (selectedSession) await loadDetail(sessionId(selectedSession))
  }

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    loadSessions()
  }, [page, status, mode, modeSource])

  const updateGlobalMode = async (nextMode: ChatMode) => {
    setIsSettingsLoading(true)
    setError('')
    setSuccess('')
    try {
      setSettings(await adminApi.updateChatSettings(nextMode))
      setSuccess('Đã cập nhật chế độ chat global.')
      await loadSessions()
      if (selectedSession) await loadDetail(sessionId(selectedSession))
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setIsSettingsLoading(false)
    }
  }

  const updateSessionMode = async (nextMode: ChatMode) => {
    if (!selectedSession || isSelectedClosed) return
    setIsActionLoading(true)
    setError('')
    setSuccess('')
    try {
      const payload = nextMode === 'MANUAL'
        ? { mode: nextMode, reason: manualReason.trim() || undefined }
        : { mode: nextMode }
      const updated = await adminApi.updateChatSessionMode(sessionId(selectedSession), payload)
      setSelectedSession((current) => current ? { ...current, ...updated } : updated)
      setSessions((current) => upsertAdminSession(current, updated))
      setManualReason('')
      setSuccess(nextMode === 'MANUAL' ? 'Đã chuyển session sang Manual.' : 'Đã chuyển session sang AI Auto.')
      await loadSessions()
      await loadDetail(sessionId(updated))
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setIsActionLoading(false)
    }
  }

  const useGlobalMode = async () => {
    if (!selectedSession || isSelectedClosed) return
    setIsActionLoading(true)
    setError('')
    setSuccess('')
    try {
      const updated = await adminApi.useGlobalChatMode(sessionId(selectedSession))
      setSelectedSession((current) => current ? { ...current, ...updated } : updated)
      setSessions((current) => upsertAdminSession(current, updated))
      setSuccess('Session đã dùng lại global mode.')
      await loadSessions()
      await loadDetail(sessionId(updated))
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setIsActionLoading(false)
    }
  }

  const closeSession = async () => {
    if (!selectedSession) return
    setIsActionLoading(true)
    setError('')
    setSuccess('')
    try {
      const updated = await adminApi.closeChatSession(sessionId(selectedSession), manualReason.trim() || undefined)
      setSelectedSession((current) => current ? { ...current, ...updated, status: 'closed' } : { ...updated, status: 'closed' })
      setSessions((current) => upsertAdminSession(current, { ...updated, status: 'closed' }))
      setManualReason('')
      setSuccess('Session đã đóng.')
      await loadSessions()
      await loadDetail(sessionId(updated))
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setIsActionLoading(false)
    }
  }

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedSession || !reply.trim() || isSelectedClosed) return
    setIsActionLoading(true)
    setError('')
    setSuccess('')
    try {
      const payload = await adminApi.sendAdminChatMessage(sessionId(selectedSession), reply.trim())
      const adminMessage = normalizeMessage(payload.adminMessage)
      const nextSession = payload.session
        ? { ...selectedSession, ...payload.session }
        : selectedSession
      if (adminMessage) {
        const mergedSession = {
          ...nextSession,
          messages: [...(nextSession.messages ?? []), adminMessage]
        }
        setSelectedSession(mergedSession)
        setSessions((current) => upsertAdminSession(current, mergedSession))
      } else {
        await loadDetail(sessionId(selectedSession))
      }
      setReply('')
      setSuccess('Đã gửi phản hồi admin.')
      await loadSessions()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Quản lý chat hỗ trợ</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Theo dõi session chat, chuyển chế độ AI/Admin và phản hồi thủ công cho user.</p>
        </div>
        <Button variant="outline" onClick={refreshAll} isLoading={isLoading || isSettingsLoading || isDetailLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
      {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{success}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Cài đặt chế độ chat</CardTitle>
          <CardDescription>Global mode chỉ áp dụng trực tiếp cho session đang dùng modeSource=GLOBAL.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={settings?.mode === 'MANUAL' ? 'warning' : 'info'}>{modeLabels[settings?.mode ?? ''] ?? 'Chưa rõ'}</Badge>
              {settings?.aiEnabled !== undefined && <Badge variant={settings.aiEnabled ? 'success' : 'default'}>AI {settings.aiEnabled ? 'bật' : 'tắt'}</Badge>}
              {settings?.manualEnabled !== undefined && <Badge variant={settings.manualEnabled ? 'success' : 'default'}>Manual {settings.manualEnabled ? 'bật' : 'tắt'}</Badge>}
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {settings?.mode === 'MANUAL'
                ? 'Tin nhắn mới ở session dùng global mode sẽ chờ admin trả lời, không gọi AI.'
                : 'User gửi tin nhắn sẽ được AI trả lời tự động nếu session dùng global mode.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Cập nhật: {formatDate(settings?.updatedAt)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant={settings?.mode === 'AI_AUTO' ? 'default' : 'outline'} disabled={settings?.mode === 'AI_AUTO'} isLoading={isSettingsLoading} onClick={() => updateGlobalMode('AI_AUTO')}>AI tự động</Button>
            <Button variant={settings?.mode === 'MANUAL' ? 'default' : 'outline'} disabled={settings?.mode === 'MANUAL'} isLoading={isSettingsLoading} onClick={() => updateGlobalMode('MANUAL')}>Admin thủ công</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid min-h-[680px] gap-6 xl:grid-cols-[390px_1fr]">
        <Card className="min-h-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Inbox chat</CardTitle>
            <CardDescription>Lọc session theo trạng thái, mode và nguồn mode.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                ['waiting_admin', 'Chờ admin'],
                ['active', 'AI Auto'],
                ['answered', 'Đã trả lời'],
                ['', 'Tất cả']
              ].map(([value, label]) => (
                <Button key={label} variant={status === value ? 'default' : 'outline'} size="sm" onClick={() => { setStatus(value); setPage(1) }}>{label}</Button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <select value={mode} onChange={(event) => { setMode(event.target.value); setPage(1) }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <option value="">Tất cả mode</option>
                <option value="AI_AUTO">AI Auto</option>
                <option value="MANUAL">Manual</option>
              </select>
              <select value={modeSource} onChange={(event) => { setModeSource(event.target.value); setPage(1) }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <option value="">Tất cả nguồn</option>
                <option value="GLOBAL">Global</option>
                <option value="SESSION">Session</option>
              </select>
            </div>

            <div className="max-h-[470px] space-y-2 overflow-y-auto pr-1">
              {isLoading ? (
                <p className="py-10 text-center text-sm text-slate-500">Đang tải session...</p>
              ) : sessions.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">Chưa có session phù hợp.</p>
              ) : sessions.map((session) => {
                const id = sessionId(session)
                const user = sessionUser(session)
                const selected = selectedSessionId === id
                return (
                  <button key={id} onClick={() => loadDetail(id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selected ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40' : session.unreadByAdmin ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{userName(user)}</p>
                        <p className="truncate text-xs text-slate-500">{userEmail(user)}</p>
                      </div>
                      {session.unreadByAdmin && <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{session.lastMessage?.content || 'Chưa có tin nhắn'}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge variant={statusVariants[session.status ?? ''] ?? 'default'}>{statusLabels[session.status ?? ''] ?? session.status ?? 'Chưa rõ'}</Badge>
                      <Badge variant={modeBadgeVariant(session)}>{modeBadgeLabel(session)}</Badge>
                      <Badge variant="default">{modeSourceLabel(session.modeSource)}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{formatDate(session.lastMessageAt || session.updatedAt || session.createdAt)}</p>
                  </button>
                )
              })}
            </div>

            {pagination.total > 0 && (
              <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
                <span>Trang {pagination.page}/{Math.max(pagination.totalPages, 1)}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trước</Button>
                  <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-0">
          <CardHeader>
            <CardTitle>Chi tiết session</CardTitle>
            <CardDescription>Mở session từ inbox để xem message, đổi mode hoặc gửi phản hồi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDetailLoading ? (
              <div className="flex min-h-[480px] items-center justify-center rounded-lg border border-dashed border-slate-300 text-center text-sm text-slate-500 dark:border-slate-800">Đang tải tin nhắn...</div>
            ) : !selectedSession ? (
              <div className="flex min-h-[480px] items-center justify-center rounded-lg border border-dashed border-slate-300 text-center text-sm text-slate-500 dark:border-slate-800">Chọn một session để xem chi tiết.</div>
            ) : (
              <>
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{userName(selectedUser)}</p>
                      <p className="text-sm text-slate-500">{userEmail(selectedUser)}</p>
                      {selectedSession.manualReason && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Lý do manual: {selectedSession.manualReason}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={statusVariants[selectedSession.status ?? ''] ?? 'default'}>{statusLabels[selectedSession.status ?? ''] ?? selectedSession.status ?? 'Chưa rõ'}</Badge>
                      <Badge variant={modeBadgeVariant(selectedSession)}>{modeBadgeLabel(selectedSession)}</Badge>
                      <Badge variant="default">{modeSourceLabel(selectedSession.modeSource)}</Badge>
                    </div>
                  </div>
                  {isSelectedClosed && (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                      Session đã đóng, admin không thể trả lời hoặc đổi mode.
                    </div>
                  )}
                  {!isSelectedClosed && (
                    <div className="mt-4 flex justify-end">
                      <Button variant="destructive" disabled={isActionLoading} onClick={closeSession}>Đóng session</Button>
                    </div>
                  )}
                  <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto_auto_auto_auto]">
                    <Input value={manualReason} onChange={(event) => setManualReason(event.target.value)} placeholder="Lý do manual / đóng session (optional)" disabled={isActionLoading || isSelectedClosed} />
                    <Button variant="outline" disabled={isActionLoading || isSelectedClosed || (getSessionMode(selectedSession) === 'MANUAL' && selectedSession.modeSource === 'SESSION')} onClick={() => updateSessionMode('MANUAL')}>Chuyển Manual</Button>
                    <Button variant="outline" disabled={isActionLoading || isSelectedClosed || (getSessionMode(selectedSession) === 'AI_AUTO' && selectedSession.modeSource === 'SESSION')} onClick={() => updateSessionMode('AI_AUTO')}>Chuyển AI Auto</Button>
                    <Button variant="outline" disabled={isActionLoading || isSelectedClosed || selectedSession.modeSource === 'GLOBAL'} onClick={useGlobalMode}>Dùng Global</Button>
                  </div>
                </div>

                <div className="max-h-[390px] space-y-3 overflow-y-auto rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  {isDetailLoading ? (
                    <p className="py-10 text-center text-sm text-slate-500">Đang tải chi tiết...</p>
                  ) : messages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">Session chưa có tin nhắn.</p>
                  ) : messages.map((message) => {
                    const isAdmin = message.senderType === 'ADMIN'
                    const Icon = message.senderType === 'AI' ? Bot : message.senderType === 'ADMIN' ? Headphones : UserRound
                    return (
                      <div key={message.id} className={`flex gap-3 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        {!isAdmin && <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Icon className="h-4 w-4" /></div>}
                        <div className={`max-w-[min(78%,46rem)] rounded-lg px-4 py-3 ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-100'}`}>
                          <p className={`mb-1 text-xs font-semibold ${isAdmin ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{senderLabels[message.senderType]}</p>
                          {renderMessageContent(message.content)}
                          <p className={`mt-2 text-xs ${isAdmin ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{formatDate(message.createdAt || message.timestamp)}</p>
                        </div>
                        {isAdmin && <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white"><Icon className="h-4 w-4" /></div>}
                      </div>
                    )
                  })}
                </div>

                <form onSubmit={sendReply} className="space-y-3">
                  <Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder={isSelectedClosed ? 'Session đã đóng' : 'Nhập phản hồi admin...'} className="min-h-24 bg-white dark:bg-slate-950" disabled={isActionLoading || isSelectedClosed} />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={!reply.trim() || isActionLoading || isSelectedClosed} isLoading={isActionLoading}>
                      <Send className="mr-2 h-4 w-4" />
                      Gửi
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
