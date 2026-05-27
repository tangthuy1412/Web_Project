import { create } from 'zustand'
import type { User } from '../types'
import { mockUser } from '../mock/data'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  connectGitHub: (username: string) => void
  disconnectGitHub: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: mockUser,
  isAuthenticated: true,

  login: async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    set({ user: mockUser, isAuthenticated: true })
  },

  register: async (email: string, password: string, name: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const newUser: User = {
      ...mockUser,
      email,
      name,
      githubConnected: false,
      githubUsername: undefined
    }
    set({ user: newUser, isAuthenticated: true })
  },

  logout: () => {
    set({ user: null, isAuthenticated: false })
  },

  connectGitHub: (username: string) => {
    set(state => ({
      user: state.user ? { ...state.user, githubConnected: true, githubUsername: username } : null
    }))
  },

  disconnectGitHub: () => {
    set(state => ({
      user: state.user ? { ...state.user, githubConnected: false, githubUsername: undefined } : null
    }))
  }
}))
