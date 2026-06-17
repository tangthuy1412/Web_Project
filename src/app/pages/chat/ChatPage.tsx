import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AlertCircle, MoreHorizontal, Plus, Send, Sparkles } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useChatStore } from '../../stores/chatStore'
import { useAuthStore } from '../../stores/authStore'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatRelativeTime } from '../../lib/utils'

export const ChatPage = () => {
  const { sessions, currentSession, sendMessage, createSession, selectSession, fetchSessions, isLoading, error } = useChatStore()
  const user = useAuthStore(state => state.user)
  const {
    repositories,
    analyses,
    fetchRepositories,
    fetchMyAnalyses
  } = useRepositoryStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSessions()
    fetchRepositories().catch(() => undefined)
    fetchMyAnalyses().catch(() => undefined)
  }, [fetchMyAnalyses, fetchRepositories, fetchSessions])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [currentSession?.messages, isLoading])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim()) return

    const message = input
    setInput('')
    await sendMessage(message)
  }

  const suggestedPrompts = [
    'Dựa trên GitHub của tôi, tôi nên học gì tiếp theo?',
    'Repository nào của tôi nên đưa vào portfolio?',
    'Tôi phù hợp Backend hay Fullstack hơn?',
    'Hãy gợi ý kế hoạch cải thiện commit và documentation.'
  ]

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-7xl gap-6 overflow-hidden">
      <aside className="hidden w-72 flex-shrink-0 lg:block">
        <Card className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <Button className="w-full" onClick={() => createSession('Tư vấn GitHub của tôi')}>
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
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="truncate text-sm font-medium">{session.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatRelativeTime(session.createdAt)}
                  </p>
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
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' && (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[min(80%,44rem)] rounded-lg px-4 py-3 ${message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'}`}>
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                        <p className={`mt-2 text-xs ${message.role === 'user' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {formatRelativeTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
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
                disabled={isLoading}
                className="h-12 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              />
              <Button type="submit" disabled={!input.trim() || isLoading} className="h-12 px-6">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </section>
    </div>
  )
}
