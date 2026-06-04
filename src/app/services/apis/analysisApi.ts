import { apiClient, unwrapResponse } from './apiClient'

export const analysisApi = {
  async analyzeRepository(repoId: string) {
    const response = await apiClient.post(`/analysis/repositories/${repoId}`)
    return unwrapResponse(response.data)
  },

  async getResult(repoId: string) {
    const response = await apiClient.get(`/analysis/results/${repoId}`)
    return unwrapResponse(response.data)
  },

  async getMine() {
    const response = await apiClient.get('/analysis/me')
    return unwrapResponse(response.data)
  }
}
