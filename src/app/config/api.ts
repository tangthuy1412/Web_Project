export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://career-roadmap-api-zs7y.onrender.com/api'

export const API_ORIGIN = new URL(API_BASE_URL).origin

const getCurrentOrigin = () => {
  return typeof window !== 'undefined' ? window.location.origin : ''
}

export const getGitHubAuthCallbackUrl = () => {
  return import.meta.env.VITE_GITHUB_AUTH_CALLBACK_URL || `${getCurrentOrigin()}/auth/github/callback`
}

export const getGitHubConnectCallbackUrl = () => {
  return import.meta.env.VITE_GITHUB_CONNECT_CALLBACK_URL || `${getCurrentOrigin()}/github/connect`
}
