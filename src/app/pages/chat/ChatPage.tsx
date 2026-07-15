import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AlertCircle, Headphones, MoreHorizontal, Plus, Send, Sparkles, Trash2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useChatStore } from '../../stores/chatStore'
import { useAuthStore } from '../../stores/authStore'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatRelativeTime } from '../../lib/utils'
import { useChatRealtime } from '../../hooks/useChatRealtime'
import { normalizeChatMessage, normalizeChatSession } from '../../services/apis/chat'
import type { ChatMessageCreatedEvent, ChatReadUpdatedEvent, ChatSessionUpdatedEvent } from '../../types'
import { emitChatTyping } from '../../services/socket/chatSocket'

type TextBlock = {
  type: 'paragraph' | 'ul' | 'ol'
  items: string[]
}

const renderInlineMarkdown = (text: string, keyPrefix: string): ReactNode[] => {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    if (match[2]) {
      nodes.push(<strong key={`${keyPrefix}-bold-${match.index}`} className="font-semibold">{match[2]}</strong>)
    } else {
      nodes.push(<em key={`${keyPrefix}-em-${match.index}`} className="italic">{match[3]}</em>)
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes.length ? nodes : [text]
}

const addTextBlock = (blocks: TextBlock[], block: TextBlock | null) => {
  if (block?.items.length) blocks.push(block)
}

const parseTextBlocks = (text: string) => {
  const blocks: TextBlock[] = []
  let current: TextBlock | null = null

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()

    if (!line) {
      addTextBlock(blocks, current)
      current = null
      continue
    }

    const unordered = line.match(/^[-*]\s+(.+)$/)
    const ordered = line.match(/^\d+\.\s+(.+)$/)
    const type: TextBlock['type'] = unordered ? 'ul' : ordered ? 'ol' : 'paragraph'
    const content = unordered?.[1] ?? ordered?.[1] ?? line

    if (!current || current.type !== type || type === 'paragraph') {
      addTextBlock(blocks, current)
      current = { type, items: [] }
    }

    current.items.push(content)
  }

  addTextBlock(blocks, current)
  return blocks
}

const renderTextBlocks = (text: string, keyPrefix: string) => {
  return parseTextBlocks(text).map((block, blockIndex) => {
    if (block.type === 'ul') {
      return (
        <ul key={`${keyPrefix}-ul-${blockIndex}`} className="my-2 list-disc space-y-1 pl-5">
          {block.items.map((item, itemIndex) => (
            <li key={`${keyPrefix}-ul-${blockIndex}-${itemIndex}`}>{renderInlineMarkdown(item, `${keyPrefix}-ul-${blockIndex}-${itemIndex}`)}</li>
          ))}
        </ul>
      )
    }

    if (block.type === 'ol') {
      return (
        <ol key={`${keyPrefix}-ol-${blockIndex}`} className="my-2 list-decimal space-y-1 pl-5">
          {block.items.map((item, itemIndex) => (
            <li key={`${keyPrefix}-ol-${blockIndex}-${itemIndex}`}>{renderInlineMarkdown(item, `${keyPrefix}-ol-${blockIndex}-${itemIndex}`)}</li>
          ))}
        </ol>
      )
    }

    return block.items.map((item, itemIndex) => (
      <p key={`${keyPrefix}-p-${blockIndex}-${itemIndex}`} className="my-1 first:mt-0 last:mb-0">
        {renderInlineMarkdown(item, `${keyPrefix}-p-${blockIndex}-${itemIndex}`)}
      </p>
    ))
  })
}

const renderChatMessageContent = (content: string) => {
  const segments = content.split(/```/)

  return (
    <div className="space-y-2 break-words text-sm leading-6">
      {segments.map((segment, index) => {
        if (!segment) return null
        if (index % 2 === 1) {
          return (
            <pre key={`code-${index}`} className="my-2 max-w-full overflow-x-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
              <code>{segment.trim()}</code>
            </pre>
          )
        }

        return <div key={`text-${index}`}>{renderTextBlocks(segment, `text-${index}`)}</div>
      })}
    </div>
  )
}

export const ChatPage = () => {
  const { sessions, currentSession, sendMessage, createSession, deleteSession, selectSession, fetchSessions, applyRealtimeMessage, applyRealtimeSession, isLoading, isSending, isAiTyping, manualWaiting, error } = useChatStore()
  const user = useAuthStore(state => state.user)
  const {
    repositories,
    analyses,
    fetchRepositories,
    fetchMyAnalyses
  } = useRepositoryStore()
  const [input, setInput] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newSessionTitle, setNewSessionTitle] = useState('')
  const [selectedRepositoryId, setSelectedRepositoryId] = useState('')
  const [deleteSessionId, setDeleteSessionId] = useState('')
  const [createError, setCreateError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSessions()
    fetchRepositories().catch(() => undefined)
    fetchMyAnalyses().catch(() => undefined)
  }, [fetchMyAnalyses, fetchRepositories, fetchSessions])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [currentSession?.messages, isAiTyping])

  const handleRealtimeMessage = useCallback((event: ChatMessageCreatedEvent) => {
    applyRealtimeMessage(event.sessionId, normalizeChatMessage(event.message))
  }, [applyRealtimeMessage])

  const handleRealtimeSession = useCallback((event: ChatSessionUpdatedEvent) => {
    applyRealtimeSession(event.sessionId, normalizeChatSession(event.session))
  }, [applyRealtimeSession])

  const handleRealtimeRead = useCallback((event: ChatReadUpdatedEvent) => {
    applyRealtimeSession(event.sessionId, normalizeChatSession(event.session))
  }, [applyRealtimeSession])

  useChatRealtime({
    sessionId: currentSession?.id,
    sessionIds: [currentSession?.id, currentSession?._id],
    onMessageCreated: handleRealtimeMessage,
    onSessionUpdated: handleRealtimeSession,
    onReadUpdated: handleRealtimeRead,
    markRead: Boolean(currentSession?.id)
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim() || currentSession?.status === 'closed') return

    const message = input
    setInput('')
    await sendMessage(message)
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    if (currentSession?.id) emitChatTyping(currentSession.id, Boolean(value.trim()))
  }

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = newSessionTitle.trim()

    if (!title) {
      setCreateError('Vui lòng nhập tiêu đề cuộc trò chuyện.')
      return
    }

    try {
      setCreateError('')
      await createSession({
        title,
        repositoryId: selectedRepositoryId || undefined
      })
      setNewSessionTitle('')
      setSelectedRepositoryId('')
      setIsCreateOpen(false)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Không thể tạo cuộc trò chuyện.')
    }
  }

  const fallbackSuggestedPrompts = [
    'Dựa trên GitHub của tôi, tôi nên học gì tiếp theo?',
    'Repository nào của tôi nên đưa vào portfolio?',
    'Tôi phù hợp Backend hay Fullstack hơn?',
    'Hãy gợi ý kế hoạch cải thiện commit và documentation.'
  ]

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return
    await deleteSession(deleteSessionId)
    setDeleteSessionId('')
  }

  const analyzedRepositoryOptions = analyses
    .map((analysis) => {
      const repository = repositories.find((repo) => repo.id === analysis.repositoryId)
      const repoName = repository?.name || repository?.fullName || analysis.repositoryName || analysis.fullName || analysis.repositoryId
      const role = analysis.summary?.careerDirection || analysis.careerDirection?.primary || 'Role chưa rõ'
      const score = analysis.summary?.userReadinessScore ?? analysis.summary?.overallScore ?? analysis.scores?.overallScore ?? analysis.scores?.overall

      return {
        id: analysis.repositoryId,
        label: `${repoName} - ${role}${typeof score === 'number' ? ` - ${Math.round(score)}%` : ''}`
      }
    })
    .filter((item, index, list) => item.id && list.findIndex((other) => other.id === item.id) === index)

  const activeContext = currentSession?.context
  const hasRoadmapContext = Boolean(activeContext?.roadmapId || currentSession?.roadmapId || activeContext?.hasRoadmapContext)
  const hasRepoContext = Boolean(activeContext?.repositoryId || currentSession?.repositoryId || activeContext?.repoName)
  const contextReason = activeContext?.contextSelectionReason || currentSession?.contextSelectionReason
  const provenanceText = activeContext?.hasComparisonContext
    ? `Đang so sánh ${activeContext.comparedRepoCount ?? 0} repo`
    : activeContext?.repoName
      ? `AI đang dùng dữ liệu từ repo: ${activeContext.repoName}`
      : hasRoadmapContext
        ? 'AI đang dùng ngữ cảnh roadmap'
        : hasRepoContext
          ? 'AI đang dùng ngữ cảnh repository'
          : contextReason === 'latest_user_analysis'
            ? 'AI đang dùng phân tích mới nhất của bạn'
            : contextReason && contextReason !== 'none'
              ? 'AI đang dùng ngữ cảnh phân tích'
              : 'Chưa có dữ liệu phân tích rõ ràng'

  const suggestedPrompts = hasRoadmapContext
    ? [
      'Tiến độ roadmap của tôi thế nào?',
      'Task tiếp theo nên làm gì?',
      'Tôi đang bị chậm ở đâu?',
      '2 tuần tới nên ưu tiên task nào?'
    ]
    : hasRepoContext
      ? [
        'Tại sao tôi hợp role này?',
        'Repo này còn yếu kỹ năng gì?',
        '2 tuần tới nên học gì trước?',
        'Dựa trên repo này, tôi nên ghi gì vào CV?',
        'Tôi nên chuẩn bị phỏng vấn gì?'
      ]
      : [
        'Tôi hợp Backend hay Frontend hơn?',
        'Repo nào nên đưa vào CV?',
        'So sánh các repo đã phân tích của tôi',
        'Tôi nên học gì tiếp theo?'
      ]

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động'
      case 'waiting_admin':
        return 'Chờ admin phản hồi'
      case 'answered':
        return 'Đã trả lời'
      case 'closed':
        return 'Đã đóng'
      default:
        return status || 'Mới'
    }
  }

  const modeLabel = (session?: typeof sessions[number] | null) => {
    const mode = session?.status === 'closed' ? undefined : session?.effectiveMode ?? session?.mode
    return mode === 'MANUAL' ? 'Manual' : mode === 'AI_AUTO' ? 'AI Auto' : undefined
  }

  const modeVariant = (session?: typeof sessions[number] | null) => {
    const mode = session?.effectiveMode ?? session?.mode
    return mode === 'MANUAL' ? 'info' : 'default'
  }

  const modeSourceLabel = (modeSource?: string) => {
    return modeSource === 'SESSION' ? 'Session' : modeSource === 'GLOBAL' ? 'Global' : modeSource
  }

  const messagePreview = (session: typeof sessions[number]) => {
    return session.lastMessage?.content || session.messages[session.messages.length - 1]?.content || formatRelativeTime(session.updatedAt || session.lastMessageAt || session.createdAt)
  }

  const isManualWaiting = manualWaiting || (currentSession?.status === 'waiting_admin' && (currentSession.effectiveMode ?? currentSession.mode) === 'MANUAL')
  const isClosed = currentSession?.status === 'closed'
  const deletingSession = sessions.find((session) => session.id === deleteSessionId)

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-7xl gap-6 overflow-hidden">
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open)
        if (!open) {
          setCreateError('')
          setNewSessionTitle('')
          setSelectedRepositoryId('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo cuộc trò chuyện mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <Input
              label="Tiêu đề"
              value={newSessionTitle}
              onChange={(event) => {
                setNewSessionTitle(event.target.value)
                if (createError) setCreateError('')
              }}
              placeholder="Ví dụ: Tư vấn lộ trình Backend"
              error={createError}
              autoFocus
              disabled={isLoading}
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Ngữ cảnh tư vấn
              </label>
              <select
                value={selectedRepositoryId}
                onChange={(event) => setSelectedRepositoryId(event.target.value)}
                disabled={isLoading}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Dùng phân tích mới nhất</option>
                {analyzedRepositoryOptions.map((repo) => (
                  <option key={repo.id} value={repo.id}>{repo.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chỉ hiện repo đã được phân tích</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isLoading}>
                Hủy
              </Button>
              <Button type="submit" disabled={!newSessionTitle.trim() || isLoading} isLoading={isLoading}>
                Tạo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleteSessionId)} onOpenChange={(open) => !open && setDeleteSessionId('')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa cuộc trò chuyện</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bạn có chắc muốn xóa "{deletingSession?.title || 'cuộc trò chuyện này'}"?
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteSessionId('')} disabled={isLoading}>Hủy</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteSession} isLoading={isLoading}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <aside className="hidden w-72 flex-shrink-0 lg:block">
        <Card className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <Button className="w-full" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo cuộc trò chuyện
            </Button>
          </div>

          <div className="border-b border-slate-200 p-3 dark:border-slate-800">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Ngữ cảnh AI</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>GitHub</span>
                <Badge variant={user?.githubConnected ? 'success' : 'default'}>
                  {user?.githubConnected ? 'Đã kết nối' : 'Thiếu'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Repos</span>
                <Badge variant={repositories.length ? 'info' : 'default'}>{repositories.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Phân tích</span>
                <Badge variant={analyses.length ? 'success' : 'default'}>{analyses.length}</Badge>
              </div>
            </div>
            {(!user?.githubConnected || analyses.length === 0) && (
              <div className="mt-3 space-y-2">
                {!user?.githubConnected && (
                  <Link to="/github/connect">
                    <Button variant="outline" size="sm" className="w-full">Kết nối GitHub</Button>
                  </Link>
                )}
                {user?.githubConnected && analyses.length === 0 && (
                  <Link to="/repositories">
                    <Button variant="outline" size="sm" className="w-full">Phân tích repo</Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {sessions.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">Chưa có cuộc trò chuyện.</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`mb-1 w-full rounded-lg px-3 py-2 text-left transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                      : session.unreadByUser
                        ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <button type="button" onClick={() => selectSession(session.id)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium">{session.title}</p>
                      {session.unreadByUser && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{messagePreview(session)}</p>
                  </button>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={session.status === 'waiting_admin' ? 'warning' : session.status === 'answered' ? 'success' : 'default'}>
                      {statusLabel(session.status)}
                    </Badge>
                    {modeLabel(session) && (
                      <Badge variant={modeVariant(session)}>
                        {modeLabel(session)}
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteSessionId(session.id)}
                      className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      title="Xóa cuộc trò chuyện"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <Card className="flex h-full min-h-0 flex-col overflow-hidden">
          {error && (
            <div className="m-4 flex flex-shrink-0 items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex flex-shrink-0 flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-slate-900 dark:text-slate-100">
                {currentSession?.title || 'AI Mentor'}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Chat dựa trên repository, phân tích và ngữ cảnh GitHub của bạn.
              </p>
              <Badge variant={activeContext?.contextPinned ? 'success' : 'default'} className="mt-2">
                {activeContext?.contextPinned ? 'Ngữ cảnh đã ghim' : provenanceText}
              </Badge>
              {currentSession?.repositoryContext && (
                <Badge variant="info" className="mt-2">
                  Context: {currentSession.repositoryContext}
                </Badge>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {currentSession?.status && <Badge variant={currentSession.status === 'waiting_admin' ? 'warning' : 'default'}>{statusLabel(currentSession.status)}</Badge>}
                {modeLabel(currentSession) && <Badge variant={modeVariant(currentSession)}>{modeLabel(currentSession)}</Badge>}
                {currentSession?.modeSource && <Badge variant="default">{modeSourceLabel(currentSession.modeSource)}</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex max-w-full gap-2 overflow-x-auto lg:hidden">
                {sessions.slice(0, 4).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    className={`max-w-36 truncate rounded-lg border px-3 py-1.5 text-xs ${
                      currentSession?.id === session.id
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {session.title}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" title="Tùy chọn cuộc trò chuyện">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
            {isManualWaiting && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <Headphones className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>Tin nhắn đã được gửi. Đang chờ admin trả lời.</p>
              </div>
            )}
            {isClosed && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>Session đã đóng, bạn không thể gửi thêm tin nhắn.</p>
              </div>
            )}
            {currentSession ? (
              currentSession.messages.length === 0 ? (
                <div className="flex min-h-full items-center justify-center py-8 text-center">
                  <div>
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Bắt đầu hỏi AI Mentor
                    </h3>
                    <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
                      {suggestedPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => setInput(prompt)}
                          className="rounded-lg border border-slate-200 p-3 text-left text-sm transition-colors hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-indigo-700 dark:hover:bg-slate-800/50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentSession.messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}>
                      {message.senderType !== 'USER' && (
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${message.senderType === 'ADMIN' ? 'bg-slate-700' : 'bg-gradient-to-br from-indigo-600 to-purple-600'}`}>
                          {message.senderType === 'ADMIN' ? <Headphones className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4 text-white" />}
                        </div>
                      )}
                      <div className={`max-w-[min(80%,44rem)] rounded-lg px-4 py-3 ${message.senderType === 'USER' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'}`}>
                        {message.senderType !== 'USER' && (
                          <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {message.senderType === 'ADMIN' ? 'Admin hỗ trợ' : 'AI Mentor'}
                          </p>
                        )}
                        {renderChatMessageContent(message.content)}
                        <p className={`mt-2 text-xs ${message.senderType === 'USER' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {formatRelativeTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isAiTyping && !isManualWaiting && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div className="rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )
            ) : (
              <div className="flex min-h-full items-center justify-center p-6 text-center">
                <div>
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Hỏi AI Mentor
                  </h3>
                  <p className="mx-auto max-w-md text-sm text-slate-500 dark:text-slate-400">
                    Bạn có thể nhập câu hỏi ngay. Hệ thống sẽ tự tạo cuộc trò chuyện và lưu lại nội dung cho bạn.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-slate-200 p-4 dark:border-slate-800">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => handleInputChange(event.target.value)}
                placeholder="Nhập câu hỏi..."
                disabled={isSending || isLoading || isClosed}
                className="h-12 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              />
              <Button type="submit" disabled={!input.trim() || isSending || isLoading || isClosed} className="h-12 px-6">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </section>
    </div>
  )
}
