import axios, { AxiosError } from 'axios'

const TOKEN_KEY = 'gitanalyzer.jwt'
const USER_KEY = 'gitanalyzer.user'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export const getStoredUser = <T>() => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as T
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export const setStoredUser = (user: unknown) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearStoredUser = () => {
  localStorage.removeItem(USER_KEY)
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken()
      clearStoredUser()

      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  }
)

export const unwrapResponse = <T>(payload: unknown): T => {
  const value = payload as Record<string, unknown>

  if (value?.data !== undefined) {
    return value.data as T
  }

  if (value?.result !== undefined) {
    return value.result as T
  }

  return payload as T
}

export const extractApiResource = <T>(payload: unknown, keys: string[]): T => {
  const unwrapped = unwrapResponse<unknown>(payload)
  const record = unwrapped && typeof unwrapped === 'object' ? unwrapped as Record<string, unknown> : null

  if (record) {
    for (const key of keys) {
      if (record[key] !== undefined) return record[key] as T
    }
  }

  return unwrapped as T
}

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as Record<string, unknown> | undefined
    return String(payload?.message ?? payload?.error ?? error.message)
  }

  return error instanceof Error ? error.message : 'Da co loi xay ra'
}
