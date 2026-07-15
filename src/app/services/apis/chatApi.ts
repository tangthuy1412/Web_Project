import { apiClient, unwrapResponse } from './apiClient'
import type { CreateChatSessionPayload, SendMessagePayload } from '../../types'

export const chatApi = {
  async createSession(payload: string | CreateChatSessionPayload, context?: Partial<Omit<SendMessagePayload, 'message'>>) {
    const body = typeof payload === 'string' ? { title: payload, ...context } : payload
    const response = await apiClient.post('/chat/sessions', body)
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
  },

  async deleteSession(sessionId: string) {
    const response = await apiClient.delete(`/chat/sessions/${sessionId}`)
    return unwrapResponse(response.data)
  }
}
