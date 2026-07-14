import axios from 'axios'
import { apiClient, extractApiResource, unwrapResponse } from './apiClient'

export type GitHubAccount = {
  githubUserId?: string
  username?: string
  displayName?: string
  avatarUrl?: string
  email?: string
  connectedAt?: string
  updatedAt?: string
}

export type GitHubAccountResponse = {
  connected: boolean
  account: GitHubAccount | null
}

export type GitHubDisconnectResponse = {
  connected: false
  githubLogoutUrl: string
  note?: string
}

const DEFAULT_GITHUB_LOGOUT_URL = 'https://github.com/logout'

const isNotFoundError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 404

const toRecord = (payload: unknown) => {
  return payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
}

const firstString = (...values: unknown[]) => {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0)
}

const normalizeAccount = (payload: unknown): GitHubAccountResponse => {
  const record = toRecord(unwrapResponse(payload))
  const accountCandidate = extractApiResource<unknown>(record, ['githubAccount', 'github', 'account', 'user'])
  const accountRecord = toRecord(accountCandidate)
  const connected = Boolean(
    record.connected ??
    record.githubConnected ??
    accountRecord.connected ??
    Object.keys(accountRecord).length > 0
  )

  if (!connected || Object.keys(accountRecord).length === 0) {
    return { connected: false, account: null }
  }

  return {
    connected: true,
    account: {
      githubUserId: firstString(accountRecord.githubUserId, accountRecord.githubId, accountRecord.id, accountRecord.nodeId),
      username: firstString(accountRecord.username, accountRecord.login, accountRecord.githubUsername),
      displayName: firstString(accountRecord.displayName, accountRecord.name),
      avatarUrl: firstString(accountRecord.avatarUrl, accountRecord.avatar_url, accountRecord.avatar),
      email: firstString(accountRecord.email),
      connectedAt: firstString(accountRecord.connectedAt, accountRecord.createdAt),
      updatedAt: firstString(accountRecord.updatedAt)
    }
  }
}

const normalizeDisconnect = (payload: unknown): GitHubDisconnectResponse => {
  const record = toRecord(unwrapResponse(payload))

  return {
    connected: false,
    githubLogoutUrl: firstString(record.githubLogoutUrl, record.logoutUrl, record.github_logout_url) ?? DEFAULT_GITHUB_LOGOUT_URL,
    note: firstString(record.note, record.message)
  }
}

export const githubApi = {
  async getConnectUrl(params?: { forceAccountSelection?: boolean; redirectUrl?: string }) {
    const response = await apiClient.get('/github/connect', { params })
    return unwrapResponse<{
      authorizeUrl?: string
      authorizationUrl?: string
      oauthUrl?: string
      connectUrl?: string
      url?: string
    }>(response.data)
  },

  async getOAuthUrl(params?: { forceAccountSelection?: boolean; redirectUrl?: string }) {
    return this.getConnectUrl(params)
  },

  async account(): Promise<GitHubAccountResponse> {
    try {
      const response = await apiClient.get('/github/account')
      return normalizeAccount(response.data)
    } catch (error) {
      if (!isNotFoundError(error)) throw error

      const fallbackResponse = await apiClient.get('/github/me')
      return normalizeAccount(fallbackResponse.data)
    }
  },

  async me() {
    return this.account()
  },

  async disconnect(): Promise<GitHubDisconnectResponse> {
    try {
      const response = await apiClient.delete('/github/account')
      return normalizeDisconnect(response.data)
    } catch (error) {
      if (!isNotFoundError(error)) throw error

      const fallbackResponse = await apiClient.delete('/github/disconnect')
      return normalizeDisconnect(fallbackResponse.data)
    }
  },

  async syncRepositories(params?: { includeForks?: boolean; sync?: boolean }) {
    const response = await apiClient.get('/github/repositories', { params })
    return unwrapResponse(response.data)
  },

  async getCachedRepositories() {
    const response = await apiClient.get('/github/repositories/cached')
    return unwrapResponse(response.data)
  },

  async getRepository(repoId: string) {
    const response = await apiClient.get(`/github/repositories/${repoId}`)
    return unwrapResponse(response.data)
  },

  async syncPackages(repoId: string) {
    const response = await apiClient.get(`/github/repositories/${repoId}/packages`)
    return unwrapResponse(response.data)
  },

  async getCachedPackages(repoId: string) {
    const response = await apiClient.get(`/github/repositories/${repoId}/packages/cached`)
    return unwrapResponse(response.data)
  },

  async syncCommits(repoId: string, params?: { perPage?: number; includeStats?: boolean }) {
    const response = await apiClient.get(`/github/repositories/${repoId}/commits`, { params })
    return unwrapResponse(response.data)
  },

  async getCachedCommits(repoId: string) {
    const response = await apiClient.get(`/github/repositories/${repoId}/commits/cached`)
    return unwrapResponse(response.data)
  }
}
