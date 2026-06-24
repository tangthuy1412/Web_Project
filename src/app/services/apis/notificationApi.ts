import { apiClient, unwrapResponse } from './apiClient'

export type NotificationQuery = {
  page?: number
  limit?: number
}

export type NotificationListResponse = {
  items?: unknown[]
  notifications?: unknown[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const notificationApi = {
  async getMine(params?: NotificationQuery) {
    const response = await apiClient.get('/notifications/me', { params })
    return unwrapResponse<NotificationListResponse>(response.data)
  },

  async markAsRead(notificationId: string) {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`)
    return unwrapResponse(response.data)
  },

  async remove(notificationId: string) {
    const response = await apiClient.delete(`/notifications/${notificationId}`)
    return unwrapResponse(response.data)
  }
}
