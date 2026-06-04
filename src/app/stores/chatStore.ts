import { create } from 'zustand'
import type { ChatSession } from '../types'
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

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true, error: null })

    try {
      const sessions = normalizeChatSessions(await chatApi.getSessions())
      set({
        sessions,
        currentSession: get().currentSession ?? sessions[0] ?? null,
        isLoading: false
      })
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
    }
  },

  createSession: async (title) => {
    set({ isLoading: true, error: null })

    try {
      const session = normalizeChatSession(extractApiResource(await chatApi.createSession(title), ['session', 'chatSession']))
      if (!session.id) throw new Error('Backend không trả session id')

      set((state) => ({
        sessions: [session, ...state.sessions],
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
      currentSession = await get().createSession('Tu van GitHub cua toi')
    }

    if (!currentSession.id) {
      set({ error: 'Chat session không có id. Hãy tạo session mới.' })
      return
    }

    const optimisticMessage = {
      id: `local-${Date.now()}`,
      role: 'user' as const,
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
      const sessionPayload = extractApiResource(payload, ['session', 'chatSession'])
      const responseSession = sessionPayload && typeof sessionPayload === 'object' && 'messages' in sessionPayload
        ? normalizeChatSession(sessionPayload)
        : null
      const responseMessage = responseSession
        ? null
        : normalizeChatMessage(extractApiResource(payload, ['assistantMessage', 'message', 'reply', 'aiResponse', 'response']))

      set((state) => {
        const nextSession = responseSession ?? (
          state.currentSession
            ? { ...state.currentSession, messages: [...state.currentSession.messages, responseMessage!] }
            : state.currentSession
        )

        return {
          currentSession: nextSession,
          sessions: state.sessions.map((session) => session.id === currentSession.id ? nextSession! : session),
          isLoading: false
        }
      })
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  selectSession: async (id) => {
    const cached = get().sessions.find((session) => session.id === id)
    if (cached) set({ currentSession: cached })

    try {
      const session = normalizeChatSession(extractApiResource(await chatApi.getSession(id), ['session', 'chatSession']))
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
