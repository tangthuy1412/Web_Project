import { apiClient, unwrapResponse } from './apiClient'
import type { DashboardResponse } from '../../types'

const asRecord = (value: unknown) => value && typeof value === 'object' ? value as Record<string, unknown> : {}
const optionalNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined

const normalizeDashboard = (payload: unknown): DashboardResponse => {
  const source = asRecord(unwrapResponse<unknown>(payload))
  const snapshot = asRecord(source.currentSnapshot)
  return {
    dev2vecStatus: source.dev2vecStatus === 'current' ? 'current' : 'analysis_required',
    message: typeof source.message === 'string' ? source.message : undefined,
    modelVersion: typeof source.modelVersion === 'string' ? source.modelVersion : undefined,
    pipelineVersion: typeof source.pipelineVersion === 'string' ? source.pipelineVersion : undefined,
    totalRepositories: optionalNumber(source.totalRepositories ?? source.repositoryCount),
    analyzedRepositories: optionalNumber(source.analyzedRepositories ?? source.analysisCount),
    githubConnected: typeof source.githubConnected === 'boolean' ? source.githubConnected : undefined,
    overallScore: optionalNumber(source.overallScore ?? snapshot.overallScore),
    topRoles: Array.isArray(source.topRoles) ? source.topRoles.map((item) => {
      const role = asRecord(item)
      return { roleId: String(role.roleId ?? role.id ?? ''), roleName: String(role.roleName ?? role.name ?? ''), matchScore: optionalNumber(role.matchScore) }
    }).filter((role) => role.roleId && role.roleName) : [],
    currentSnapshot: Object.keys(snapshot).length ? snapshot as DashboardResponse['currentSnapshot'] : null,
    currentFeedback: source.currentFeedback && typeof source.currentFeedback === 'object' ? source.currentFeedback as DashboardResponse['currentFeedback'] : null,
    recentAnalyses: Array.isArray(source.recentAnalyses) ? source.recentAnalyses as DashboardResponse['recentAnalyses'] : []
  }
}

export const dashboardApi = {
  async me(): Promise<DashboardResponse> {
    const response = await apiClient.get('/dashboard/me')
    return normalizeDashboard(response.data)
  }
}
