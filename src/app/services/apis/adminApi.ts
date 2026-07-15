import { apiClient, extractApiResource, unwrapResponse } from './apiClient'
import type { ChatMessage, ChatMode, ChatModeSource, ChatSessionStatus } from '../../types'

export type AdminUserStatus = 'active' | 'banned' | 'inactive'
export type AdminUserRole = 'admin' | 'student'

export type AdminQuery = {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
}

export type AdminUser = {
  _id: string
  id?: string
  fullName?: string
  name?: string
  email?: string
  avatar?: string
  avatarUrl?: string
  provider?: string
  githubUsername?: string
  role?: AdminUserRole | string
  status?: AdminUserStatus | string
  createdAt?: string
  updatedAt?: string
}

export type AdminPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type AdminDashboard = {
  users?: {
    total?: number
    active?: number
    banned?: number
  }
  github?: {
    repositories?: number
  }
  analysis?: {
    total?: number
  }
  aiFeedback?: {
    total?: number
  }
  roadmaps?: {
    active?: number
  }
  reports?: {
    pending?: number
  }
}

export type AdminUserListResponse = {
  items?: AdminUser[]
  pagination?: AdminPagination
}

export type AdminRoadmapStatus = 'active' | 'archived'

export type AdminRoadmapQuery = {
  page?: number
  limit?: number
  search?: string
  status?: string
  includeDeleted?: boolean
}

export type AdminRoadmapOwner = {
  _id?: string
  id?: string
  fullName?: string
  name?: string
  email?: string
  role?: string
  status?: string
}

export type AdminRoadmapRepository = {
  id?: string
  _id?: string
  name?: string
  fullName?: string
  htmlUrl?: string
  language?: string
}

export type AdminRoadmapTask = {
  itemId?: string
  _id?: string
  title?: string
  description?: string
  skillName?: string
  canonicalSkillName?: string
  category?: string
  priority?: string
  week?: number
  phase?: string
  progressPercent?: number
  startedAt?: string | null
  completedAt?: string | null
  skillTags?: string[]
  status?: string
  estimatedHours?: number
  resources?: unknown[]
}

export type AdminRoadmapPhase = {
  _id?: string
  title?: string
  goal?: string
  skills?: string[]
  tasks?: AdminRoadmapTask[]
  status?: string
}

export type AdminRoadmapPath = {
  _id?: string
  title?: string
  reason?: string
  phases?: AdminRoadmapPhase[]
  skills?: string[]
  suggestedTasks?: string[]
}

export type AdminRoadmapSourceContext = {
  repositoriesCount?: number
  detectedSkills?: string[]
  missingSkills?: string[]
  latestAnalysisSnapshotId?: string
}

export type AdminRoadmap = {
  _id: string
  id?: string
  roadmapId?: string
  title?: string
  userId?: AdminRoadmapOwner | string
  user?: AdminRoadmapOwner | null
  repository?: AdminRoadmapRepository | null
  repositoryId?: AdminRoadmapRepository | string | null
  targetRole?: string
  roleId?: string
  requestedLevel?: string
  effectiveLevel?: string
  durationWeeks?: number
  language?: string
  currentGithubDirection?: string
  summary?: string
  mainPath?: AdminRoadmapPath
  mainRoadmap?: AdminRoadmapPath
  supportingPaths?: AdminRoadmapPath[]
  alternativeRoadmaps?: AdminRoadmapPath[]
  roadmapSource?: Record<string, unknown>
  roleMatch?: Record<string, unknown>
  skillGapSummary?: unknown[]
  sourceContextSummary?: AdminRoadmapSourceContext
  progressSummary?: {
    totalItems?: number
    completedItems?: number
    inProgressItems?: number
    pendingItems?: number
    overallProgress?: number
  }
  learningProgress?: {
    currentTask?: AdminRoadmapTask | null
    recentlyCompleted?: AdminRoadmapTask[]
    nextRecommendedTask?: AdminRoadmapTask | null
    completedTasks?: AdminRoadmapTask[]
    inProgressTasks?: AdminRoadmapTask[]
    pendingTasks?: AdminRoadmapTask[]
    orphanProgressItems?: AdminRoadmapTask[]
    items?: AdminRoadmapTask[]
  }
  status?: AdminRoadmapStatus | string
  isDeleted?: boolean
  deletedAt?: string | null
  deletedBy?: string | null
  createdAt?: string
  updatedAt?: string
}

export type AdminRoadmapListResponse = {
  items?: AdminRoadmap[]
  pagination?: AdminPagination
}

export type AdminRepositoryQuery = {
  page?: number
  limit?: number
}

export type AdminRepositoryOwner = {
  _id?: string
  id?: string
  fullName?: string
  name?: string
  email?: string
  role?: string
  status?: string
}

export type AdminRepository = {
  _id: string
  id?: string
  userId?: AdminRepositoryOwner | string
  githubRepoId?: number
  githubAccountId?: string
  name?: string
  fullName?: string
  description?: string | null
  htmlUrl?: string
  language?: string | null
  defaultBranch?: string
  private?: boolean
  fork?: boolean
  forksCount?: number
  openIssuesCount?: number
  stargazersCount?: number
  size?: number
  topics?: string[]
  pushedAt?: string
  lastSyncedAt?: string
  updatedAtGithub?: string
  createdAt?: string
  updatedAt?: string
  rawData?: Record<string, unknown>
}

export type AdminRepositoryListResponse = {
  items?: AdminRepository[]
  pagination?: AdminPagination
}

export type AdminAdminEntityRef = {
  _id?: string
  id?: string
  fullName?: string
  name?: string
  email?: string
  role?: string
  status?: string
  htmlUrl?: string
  language?: string
  repoName?: string
  projectType?: string
  careerDirection?: string
  analyzedAt?: string
}

export type AdminAnalysisScores = {
  techStackScore?: number
  documentationScore?: number
  commitQualityScore?: number
  deploymentScore?: number
  testingScore?: number
  portfolioReadinessScore?: number
  overallScore?: number
}

export type AdminAnalysisCommitSummary = {
  totalCommits?: number
  activeDays?: number
  vagueCommitRatio?: number
  conventionalCommitRatio?: number
  firstCommitDate?: string
  lastCommitDate?: string
}

export type AdminAnalysisChecklist = {
  hasReadme?: boolean
  hasEnvExample?: boolean
  hasDocker?: boolean
  hasDockerCompose?: boolean
  hasCICD?: boolean
  hasTesting?: boolean
  hasLinting?: boolean
  hasFormatter?: boolean
  hasPackageFile?: boolean
}

export type AdminAnalysis = {
  _id: string
  id?: string
  userId?: AdminAdminEntityRef | string
  repositoryId?: AdminAdminEntityRef | string
  githubRepoId?: number
  repoName?: string
  fullName?: string
  projectType?: string
  languages?: string[]
  frameworks?: string[]
  packages?: string[]
  configs?: string[]
  skillSignals?: string[]
  careerSignals?: string[]
  careerDirection?: string
  strengths?: string[]
  weaknesses?: string[]
  missingSkills?: string[]
  recommendations?: string[]
  scores?: AdminAnalysisScores
  commitSummary?: AdminAnalysisCommitSummary
  checklist?: AdminAnalysisChecklist
  rawAnalysis?: Record<string, unknown>
  analyzedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type AdminAiFeedback = {
  _id: string
  id?: string
  userId?: AdminAdminEntityRef | string
  repositoryId?: AdminAdminEntityRef | string
  analysisSnapshotId?: AdminAdminEntityRef | string
  githubRepoId?: number
  repoName?: string
  fullName?: string
  projectType?: string
  careerDirection?: string
  summary?: string
  strengthFeedback?: string[]
  weaknessFeedback?: string[]
  learningAdvice?: string
  nextSteps?: string[]
  recommendedTopics?: string[]
  careerSuggestion?: string
  portfolioAdvice?: string
  riskNotes?: string[]
  rawAiResponse?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export type AdminAiFeedbackListResponse = {
  items?: AdminAiFeedback[]
  pagination?: AdminPagination
}

export type AdminAnalysisListResponse = {
  items?: AdminAnalysis[]
  pagination?: AdminPagination
}

export type AdminReportStatus = 'pending' | 'resolved' | 'rejected'

export type AdminReportQuery = {
  page?: number
  limit?: number
  status?: string
}

export type AdminReport = {
  _id: string
  id?: string
  reporterId?: AdminAdminEntityRef | string
  targetType?: 'repository' | string
  targetId?: string
  reason?: string
  description?: string
  status?: AdminReportStatus | string
  adminNote?: string
  resolvedBy?: AdminAdminEntityRef | string | null
  resolvedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export type AdminReportListResponse = {
  items?: AdminReport[]
  pagination?: AdminPagination
}

export type UpdateAdminReportStatusPayload = {
  status: AdminReportStatus
  adminNote?: string
}

export type AdminChatSettings = {
  mode: ChatMode
  aiEnabled?: boolean
  manualEnabled?: boolean
  updatedBy?: string | null
  updatedAt?: string
}

export type AdminChatUserRef = {
  _id?: string
  id?: string
  fullName?: string
  name?: string
  email?: string
  avatar?: string
  avatarUrl?: string
}

export type AdminChatSession = {
  _id: string
  id?: string
  title?: string
  user?: AdminChatUserRef
  userId?: AdminChatUserRef | string
  status?: ChatSessionStatus
  closedAt?: string
  closedBy?: string
  closeReason?: string
  mode?: ChatMode
  modeSource?: ChatModeSource
  effectiveMode?: ChatMode
  assignedAdminId?: AdminChatUserRef | string | null
  unreadByAdmin?: boolean
  unreadByUser?: boolean
  lastMessage?: ChatMessage
  lastMessageAt?: string
  manualReason?: string
  createdAt?: string
  updatedAt?: string
  messages?: ChatMessage[]
}

export type AdminChatSessionListResponse = {
  items?: AdminChatSession[]
  pagination?: AdminPagination
}

export type AdminChatSessionQuery = {
  status?: string
  mode?: string
  modeSource?: string
  userId?: string
  assignedAdminId?: string
  page?: number
  limit?: number
}

export type UpdateAdminChatModePayload = {
  mode: ChatMode
  reason?: string
}

export type SendAdminChatMessageResponse = {
  adminMessage?: ChatMessage
  session?: AdminChatSession
}

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

const normalizeAdminChatSessionDetail = (payload: unknown): AdminChatSession => {
  const data = asRecord(unwrapResponse<unknown>(payload))
  const session = asRecord(data.session ?? data.chatSession ?? data.item ?? data.detail ?? data)
  const messages = Array.isArray(data.messages)
    ? data.messages
    : Array.isArray(session.messages)
      ? session.messages
      : Array.isArray(data.chatMessages)
        ? data.chatMessages
        : []

  return {
    ...session,
    messages
  } as AdminChatSession
}

export const adminApi = {
  async getDashboard() {
    const response = await apiClient.get('/admin/dashboard')
    return unwrapResponse<AdminDashboard>(response.data)
  },

  async getUsers(params?: AdminQuery) {
    const response = await apiClient.get('/admin/users', { params })
    return unwrapResponse<AdminUserListResponse>(response.data)
  },

  async getUser(userId: string) {
    const response = await apiClient.get(`/admin/users/${userId}`)
    return unwrapResponse<AdminUser>(response.data)
  },

  async updateUserRole(userId: string, role: AdminUserRole) {
    const response = await apiClient.patch(`/admin/users/${userId}/role`, { role })
    return unwrapResponse<AdminUser>(response.data)
  },

  async updateUserStatus(userId: string, status: AdminUserStatus) {
    const response = await apiClient.patch(`/admin/users/${userId}/status`, { status })
    return unwrapResponse<AdminUser>(response.data)
  },

  async getRoadmaps(params?: AdminRoadmapQuery) {
    const response = await apiClient.get('/admin/roadmaps', { params })
    return unwrapResponse<AdminRoadmapListResponse>(response.data)
  },

  async getRoadmap(roadmapId: string, params?: Pick<AdminRoadmapQuery, 'includeDeleted'>) {
    const response = await apiClient.get(`/admin/roadmaps/${roadmapId}`, { params })
    return extractApiResource<AdminRoadmap>(response.data, ['roadmap', 'item', 'detail'])
  },

  async updateRoadmapStatus(roadmapId: string, status: AdminRoadmapStatus) {
    const response = await apiClient.patch(`/admin/roadmaps/${roadmapId}/status`, { status })
    return extractApiResource<AdminRoadmap>(response.data, ['roadmap', 'item', 'detail'])
  },

  async getRepositories(params?: AdminRepositoryQuery) {
    const response = await apiClient.get('/admin/github/repositories', { params })
    return extractApiResource<AdminRepositoryListResponse>(response.data, ['repositories'])
  },

  async getRepository(repoId: string) {
    const response = await apiClient.get(`/admin/github/repositories/${repoId}`)
    return extractApiResource<AdminRepository>(response.data, ['repository', 'repo', 'item', 'detail'])
  },

  async getAiFeedbacks(params?: AdminRepositoryQuery) {
    const response = await apiClient.get('/admin/ai-feedback', { params })
    return extractApiResource<AdminAiFeedbackListResponse>(response.data, ['aiFeedback', 'feedback'])
  },

  async getAiFeedback(feedbackId: string) {
    const response = await apiClient.get(`/admin/ai-feedback/${feedbackId}`)
    return extractApiResource<AdminAiFeedback>(response.data, ['aiFeedback', 'feedback', 'item', 'detail'])
  },

  async getAnalyses(params?: AdminRepositoryQuery) {
    const response = await apiClient.get('/admin/analysis', { params })
    return extractApiResource<AdminAnalysisListResponse>(response.data, ['analyses', 'analysisList'])
  },

  async getAnalysis(analysisId: string) {
    const response = await apiClient.get(`/admin/analysis/${analysisId}`)
    return extractApiResource<AdminAnalysis>(response.data, ['analysis', 'item', 'detail'])
  },

  async getReports(params?: AdminReportQuery) {
    const response = await apiClient.get('/admin/reports', { params })
    return extractApiResource<AdminReportListResponse>(response.data, ['reports'])
  },

  async getReport(reportId: string) {
    const response = await apiClient.get(`/admin/reports/${reportId}`)
    return extractApiResource<AdminReport>(response.data, ['report', 'item', 'detail'])
  },

  async updateReportStatus(reportId: string, payload: UpdateAdminReportStatusPayload) {
    const response = await apiClient.patch(`/admin/reports/${reportId}/status`, payload)
    return extractApiResource<AdminReport>(response.data, ['report', 'item', 'detail'])
  },

  async getChatSettings() {
    const response = await apiClient.get('/admin/chat/settings')
    return extractApiResource<AdminChatSettings>(response.data, ['settings', 'chatSettings'])
  },

  async updateChatSettings(mode: ChatMode) {
    const response = await apiClient.patch('/admin/chat/settings', { mode })
    return extractApiResource<AdminChatSettings>(response.data, ['settings', 'chatSettings'])
  },

  async getChatSessions(params?: AdminChatSessionQuery) {
    const response = await apiClient.get('/admin/chat/sessions', { params })
    return extractApiResource<AdminChatSessionListResponse>(response.data, ['sessions', 'chatSessions'])
  },

  async getChatSessionDetail(sessionId: string) {
    const response = await apiClient.get(`/admin/chat/sessions/${sessionId}`)
    return normalizeAdminChatSessionDetail(response.data)
  },

  async updateChatSessionMode(sessionId: string, payload: UpdateAdminChatModePayload) {
    const response = await apiClient.patch(`/admin/chat/sessions/${sessionId}/mode`, payload)
    return normalizeAdminChatSessionDetail(response.data)
  },

  async sendAdminChatMessage(sessionId: string, content: string) {
    const response = await apiClient.post(`/admin/chat/sessions/${sessionId}/messages`, { content })
    return unwrapResponse<SendAdminChatMessageResponse>(response.data)
  },

  async useGlobalChatMode(sessionId: string) {
    const response = await apiClient.patch(`/admin/chat/sessions/${sessionId}/use-global-mode`)
    return normalizeAdminChatSessionDetail(response.data)
  },

  async closeChatSession(sessionId: string, reason?: string) {
    const response = await apiClient.patch(`/admin/chat/sessions/${sessionId}/close`, reason ? { reason } : undefined)
    return normalizeAdminChatSessionDetail(response.data)
  }
}
