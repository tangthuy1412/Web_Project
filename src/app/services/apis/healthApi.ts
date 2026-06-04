import { apiClient, unwrapResponse } from './apiClient'

export const healthApi = {
  async get() {
    const response = await apiClient.get('/health')
    return unwrapResponse(response.data)
  }
}
