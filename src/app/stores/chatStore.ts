import { create } from 'zustand'
import type { ChatMessage, ChatSession } from '../types'
import { chatApi } from '../services/apis/chatApi'
import { extractApiResource, getApiErrorMessage } from '../services/apis/apiClient'
import { normalizeChatMessage, normalizeChatSession, normalizeChatSessions } from '../services/apis/normalizers'

type ChatState = {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  isLoading: boolean
  error: string | null
  fetchSessions: () => Promise<void>
  createSession: (title: string, repositoryContext?: string) => Promise<ChatSession>
  sendMessage: (content: string) => Promise<void>
  selectSession: (id: string) => Promise<void>
  clearError: () => void
}

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

const pickSessionPayload = (payload: unknown) => {
  return extractApiResource(payload, ['session', 'chatSession'])
}

const normalizeSessionPayload = (payload: unknown) => {
  const session = normalizeChatSession(pickSessionPayload(payload))
  const record = asRecord(payload)
  const data = asRecord(record.data)
  const messages = Array.isArray(record.messages)
    ? record.messages
    : Array.isArray(data.messages)
      ? data.messages
      : null

  if (!messages) return session

  return {
    ...session,
    messages: messages.map(normalizeChatMessage)
  }
}

const hasMessageList = (payload: unknown) => {
  const record = asRecord(payload)
  return Array.isArray(record.messages)
}

const pickAssistantMessage = (payload: unknown): ChatMessage | null => {
  const record = asRecord(payload)
  const data = asRecord(record.data)
  const candidates = [
    record.assistantMessage,
    data.assistantMessage,
    record.aiMessage,
    data.aiMessage,
    record.reply,
    data.reply,
    record.answer,
    data.answer,
    record.aiResponse,
    data.aiResponse,
    record.response,
    data.response,
    record.message,
    data.message
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: candidate,
        timestamp: new Date().toISOString()
      }
    }

    const candidateRecord = asRecord(candidate)
    const nestedContent = asRecord(candidateRecord.content)
    const directText = [
      candidateRecord.answer,
      candidateRecord.assistantResponse,
      candidateRecord.aiResponse,
      candidateRecord.response,
      candidateRecord.reply,
      candidateRecord.text,
      candidateRecord.message,
      candidateRecord.output,
      nestedContent.text,
      nestedContent.message
    ].find((value) => typeof value === 'string' && value.trim())

    if (typeof directText === 'string') {
      return {
        id: String(candidateRecord.id ?? candidateRecord._id ?? `assistant-${Date.now()}`),
        role: 'assistant',
        content: directText,
        timestamp: typeof candidateRecord.createdAt === 'string' ? candidateRecord.createdAt : new Date().toISOString()
      }
    }

    const message = normalizeChatMessage(candidate)
    if (message.content) return message
  }

  if (Array.isArray(record.messages) || Array.isArray(data.messages)) {
    const messages = (Array.isArray(record.messages) ? record.messages : data.messages as unknown[]).map(normalizeChatMessage)
    return [...messages].reverse().find((message) => message.role === 'assistant' && message.content) ?? null
  }

  return null
}

const mergeSession = (base: ChatSession, next: ChatSession) => {
  const mergedById = new Map<string, ChatMessage>()

  for (const message of base.messages) {
    mergedById.set(message.id, message)
  }

  for (const message of next.messages) {
    mergedById.set(message.id, message)
  }

  return {
    ...base,
    ...next,
    messages: Array.from(mergedById.values())
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true, error: null })

    try {
      const sessions = normalizeChatSessions(await chatApi.getSessions())
      const current = get().currentSession
      const syncedCurrent = current ? sessions.find((session) => session.id === current.id) ?? current : sessions[0] ?? null
      let hydratedCurrent = syncedCurrent

      if (syncedCurrent?.id) {
        try {
          hydratedCurrent = normalizeSessionPayload(await chatApi.getSession(syncedCurrent.id))
        } catch {
          hydratedCurrent = syncedCurrent
        }
      }

      set({
        sessions,
        currentSession: hydratedCurrent,
        isLoading: false
      })
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
    }
  },

  createSession: async (title) => {
    set({ isLoading: true, error: null })

    try {
      const session = normalizeChatSession(pickSessionPayload(await chatApi.createSession(title.trim() || 'Cuộc trò chuyện mới')))
      if (!session.id) throw new Error('Backend không trả session id')

      set((state) => ({
        sessions: [session, ...state.sessions.filter((item) => item.id !== session.id)],
        currentSession: session,
        isLoading: false
      }))

      return session
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  sendMessage: async (content) => {
    let currentSession = get().currentSession

    if (!currentSession) {
      currentSession = await get().createSession('Tư vấn GitHub của tôi')
    }

    if (!currentSession.id) {
      set({ error: 'Chat session không có id. Hãy tạo session mới.' })
      return
    }

    const optimisticMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, messages: [...state.currentSession.messages, optimisticMessage] }
        : state.currentSession,
      isLoading: true,
      error: null
    }))

    try {
      const payload = await chatApi.sendMessage(currentSession.id, content)
      const sessionPayload = pickSessionPayload(payload)
      const responseSession = hasMessageList(sessionPayload) ? normalizeChatSession(sessionPayload) : null
      const responseMessage = responseSession ? null : pickAssistantMessage(payload)
      const currentAfterOptimistic = get().currentSession ?? currentSession

      let nextSession: ChatSession = responseSession
        ? mergeSession(currentAfterOptimistic, responseSession)
        : {
          ...currentAfterOptimistic,
          messages: responseMessage?.content
            ? [...currentAfterOptimistic.messages, responseMessage]
            : currentAfterOptimistic.messages
        }

      try {
        const detailSession = normalizeSessionPayload(await chatApi.getSession(currentSession.id))
        if (detailSession.messages.length >= nextSession.messages.length) {
          nextSession = detailSession
        }
      } catch {
        // Giữ response vừa nhận nếu endpoint detail chưa sẵn sàng hoặc chưa kịp lưu message mới.
      }

      set((state) => ({
        currentSession: nextSession,
        sessions: state.sessions.some((session) => session.id === currentSession.id)
          ? state.sessions.map((session) => session.id === currentSession.id ? nextSession : session)
          : [nextSession, ...state.sessions],
        isLoading: false
      }))
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  selectSession: async (id) => {
    const cached = get().sessions.find((session) => session.id === id)
    if (cached) set({ currentSession: cached, error: null })

    try {
      const session = normalizeSessionPayload(await chatApi.getSession(id))
      set((state) => ({
        currentSession: session,
        sessions: state.sessions.map((item) => item.id === id ? session : item)
      }))
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    }
  },

  clearError: () => set({ error: null })
}))
