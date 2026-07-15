import { apiClient, unwrapResponse } from './apiClient'
import type { SendMessagePayload } from '../../types'

export const chatApi = {
  async createSession(title: string, context?: Partial<Omit<SendMessagePayload, 'message'>>) {
    const response = await apiClient.post('/chat/sessions', { title, ...context })
    return unwrapResponse(response.data)
  },

  async getSessions() {
    const response = await apiClient.get('/chat/sessions')
    return unwrapResponse(response.data)
  },

  async getSession(sessionId: string) {
    const response = await apiClient.get(`/chat/sessions/${sessionId}`)
    return unwrapResponse(response.data)
  },

  async sendMessage(sessionId: string, payload: string | SendMessagePayload) {
    const body = typeof payload === 'string' ? { message: payload } : payload
    const response = await apiClient.post(`/chat/sessions/${sessionId}/messages`, body)
    return unwrapResponse(response.data)
  }
}
