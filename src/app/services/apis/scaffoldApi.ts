import { apiClient, unwrapResponse } from './apiClient'

export const scaffoldApi = {
  async getRoadmaps() {
    const response = await apiClient.get('/roadmaps/me')
    return unwrapResponse(response.data)
  },

  async getProgress() {
    const response = await apiClient.get('/progress/me')
    return unwrapResponse(response.data)
  },

  async getRepository(repoId: string) {
    const response = await apiClient.get(`/repositories/${repoId}`)
    return unwrapResponse(response.data)
  },

  async analyzeWithAi(payload: unknown) {
    const response = await apiClient.post('/ai/analyze', payload)
    return unwrapResponse(response.data)
  }
}
