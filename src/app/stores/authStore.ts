import { create } from 'zustand'
import type { Profile, User } from '../types'
import { authApi } from '../services/apis/authApi'
import {
  clearStoredUser,
  clearToken,
  extractApiResource,
  getApiErrorMessage,
  getStoredUser,
  getToken,
  setStoredUser
} from '../services/apis/apiClient'
import { githubApi } from '../services/apis/githubApi'
import { normalizeUser } from '../services/apis/normalizers'
import { profileApi, type ProfilePayload } from '../services/apis/profileApi'

type AuthState = {
  user: User | null
  profile: Profile | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  isLoading: boolean
  error: string | null
  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>
  fetchProfile: () => Promise<void>
  saveProfile: (payload: ProfilePayload) => Promise<void>
  connectGitHub: () => Promise<void>
  refreshGitHubAccount: () => Promise<void>
  disconnectGitHub: () => Promise<void>
  clearError: () => void
}

const toProfile = (payload: unknown): Profile => {
  const record = extractApiResource<Record<string, unknown>>(payload, ['profile', 'studentProfile', 'user'])

  return {
    id: String(record.id ?? record._id ?? ''),
    fullName: String(record.fullName ?? record.name ?? record.username ?? ''),
    university: String(record.university ?? ''),
    major: String(record.major ?? ''),
    year: Number(record.year ?? 1),
    targetCareer: String(record.targetCareer ?? ''),
    currentSkills: Array.isArray(record.currentSkills) ? record.currentSkills.map(String) : [],
    githubUsername: typeof record.githubUsername === 'string'
      ? record.githubUsername
      : typeof toRecord(record.githubAccount).username === 'string'
        ? String(toRecord(record.githubAccount).username)
        : undefined
  }
}

const toAbsoluteOAuthUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) return url

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'
  const backendOrigin = new URL(apiBase).origin

  return new URL(url, backendOrigin).toString()
}

const toRecord = (payload: unknown) => {
  return payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
}

const hasGitHubAccount = (payload: unknown) => {
  return Boolean(payload && typeof payload === 'object' && Object.keys(payload as Record<string, unknown>).length > 0)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser<User>(),
  profile: null,
  isAuthenticated: Boolean(getToken()),
  isBootstrapping: true,
  isLoading: false,
  error: null,

  bootstrap: async () => {
    if (!getToken()) {
      set({ user: null, profile: null, isAuthenticated: false, isBootstrapping: false })
      return
    }

    try {
      const userPayload = extractApiResource(await authApi.me(), ['user', 'account', 'profile'])
      const user = normalizeUser(userPayload)
      setStoredUser(user)
      set({ user, isAuthenticated: true, isBootstrapping: false })
      await get().fetchProfile()
      await get().refreshGitHubAccount()
    } catch (error) {
      clearToken()
      clearStoredUser()
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isBootstrapping: false,
        error: getApiErrorMessage(error)
      })
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })

    try {
      const payload = await authApi.login({ email, password })
      const userPayload = extractApiResource(payload, ['user', 'account', 'profile'])
      const user = normalizeUser({ ...toRecord(userPayload), email })
      setStoredUser(user)
      set({ user, isAuthenticated: true, isLoading: false })
      await get().fetchProfile()
      await get().refreshGitHubAccount()
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  register: async (email, password, fullName) => {
    set({ isLoading: true, error: null })

    try {
      const payload = await authApi.register({ email, password, fullName })
      const userPayload = extractApiResource(payload, ['user', 'account', 'profile'])
      const user = normalizeUser({ ...toRecord(userPayload), email, fullName })
      setStoredUser(user)
      set({ user, isAuthenticated: Boolean(getToken()), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  logout: async () => {
    await authApi.logout()
    clearStoredUser()
    set({ user: null, profile: null, isAuthenticated: false })
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    set({ isLoading: true, error: null })

    try {
      await authApi.changePassword({ currentPassword, newPassword, confirmPassword })
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  fetchProfile: async () => {
    try {
      const payload = await profileApi.me()
      const profile = toProfile(payload)
      set((state) => {
        const user = state.user ? {
          ...state.user,
          name: profile.fullName || state.user.name,
          githubUsername: profile.githubUsername ?? state.user.githubUsername
        } : state.user

        if (user) setStoredUser(user)

        return { profile, user }
      })
    } catch {
      set({ profile: null })
    }
  },

  saveProfile: async (payload) => {
    set({ isLoading: true, error: null })

    try {
      const saved = get().profile
        ? await profileApi.update(payload)
        : await profileApi.create(payload)
      const profile = toProfile(saved)
      set((state) => {
        const user = state.user ? {
          ...state.user,
          name: profile.fullName || state.user.name,
          githubUsername: profile.githubUsername ?? state.user.githubUsername
        } : state.user

        if (user) setStoredUser(user)

        return { profile, isLoading: false, user }
      })
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  connectGitHub: async () => {
    set({ isLoading: true, error: null })

    try {
      const { authorizeUrl, authorizationUrl, oauthUrl, connectUrl, url } = await githubApi.getOAuthUrl()
      const nextUrl = authorizeUrl ?? authorizationUrl ?? oauthUrl ?? connectUrl ?? url

      if (!nextUrl) {
        throw new Error('Backend không trả authorizeUrl')
      }

      const absoluteUrl = toAbsoluteOAuthUrl(nextUrl)
      const oauthUrlObject = new URL(absoluteUrl)

      if (oauthUrlObject.searchParams.get('client_id') === 'change_me') {
        throw new Error('GitHub OAuth chưa được cấu hình. Hãy điền GITHUB_CLIENT_ID và GITHUB_CLIENT_SECRET thật trong backend .env, sau đó restart backend.')
      }

      window.location.assign(absoluteUrl)
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  refreshGitHubAccount: async () => {
    try {
      const account = extractApiResource(await githubApi.me(), ['githubAccount', 'github', 'account', 'user'])

      if (!hasGitHubAccount(account)) {
        set((state) => {
          const user = state.user ? { ...state.user, githubConnected: false, githubUsername: undefined } : state.user
          if (user) setStoredUser(user)

          return { user }
        })
        return
      }

      const user = normalizeUser({ ...get().user, githubAccount: account, githubConnected: true })
      setStoredUser({ ...user, githubConnected: true })
      set({ user: { ...user, githubConnected: true } })
    } catch {
      set((state) => ({
        user: state.user ? { ...state.user, githubConnected: false } : state.user
      }))
      const currentUser = get().user
      if (currentUser) setStoredUser({ ...currentUser, githubConnected: false })
    }
  },

  disconnectGitHub: async () => {
    set({ isLoading: true, error: null })

    try {
      await githubApi.disconnect()
      set((state) => {
        const user = state.user ? { ...state.user, githubConnected: false, githubUsername: undefined } : state.user
        if (user) setStoredUser(user)

        return { isLoading: false, user }
      })
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  clearError: () => set({ error: null })
}))
