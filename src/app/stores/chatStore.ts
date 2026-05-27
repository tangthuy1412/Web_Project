import { create } from 'zustand'
import type { ChatSession, ChatMessage } from '../types'
import { mockChatSessions } from '../mock/data'

interface ChatState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  isLoading: boolean
  createSession: (title: string, repositoryContext?: string) => void
  sendMessage: (content: string) => Promise<void>
  selectSession: (id: string) => void
  deleteSession: (id: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: mockChatSessions,
  currentSession: mockChatSessions[0] || null,
  isLoading: false,

  createSession: (title: string, repositoryContext?: string) => {
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      messages: [],
      repositoryContext
    }
    set(state => ({
      sessions: [newSession, ...state.sessions],
      currentSession: newSession
    }))
  },

  sendMessage: async (content: string) => {
    const currentSession = get().currentSession
    if (!currentSession) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    set(state => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        messages: [...state.currentSession.messages, userMessage]
      } : null
    }))

    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 1500))

    const aiMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: 'This is a mock AI response. In production, this would connect to a real AI backend to provide personalized coding advice, answer questions about your repositories, and help you improve your development skills.',
      timestamp: new Date().toISOString()
    }

    set(state => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        messages: [...state.currentSession.messages, aiMessage]
      } : null,
      sessions: state.sessions.map(s =>
        s.id === state.currentSession?.id
          ? { ...s, messages: [...s.messages, userMessage, aiMessage] }
          : s
      ),
      isLoading: false
    }))
  },

  selectSession: (id: string) => {
    const session = get().sessions.find(s => s.id === id)
    if (session) {
      set({ currentSession: session })
    }
  },

  deleteSession: (id: string) => {
    set(state => ({
      sessions: state.sessions.filter(s => s.id !== id),
      currentSession: state.currentSession?.id === id ? null : state.currentSession
    }))
  }
}))
