import type { RepositoryRoleMatches, RoleCatalogItem, RoleMatch, RoleOption, RoleSelection, RoleSelectionType, SkillCatalogItem } from '../../types'
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
  roleSelection?: RoleSelection
  primaryRole?: RoleOption
  additionalRoleOptions?: RoleOption[]
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

const stringValue = (value: unknown) => typeof value === 'string' ? value : ''
const stringList = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : []
const numberValue = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0

export const normalizeRoleOption = (payload: unknown, fallbackSelectionType?: RoleSelectionType): RoleOption => {
  const source = asRecord(payload)
  return {
    roleId: stringValue(source.roleId),
    roleName: stringValue(source.roleName),
    matchScore: numberValue(source.matchScore),
    matchLevel: stringValue(source.matchLevel) || undefined,
    matchLevelLabel: stringValue(source.matchLevelLabel) || undefined,
    sourceRepositoryId: stringValue(source.sourceRepositoryId) || undefined,
    sourceRepositoryName: stringValue(source.sourceRepositoryName) || undefined,
    sourceAnalysisId: stringValue(source.sourceAnalysisId) || undefined,
    sourceSnapshotId: stringValue(source.sourceSnapshotId) || undefined,
    selectionType: (stringValue(source.selectionType) || fallbackSelectionType) as RoleSelectionType | undefined,
    modelVersion: stringValue(source.modelVersion) || undefined,
    pipelineVersion: stringValue(source.pipelineVersion) || undefined,
    matchedSkillNames: stringList(source.matchedSkillNames ?? source.topMatchedSkills ?? source.matchedSkills),
    weakSkillNames: stringList(source.weakSkillNames ?? source.weakSkills),
    missingSkillNames: stringList(source.missingSkillNames ?? source.topMissingSkills ?? source.missingRequiredSkills),
    recommendedNextSkills: stringList(source.recommendedNextSkills)
  }
}

const uniqueRoleOptions = (options: RoleOption[], excludedRoleId?: string) => {
  const seen = new Set<string>(excludedRoleId ? [excludedRoleId] : [])
  return options.filter((option) => {
    if (!option.roleId || seen.has(option.roleId)) return false
    seen.add(option.roleId)
    return true
  })
}

export const normalizeRepositoryRoleMatches = (payload: unknown): RepositoryRoleMatches => {
  const data = asRecord(unwrapResponse<unknown>(payload))
  const selection = asRecord(data.roleSelection)
  const matches = Array.isArray(data.matches) ? data.matches as RoleMatch[] : []
  const legacyTopRole = data.topRole ?? matches[0]
  const primaryPayload = selection.primaryRole ?? data.primaryRole ?? legacyTopRole
  const normalizedPrimary = Object.keys(asRecord(primaryPayload)).length
    ? normalizeRoleOption(primaryPayload, 'current_repository_primary')
    : undefined
  const primaryRole = normalizedPrimary ? {
    ...normalizedPrimary,
    sourceRepositoryId: normalizedPrimary.sourceRepositoryId || stringValue(data.repositoryId) || undefined,
    sourceRepositoryName: normalizedPrimary.sourceRepositoryName || stringValue(data.fullName ?? data.repoName) || undefined,
    sourceAnalysisId: normalizedPrimary.sourceAnalysisId || stringValue(data.analysisId) || undefined,
    sourceSnapshotId: normalizedPrimary.sourceSnapshotId || stringValue(data.snapshotId) || undefined
  } : undefined
  const explicitAdditional = Array.isArray(selection.additionalRoleOptions)
    ? selection.additionalRoleOptions
    : Array.isArray(data.additionalRoleOptions)
      ? data.additionalRoleOptions
      : []
  const additionalRoleOptions = uniqueRoleOptions(
    explicitAdditional.map((option) => normalizeRoleOption(option, 'portfolio_repository_primary')),
    primaryRole?.roleId
  ).slice(0, 2)

  return {
    repositoryId: stringValue(data.repositoryId),
    repoName: stringValue(data.repoName),
    fullName: stringValue(data.fullName),
    analyzedAt: stringValue(data.analyzedAt),
    topRole: data.topRole as RepositoryRoleMatches['topRole'] ?? (primaryRole ? {
      roleId: primaryRole.roleId,
      roleName: primaryRole.roleName,
      matchScore: primaryRole.matchScore,
      matchLevel: primaryRole.matchLevel ?? '',
      matchLevelLabel: primaryRole.matchLevelLabel ?? ''
    } : undefined),
    matches,
    primaryRole,
    additionalRoleOptions,
    roleSelection: {
      primaryRole,
      additionalRoleOptions,
      aggregationMode: (stringValue(selection.aggregationMode ?? data.aggregationMode) || undefined) as RoleSelection['aggregationMode'],
      classifierInferencePerformed: typeof (selection.classifierInferencePerformed ?? data.classifierInferencePerformed) === 'boolean'
        ? (selection.classifierInferencePerformed ?? data.classifierInferencePerformed) as boolean
        : undefined,
      authoritativeScope: (stringValue(selection.authoritativeScope ?? data.authoritativeScope) || undefined) as RoleSelection['authoritativeScope'],
      sourceRepositoryCount: typeof (selection.sourceRepositoryCount ?? data.sourceRepositoryCount) === 'number'
        ? (selection.sourceRepositoryCount ?? data.sourceRepositoryCount) as number
        : undefined
    }
  }
}

export const roleMatchApi = {
  async calculateRoleMatches(body: RoleMatchSourceBody): Promise<RoleMatchesResponse> {
    const response = await apiClient.post('/analysis/role-matches', { ...body, limit: 3 })
    const raw = unwrapResponse<RoleMatchesResponse>(response.data)
    const normalized = normalizeRepositoryRoleMatches(raw)
    return { ...raw, ...normalized }
  },

  async getRepositoryRoleMatches(repositoryId: string, params: RoleMatchParams = { limit: 3, includeDetails: true }): Promise<RepositoryRoleMatches> {
    const response = await apiClient.get(`/analysis/repositories/${repositoryId}/role-matches`, { params })
    return normalizeRepositoryRoleMatches(response.data)
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


