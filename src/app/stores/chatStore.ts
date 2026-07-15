import { create } from 'zustand'
import type { ChatMessage, ChatMode, ChatSession, SendMessagePayload } from '../types'
import { extractApiResource, getApiErrorMessage } from '../services/apis/core'
import { chatApi, normalizeChatMessage, normalizeChatSession, normalizeChatSessions, normalizeSendMessageResponse } from '../services/apis/chat'

type ChatState = {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  isLoading: boolean
  isSending: boolean
  isAiTyping: boolean
  manualWaiting: boolean
  error: string | null
  fetchSessions: () => Promise<void>
  createSession: (title: string, repositoryContext?: string) => Promise<ChatSession>
  sendMessage: (content: string, context?: Omit<SendMessagePayload, 'message'>) => Promise<void>
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
        senderType: 'AI',
        role: 'assistant',
        content: candidate,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
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
        _id: typeof candidateRecord._id === 'string' ? candidateRecord._id : undefined,
        senderType: 'AI',
        role: 'assistant',
        content: directText,
        timestamp: typeof candidateRecord.createdAt === 'string' ? candidateRecord.createdAt : new Date().toISOString(),
        createdAt: typeof candidateRecord.createdAt === 'string' ? candidateRecord.createdAt : new Date().toISOString()
      }
    }

    const message = normalizeChatMessage(candidate)
    if (message.content) return message
  }

  if (Array.isArray(record.messages) || Array.isArray(data.messages)) {
    const messages = (Array.isArray(record.messages) ? record.messages : data.messages as unknown[]).map(normalizeChatMessage)
    return [...messages].reverse().find((message) => message.senderType === 'AI' && message.content) ?? null
  }

  return null
}

const messageKey = (message: ChatMessage) => {
  return message.id || message._id || `${message.senderType}-${message.createdAt}-${message.content}`
}

const mergeMessages = (messages: ChatMessage[]) => {
  const mergedById = new Map<string, ChatMessage>()
  for (const message of messages) {
    if (message.content) mergedById.set(messageKey(message), message)
  }
  return Array.from(mergedById.values())
}

const mergeSession = (base: ChatSession, next: ChatSession) => {
  return {
    ...base,
    ...next,
    messages: mergeMessages([...base.messages, ...next.messages])
  }
}

const deriveMode = (effectiveMode: ChatMode | undefined, aiMessage: ChatMessage | null) => {
  if (effectiveMode) return effectiveMode
  if (aiMessage) return 'AI_AUTO'

  if (import.meta.env.DEV) {
    console.warn('Chat send response missing effectiveMode; falling back without AI loading.')
  }

  return 'MANUAL'
}

const isManualWaitingSession = (session: ChatSession | null) => {
  return session?.effectiveMode === 'MANUAL' || session?.status === 'waiting_admin'
}

const upsertSession = (sessions: ChatSession[], session: ChatSession) => {
  return sessions.some((item) => item.id === session.id)
    ? sessions.map((item) => item.id === session.id ? session : item)
    : [session, ...sessions]
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  isSending: false,
  isAiTyping: false,
  manualWaiting: false,
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
        manualWaiting: isManualWaitingSession(hydratedCurrent),
        isLoading: false
      })
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
    }
  },

  createSession: async (title, repositoryContext) => {
    set({ isLoading: true, error: null })

    try {
      const context = repositoryContext ? { repositoryId: repositoryContext } : undefined
      const session = normalizeChatSession(pickSessionPayload(await chatApi.createSession(title.trim() || 'Cuoc tro chuyen moi', context)))
      if (!session.id) throw new Error('Backend khong tra session id')

      set((state) => ({
        sessions: [session, ...state.sessions.filter((item) => item.id !== session.id)],
        currentSession: session,
        manualWaiting: isManualWaitingSession(session),
        isLoading: false
      }))

      return session
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  sendMessage: async (content, context) => {
    let currentSession = get().currentSession

    if (!currentSession) {
      currentSession = await get().createSession('Tu van GitHub cua toi')
    }

    if (!currentSession.id) {
      set({ error: 'Chat session khong co id. Hay tao session moi.' })
      return
    }

    const now = new Date().toISOString()
    const optimisticMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      senderType: 'USER',
      role: 'user',
      content,
      timestamp: now,
      createdAt: now
    }

    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, messages: [...state.currentSession.messages, optimisticMessage] }
        : state.currentSession,
      isSending: true,
      isAiTyping: state.currentSession?.effectiveMode !== 'MANUAL' && state.currentSession?.status !== 'waiting_admin',
      manualWaiting: false,
      error: null
    }))

    try {
      const payload = await chatApi.sendMessage(currentSession.id, { message: content, ...context })
      const response = normalizeSendMessageResponse(payload)
      const mode = deriveMode(response.effectiveMode, response.aiMessage)
      const currentAfterOptimistic = get().currentSession ?? currentSession
      const baseMessages = currentAfterOptimistic.messages.filter((message) => message.id !== optimisticMessage.id)
      const responseMessages = [
        response.userMessage,
        mode === 'AI_AUTO' ? response.aiMessage : null,
        response.adminMessage
      ].filter((message): message is ChatMessage => Boolean(message?.content))

      let nextSession: ChatSession = response.session
        ? {
          ...mergeSession({ ...currentAfterOptimistic, messages: baseMessages }, response.session),
          messages: mergeMessages([
            ...mergeSession({ ...currentAfterOptimistic, messages: baseMessages }, response.session).messages,
            ...responseMessages
          ])
        }
        : {
          ...currentAfterOptimistic,
          mode: response.mode ?? currentAfterOptimistic.mode,
          modeSource: response.modeSource ?? currentAfterOptimistic.modeSource,
          effectiveMode: response.effectiveMode ?? mode,
          status: response.status ?? (mode === 'MANUAL' ? 'waiting_admin' : currentAfterOptimistic.status),
          context: response.context ?? currentAfterOptimistic.context,
          messages: mergeMessages([...baseMessages, ...responseMessages])
        }

      if (hasMessageList(pickSessionPayload(payload))) {
        nextSession = mergeSession(nextSession, normalizeChatSession(pickSessionPayload(payload)))
      }

      try {
        const detailSession = normalizeSessionPayload(await chatApi.getSession(currentSession.id))
        if (detailSession.messages.length >= nextSession.messages.length) {
          nextSession = mergeSession(nextSession, detailSession)
        }
      } catch {
        // Keep the send response if detail is unavailable or not updated yet.
      }

      set((state) => ({
        currentSession: nextSession,
        sessions: upsertSession(state.sessions, nextSession),
        manualWaiting: isManualWaitingSession(nextSession),
        isSending: false,
        isAiTyping: false
      }))
    } catch (error) {
      set((state) => ({
        currentSession: state.currentSession
          ? { ...state.currentSession, messages: state.currentSession.messages.filter((message) => message.id !== optimisticMessage.id) }
          : state.currentSession,
        isSending: false,
        isAiTyping: false,
        error: getApiErrorMessage(error)
      }))
      throw error
    }
  },

  selectSession: async (id) => {
    const cached = get().sessions.find((session) => session.id === id)
    if (cached) set({ currentSession: cached, manualWaiting: isManualWaitingSession(cached), error: null })

    try {
      const session = normalizeSessionPayload(await chatApi.getSession(id))
      set((state) => ({
        currentSession: session,
        sessions: upsertSession(state.sessions, session),
        manualWaiting: isManualWaitingSession(session)
      }))
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    }
  },

  clearError: () => set({ error: null })
}))
