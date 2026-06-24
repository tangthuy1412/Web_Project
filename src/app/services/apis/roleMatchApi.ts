import type { RepositoryRoleMatches, RoleCatalogItem, SkillCatalogItem } from '../../types'
import { apiClient, unwrapResponse } from './apiClient'

type CatalogResponse<T> = {
  total: number
  items: T[]
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
  async getRepositoryRoleMatches(repositoryId: string): Promise<RepositoryRoleMatches> {
    const response = await apiClient.get(`/analysis/repositories/${repositoryId}/role-matches`)
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
