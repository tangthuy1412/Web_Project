import { create } from 'zustand'
import axios from 'axios'
import type { ChatMessage, ChatMode, ChatSession, CreateChatSessionPayload, SendMessagePayload } from '../types'
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
  createSession: (payload: string | CreateChatSessionPayload, repositoryContext?: string) => Promise<ChatSession>
  sendMessage: (content: string, context?: Omit<SendMessagePayload, 'message'>) => Promise<void>
  selectSession: (id: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
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
  const context = next.context ?? base.context

  return {
    ...base,
    ...next,
    repositoryId: next.repositoryId ?? context?.repositoryId ?? base.repositoryId,
    roadmapId: next.roadmapId ?? context?.roadmapId ?? base.roadmapId,
    analysisId: next.analysisId ?? context?.analysisId ?? base.analysisId,
    snapshotId: next.snapshotId ?? context?.snapshotId ?? base.snapshotId,
    contextSelectionReason: next.contextSelectionReason ?? context?.contextSelectionReason ?? base.contextSelectionReason,
    context,
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
  return session?.status === 'waiting_admin' && (session.effectiveMode ?? session.mode) === 'MANUAL'
}

const getErrorCode = (error: unknown) => {
  if (!axios.isAxiosError(error)) return ''
  const payload = error.response?.data as Record<string, unknown> | undefined
  return String(payload?.errorCode ?? '')
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

  createSession: async (payload, repositoryContext) => {
    set({ isLoading: true, error: null })

    try {
      const title = typeof payload === 'string' ? payload : payload.title
      const context = typeof payload === 'string' && repositoryContext ? { repositoryId: repositoryContext } : undefined
      const body = typeof payload === 'string' ? title.trim() || 'Cuoc tro chuyen moi' : { ...payload, title: title.trim() || 'Cuoc tro chuyen moi' }
      const responsePayload = await chatApi.createSession(body, context)
      const session = normalizeChatSession(pickSessionPayload(responsePayload))
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
      currentSession = await get().createSession('Tư vấn GitHub của tôi')
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
      isAiTyping: (state.currentSession?.effectiveMode ?? state.currentSession?.mode) !== 'MANUAL',
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
          repositoryId: response.context?.repositoryId ?? context?.repositoryId ?? currentAfterOptimistic.repositoryId,
          roadmapId: response.context?.roadmapId ?? context?.roadmapId ?? currentAfterOptimistic.roadmapId,
          analysisId: response.context?.analysisId ?? context?.analysisId ?? currentAfterOptimistic.analysisId,
          snapshotId: response.context?.snapshotId ?? context?.snapshotId ?? currentAfterOptimistic.snapshotId,
          contextSelectionReason: response.context?.contextSelectionReason ?? currentAfterOptimistic.contextSelectionReason,
          context: response.context ?? currentAfterOptimistic.context,
          messages: mergeMessages([...baseMessages, ...responseMessages])
        }

      if (hasMessageList(pickSessionPayload(payload))) {
        nextSession = mergeSession(nextSession, normalizeChatSession(pickSessionPayload(payload)))
      }

      if (response.context) {
        nextSession = {
          ...nextSession,
          repositoryId: response.context.repositoryId ?? nextSession.repositoryId,
          roadmapId: response.context.roadmapId ?? nextSession.roadmapId,
          analysisId: response.context.analysisId ?? nextSession.analysisId,
          snapshotId: response.context.snapshotId ?? nextSession.snapshotId,
          contextSelectionReason: response.context.contextSelectionReason ?? nextSession.contextSelectionReason,
          context: {
            ...nextSession.context,
            ...response.context
          }
        }
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
      const isClosed = getErrorCode(error) === 'CHAT_SESSION_CLOSED'
      set((state) => ({
        currentSession: state.currentSession
          ? { ...state.currentSession, status: isClosed ? 'closed' : state.currentSession.status, messages: state.currentSession.messages.filter((message) => message.id !== optimisticMessage.id) }
          : state.currentSession,
        sessions: isClosed
          ? state.sessions.map((session) => session.id === currentSession.id ? { ...session, status: 'closed' } : session)
          : state.sessions,
        isSending: false,
        isAiTyping: false,
        error: isClosed ? 'Session đã đóng, bạn không thể gửi thêm tin nhắn.' : getApiErrorMessage(error)
      }))
      throw error
    }
  },

  selectSession: async (id) => {
    const cached = get().sessions.find((session) => session.id === id)
    if (cached) set({ currentSession: cached, manualWaiting: isManualWaitingSession(cached), error: null })

    try {
      const detailSession = normalizeSessionPayload(await chatApi.getSession(id))
      const session = cached ? mergeSession(cached, detailSession) : detailSession
      set((state) => ({
        currentSession: session,
        sessions: upsertSession(state.sessions, session),
        manualWaiting: isManualWaitingSession(session)
      }))
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    }
  },

  deleteSession: async (id) => {
    set({ isLoading: true, error: null })

    try {
      await chatApi.deleteSession(id)
      set((state) => {
        const sessions = state.sessions.filter((session) => session.id !== id)
        const currentSession = state.currentSession?.id === id ? sessions[0] ?? null : state.currentSession
        return {
          sessions,
          currentSession,
          manualWaiting: isManualWaitingSession(currentSession),
          isLoading: false
        }
      })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        set((state) => {
          const sessions = state.sessions.filter((session) => session.id !== id)
          const currentSession = state.currentSession?.id === id ? sessions[0] ?? null : state.currentSession
          return { sessions, currentSession, manualWaiting: isManualWaitingSession(currentSession), isLoading: false }
        })
        return
      }

      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  clearError: () => set({ error: null })
}))
