import { apiClient, unwrapResponse } from './apiClient'

type AnalysisQueryParams = {
  includeEvidence?: boolean
}

export const analysisApi = {
  async analyzeRepository(repoId: string, params?: AnalysisQueryParams) {
    const response = await apiClient.post(`/analysis/repositories/${repoId}`, undefined, { params })
    return unwrapResponse(response.data)
  },

  async getResult(repoId: string, params?: AnalysisQueryParams): Promise<unknown> {
    const response = await apiClient.get(`/analysis/results/${repoId}`, { params })
    return unwrapResponse(response.data)
  },

  async getMine(): Promise<unknown> {
    const response = await apiClient.get('/analysis/me')
    return unwrapResponse(response.data)
  }
}
