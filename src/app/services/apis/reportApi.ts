import { extractApiResource, apiClient } from './apiClient'

export type ReportTargetType = 'repository'

export type CreateReportPayload = {
  targetType: ReportTargetType
  targetId: string
  reason: string
  description: string
}

export type Report = {
  _id: string
  id?: string
  reporterId?: string
  targetType?: ReportTargetType | string
  targetId?: string
  reason?: string
  description?: string
  status?: 'pending' | 'resolved' | 'rejected' | string
  adminNote?: string
  resolvedBy?: string | null
  resolvedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export const reportApi = {
  async createReport(payload: CreateReportPayload) {
    const response = await apiClient.post('/reports', payload)
    return extractApiResource<Report>(response.data, ['report'])
  }
}
