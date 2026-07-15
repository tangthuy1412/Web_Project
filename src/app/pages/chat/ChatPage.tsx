import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AlertCircle, Headphones, MoreHorizontal, Plus, Send, Sparkles } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useChatStore } from '../../stores/chatStore'
import { useAuthStore } from '../../stores/authStore'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatRelativeTime } from '../../lib/utils'

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
  const { sessions, currentSession, sendMessage, createSession, selectSession, fetchSessions, isLoading, isSending, isAiTyping, manualWaiting, error } = useChatStore()
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim()) return

    const message = input
    setInput('')
    await sendMessage(message)
  }

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = newSessionTitle.trim()

    if (!title) {
      setCreateError('Vui long nhap tieu de cuoc tro chuyen.')
      return
    }

    try {
      setCreateError('')
      await createSession(title)
      setNewSessionTitle('')
      setIsCreateOpen(false)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Khong the tao cuoc tro chuyen.')
    }
  }

  const suggestedPrompts = [
    'Dựa trên GitHub của tôi, tôi nên học gì tiếp theo?',
    'Repository nào của tôi nên đưa vào portfolio?',
    'Tôi phù hợp Backend hay Fullstack hơn?',
    'Hãy gợi ý kế hoạch cải thiện commit và documentation.'
  ]

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'active':
        return 'Dang hoat dong'
      case 'waiting_admin':
        return 'Cho admin'
      case 'answered':
        return 'Da tra loi'
      case 'closed':
        return 'Da dong'
      default:
        return status || 'Moi'
    }
  }

  const modeLabel = (mode?: string) => {
    return mode === 'MANUAL' ? 'Manual' : mode === 'AI_AUTO' ? 'AI Auto' : undefined
  }

  const messagePreview = (session: typeof sessions[number]) => {
    return session.lastMessage?.content || session.messages[session.messages.length - 1]?.content || formatRelativeTime(session.updatedAt || session.lastMessageAt || session.createdAt)
  }

  const isManualWaiting = manualWaiting || currentSession?.effectiveMode === 'MANUAL' || currentSession?.status === 'waiting_admin'

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-7xl gap-6 overflow-hidden">
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open)
        if (!open) {
          setCreateError('')
          setNewSessionTitle('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tao cuoc tro chuyen moi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <Input
              label="Tieu de"
              value={newSessionTitle}
              onChange={(event) => {
                setNewSessionTitle(event.target.value)
                if (createError) setCreateError('')
              }}
              placeholder="Vi du: Tu van lo trinh Backend"
              error={createError}
              autoFocus
              disabled={isLoading}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isLoading}>
                Huy
              </Button>
              <Button type="submit" disabled={!newSessionTitle.trim() || isLoading} isLoading={isLoading}>
                Tao
              </Button>
            </DialogFooter>
          </form>
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
                <button
                  key={session.id}
                  onClick={() => selectSession(session.id)}
                  className={`mb-1 w-full rounded-lg px-3 py-2 text-left transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                      : session.unreadByUser
                        ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium">{session.title}</p>
                    {session.unreadByUser && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{messagePreview(session)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={session.status === 'waiting_admin' ? 'warning' : session.status === 'answered' ? 'success' : 'default'}>
                      {statusLabel(session.status)}
                    </Badge>
                    {modeLabel(session.effectiveMode) && (
                      <Badge variant={session.effectiveMode === 'MANUAL' ? 'info' : 'default'}>
                        {modeLabel(session.effectiveMode)}
                      </Badge>
                    )}
                  </div>
                </button>
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
              {currentSession?.repositoryContext && (
                <Badge variant="info" className="mt-2">
                  Context: {currentSession.repositoryContext}
                </Badge>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {currentSession?.status && <Badge variant={currentSession.status === 'waiting_admin' ? 'warning' : 'default'}>{statusLabel(currentSession.status)}</Badge>}
                {modeLabel(currentSession?.effectiveMode) && <Badge variant={currentSession?.effectiveMode === 'MANUAL' ? 'info' : 'default'}>{modeLabel(currentSession?.effectiveMode)}</Badge>}
                {currentSession?.modeSource && <Badge variant="default">{currentSession.modeSource === 'SESSION' ? 'Override' : 'Global'}</Badge>}
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
                <p>Tin nhan da duoc gui. Dang cho admin tra loi.</p>
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
                onChange={(event) => setInput(event.target.value)}
                placeholder="Nhập câu hỏi..."
                disabled={isSending || isLoading}
                className="h-12 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              />
              <Button type="submit" disabled={!input.trim() || isSending || isLoading} className="h-12 px-6">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </section>
    </div>
  )
}
