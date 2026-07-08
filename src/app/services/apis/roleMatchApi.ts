import type { RepositoryRoleMatches, RoleCatalogItem, RoleMatch, SkillCatalogItem } from '../../types'
import { apiClient, unwrapResponse } from './apiClient'

type CatalogResponse<T> = {
  total: number
  items: T[]
}

type RoleMatchParams = {
  limit?: number
  targetRole?: string
  includeDetails?: boolean
}

type RoleMatchSourceBody = {
  sourceMode: 'single_repo' | 'selected_repos' | 'all_analyzed_repos'
  repoId?: string
  repoIds?: string[]
  limit?: number
  includeDetails?: boolean
}

type RoleMatchesResponse = {
  sourceMode?: string
  analysisSource?: {
    type?: string
    sourceMode?: string
    totalRepositories?: number
    totalUserCommits?: number
    userLevel?: string
    userReadinessScore?: number
    repositoryNames?: string[]
    contextSource?: string
    modelVersion?: string
    scoringMethod?: string
    vectorSources?: string[]
    sourceStats?: Record<string, unknown>
  }
  repositoryId?: string
  repoName?: string
  fullName?: string
  analyzedAt?: string
  topRole?: Pick<RoleMatch, 'roleId' | 'roleName' | 'matchScore' | 'matchLevel' | 'matchLevelLabel'>
  matches: RoleMatch[]
}

const asRecord = (value: unknown) => value && typeof value === 'object'
  ? value as Record<string, unknown>
  : {}

const normalizeCatalog = <T>(payload: unknown, key: string): CatalogResponse<T> => {
  const data = asRecord(unwrapResponse<unknown>(payload))
  const items = Array.isArray(data[key]) ? data[key] as T[] : []

  return {
    total: typeof data.total === 'number' ? data.total : items.length,
    items
  }
}

export const roleMatchApi = {
  async calculateRoleMatches(body: RoleMatchSourceBody): Promise<RoleMatchesResponse> {
    const response = await apiClient.post('/analysis/role-matches', { ...body, limit: 3 })
    return unwrapResponse<RoleMatchesResponse>(response.data)
  },

  async getRepositoryRoleMatches(repositoryId: string, params: RoleMatchParams = { limit: 3, includeDetails: true }): Promise<RepositoryRoleMatches> {
    const response = await apiClient.get(`/analysis/repositories/${repositoryId}/role-matches`, { params })
    return unwrapResponse<RepositoryRoleMatches>(response.data)
  },

  async getRoleCatalog(): Promise<CatalogResponse<RoleCatalogItem>> {
    const response = await apiClient.get('/roles/catalog')
    return normalizeCatalog<RoleCatalogItem>(response.data, 'roles')
  },

  async getSkillCatalog(): Promise<CatalogResponse<SkillCatalogItem>> {
    const response = await apiClient.get('/skills/catalog')
    return normalizeCatalog<SkillCatalogItem>(response.data, 'skills')
  }
}


