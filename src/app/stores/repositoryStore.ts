import { create } from 'zustand'
import type { AIFeedback, AnalysisResult, Repository, RepositoryAnalysisState, RoleOption } from '../types'
import { getApiErrorMessage, getToken } from '../services/apis/core'
import {
  aiFeedbackApi,
  analysisApi,
  githubApi,
  normalizeAnalyses,
  normalizeAnalysis,
  normalizeRepositoryAnalysisState,
  normalizeRepositoryAnalysisStates,
  normalizeCommits,
  normalizeFiles,
  normalizeRepositories,
  normalizeRepository
} from '../services/apis/repositories'

type RepositoryState = {
  repositories: Repository[]
  analyses: AnalysisResult[]
  analysisStatesByRepoId: Record<string, RepositoryAnalysisState>
  analysisLoadingByRepoId: Record<string, boolean>
  analysisErrorsByRepoId: Record<string, string>
  selectedRoleOption: RoleOption | null
  selectedRepository: Repository | null
  packagesByRepoId: Record<string, unknown[]>
  commitsByRepoId: Record<string, unknown[]>
  feedbackByRepoId: Record<string, AIFeedback>
  isLoading: boolean
  isAnalyzing: boolean
  isGeneratingFeedback: boolean
  error: string | null
  fetchRepositories: (sync?: boolean) => Promise<void>
  fetchRepository: (id: string) => Promise<Repository | null>
  fetchPackages: (id: string, sync?: boolean) => Promise<void>
  fetchCommits: (id: string, sync?: boolean) => Promise<void>
  analyzeRepository: (id: string) => Promise<AnalysisResult>
  fetchAnalysis: (repoId: string) => Promise<RepositoryAnalysisState | null>
  fetchMyAnalyses: () => Promise<void>
  generateFeedback: (repoId: string) => Promise<AIFeedback>
  fetchFeedback: (repoId: string) => Promise<AIFeedback | null>
  fetchMyFeedbacks: () => Promise<void>
  getAnalysisById: (id: string) => AnalysisResult | undefined
  getAnalysisState: (repoId: string) => RepositoryAnalysisState | undefined
  setSelectedRoleOption: (option: RoleOption | null) => void
  setSelectedRepository: (repo: Repository | null) => void
  clearError: () => void
  reset: () => void
}

const toRecord = (payload: unknown) => {
  return payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
}

const pickFeedbackPayload = (payload: unknown): unknown => {
  const record = toRecord(payload)

  if (record.feedback !== undefined) return record.feedback
  if (record.aiFeedback !== undefined) return record.aiFeedback
  if (record.result !== undefined) return pickFeedbackPayload(record.result)
  if (record.data !== undefined) return pickFeedbackPayload(record.data)

  return payload
}

const asStringArray = (value: unknown) => {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

const asStringField = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value : undefined
}

const asReferenceId = (value: unknown) => {
  if (typeof value === 'string' && value.trim()) return value
  const record = toRecord(value)
  const id = record.id ?? record._id ?? record.repositoryId
  return typeof id === 'string' && id.trim() ? id : undefined
}

const asFeedback = (payload: unknown): AIFeedback => {
  const feedbackPayload = pickFeedbackPayload(payload)
  const record = toRecord(feedbackPayload)
  const freshness = toRecord(record.freshness)

  return {
    id: String(record.id ?? record._id ?? ''),
    repositoryId: asReferenceId(record.repositoryId ?? record.repoId),
    analysisSnapshotId: asReferenceId(record.analysisSnapshotId ?? record.snapshotId),
    githubRepoId: typeof record.githubRepoId === 'number' ? record.githubRepoId : undefined,
    repoName: asStringField(record.repoName),
    fullName: asStringField(record.fullName),
    projectType: asStringField(record.projectType),
    careerDirection: asStringField(record.careerDirection),
    createdAt: asStringField(record.createdAt),
    generatedAt: asStringField(record.generatedAt),
    summary: asStringField(record.summary),
    feedback: asStringField(record.feedback) ?? asStringField(record.content),
    strengthFeedback: asStringArray(record.strengthFeedback),
    weaknessFeedback: asStringArray(record.weaknessFeedback),
    learningAdvice: asStringField(record.learningAdvice),
    nextSteps: asStringArray(record.nextSteps),
    recommendedTopics: asStringArray(record.recommendedTopics),
    careerSuggestion: asStringField(record.careerSuggestion),
    portfolioAdvice: asStringField(record.portfolioAdvice),
    riskNotes: asStringArray(record.riskNotes),
    recommendations: asStringArray(record.recommendations),
    isStale: typeof record.isStale === 'boolean' ? record.isStale : typeof freshness.isStale === 'boolean' ? freshness.isStale : undefined,
    staleReason: asStringField(record.staleReason ?? freshness.staleReason),
    sourceModelVersion: asStringField(record.sourceModelVersion ?? freshness.sourceModelVersion),
    sourcePipelineVersion: asStringField(record.sourcePipelineVersion ?? freshness.sourcePipelineVersion),
    currentModelVersion: asStringField(record.currentModelVersion ?? freshness.currentModelVersion),
    currentPipelineVersion: asStringField(record.currentPipelineVersion ?? freshness.currentPipelineVersion),
    raw: feedbackPayload
  }
}

const hasFeedbackContent = (feedback: AIFeedback) =>
  Boolean(
    feedback.id ||
    feedback.summary ||
    feedback.feedback ||
    feedback.learningAdvice ||
    feedback.careerSuggestion ||
    feedback.portfolioAdvice ||
    feedback.strengthFeedback?.length ||
    feedback.weaknessFeedback?.length ||
    feedback.nextSteps?.length ||
    feedback.recommendedTopics?.length ||
    feedback.riskNotes?.length ||
    feedback.recommendations?.length
  )

const emptyRepositoryState = {
  repositories: [],
  analyses: [],
  analysisStatesByRepoId: {},
  analysisLoadingByRepoId: {},
  analysisErrorsByRepoId: {},
  selectedRoleOption: null,
  selectedRepository: null,
  packagesByRepoId: {},
  commitsByRepoId: {},
  feedbackByRepoId: {},
  isLoading: false,
  isAnalyzing: false,
  isGeneratingFeedback: false,
  error: null
}

const isSameAuthSession = (token: string | null) => token === getToken()

const asFeedbackList = (payload: unknown) => {
  const record = toRecord(payload)
  const data = toRecord(record.data ?? payload)
  const list = Array.isArray(data.feedbacks)
    ? data.feedbacks
    : Array.isArray(record.feedbacks)
      ? record.feedbacks
      : Array.isArray(payload)
        ? payload
        : []

  return list.map(asFeedback)
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  ...emptyRepositoryState,

  fetchRepositories: async (sync = false) => {
    const requestToken = getToken()
    set({ isLoading: true, error: null })

    try {
      const payload = sync ? await githubApi.syncRepositories() : await githubApi.getCachedRepositories()
      if (!isSameAuthSession(requestToken)) return
      set({ repositories: normalizeRepositories(payload), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  fetchRepository: async (id) => {
    const requestToken = getToken()
    set({ isLoading: true, error: null })

    try {
      const payload = await githubApi.getRepository(id)
      if (!isSameAuthSession(requestToken)) return null
      const repository = normalizeRepository(payload)
      set((state) => ({
        selectedRepository: repository,
        repositories: state.repositories.some((repo) => repo.id === repository.id)
          ? state.repositories.map((repo) => repo.id === repository.id ? repository : repo)
          : [repository, ...state.repositories],
        isLoading: false
      }))
      return repository
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      return null
    }
  },

  fetchPackages: async (id, sync = false) => {
    try {
      const payload = sync ? await githubApi.syncPackages(id) : await githubApi.getCachedPackages(id)
      set((state) => ({
        packagesByRepoId: { ...state.packagesByRepoId, [id]: normalizeFiles(payload) }
      }))
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
      throw error
    }
  },

  fetchCommits: async (id, sync = false) => {
    try {
      const payload = sync ? await githubApi.syncCommits(id) : await githubApi.getCachedCommits(id)
      set((state) => ({
        commitsByRepoId: { ...state.commitsByRepoId, [id]: normalizeCommits(payload) }
      }))
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
      throw error
    }
  },

  analyzeRepository: async (id) => {
    set({ isAnalyzing: true, error: null })

    try {
      await Promise.allSettled([
        githubApi.syncPackages(id),
        githubApi.syncCommits(id)
      ])
      const normalizedResult = normalizeAnalysis(await analysisApi.analyzeRepository(id, { includeEvidence: true }))
      const result = { ...normalizedResult, repositoryId: normalizedResult.repositoryId || id }
      const analysisState: RepositoryAnalysisState = {
        analysisStatus: 'available',
        repositoryId: result.repositoryId || id,
        analysis: { ...result, repositoryId: result.repositoryId || id }
      }

      set((state) => ({
        analyses: [result, ...state.analyses.filter((analysis) => analysis.repositoryId !== id && analysis.id !== result.id)],
        analysisStatesByRepoId: { ...state.analysisStatesByRepoId, [id]: analysisState },
        analysisErrorsByRepoId: { ...state.analysisErrorsByRepoId, [id]: '' },
        repositories: state.repositories.map((repo) =>
          repo.id === id ? { ...repo, analyzed: true, analysisId: result.id } : repo
        ),
        selectedRepository: state.selectedRepository?.id === id
          ? { ...state.selectedRepository, analyzed: true, analysisId: result.id }
          : state.selectedRepository,
        isAnalyzing: false
      }))

      return result
    } catch (error) {
      set({ isAnalyzing: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  fetchAnalysis: async (repoId) => {
    set((state) => ({
      analysisLoadingByRepoId: { ...state.analysisLoadingByRepoId, [repoId]: true },
      analysisErrorsByRepoId: { ...state.analysisErrorsByRepoId, [repoId]: '' }
    }))
    try {
      const analysisState = normalizeRepositoryAnalysisState(
        await analysisApi.getResult(repoId, { includeEvidence: true }),
        repoId
      )

      set((state) => ({
        analysisStatesByRepoId: { ...state.analysisStatesByRepoId, [repoId]: analysisState },
        analysisLoadingByRepoId: { ...state.analysisLoadingByRepoId, [repoId]: false },
        analyses: analysisState.analysisStatus === 'available'
          ? [analysisState.analysis, ...state.analyses.filter((analysis) => analysis.repositoryId !== repoId && analysis.id !== analysisState.analysis.id)]
          : state.analyses.filter((analysis) => analysis.repositoryId !== repoId)
      }))
      return analysisState
    } catch (error) {
      set((state) => ({
        analysisLoadingByRepoId: { ...state.analysisLoadingByRepoId, [repoId]: false },
        analysisErrorsByRepoId: { ...state.analysisErrorsByRepoId, [repoId]: getApiErrorMessage(error) }
      }))
      return null
    }
  },

  fetchMyAnalyses: async () => {
    const requestToken = getToken()
    try {
      const payload = await analysisApi.getMine()
      const analysisStates = normalizeRepositoryAnalysisStates(payload)
      const analyses = analysisStates.length
        ? analysisStates
          .filter((item): item is Extract<RepositoryAnalysisState, { analysisStatus: 'available' }> => item.analysisStatus === 'available')
          .map((item) => item.analysis)
        : normalizeAnalyses(payload)
      if (!isSameAuthSession(requestToken)) return
      set((state) => ({
        analyses,
        analysisStatesByRepoId: analysisStates.reduce((acc, item) => {
          if (item.repositoryId) acc[item.repositoryId] = item
          return acc
        }, { ...state.analysisStatesByRepoId } as Record<string, RepositoryAnalysisState>)
      }))
    } catch {
      return
    }
  },

  generateFeedback: async (repoId) => {
    set({ isGeneratingFeedback: true, error: null })

    try {
      const feedback = asFeedback(await aiFeedbackApi.generate(repoId))
      const feedbackRepoId = feedback.repositoryId || repoId
      set((state) => ({
        feedbackByRepoId: { ...state.feedbackByRepoId, [feedbackRepoId]: { ...feedback, repositoryId: feedbackRepoId } },
        isGeneratingFeedback: false
      }))
      return { ...feedback, repositoryId: feedbackRepoId }
    } catch (error) {
      const rawMessage = getApiErrorMessage(error)
      const normalized = rawMessage.toLowerCase()
      const message = normalized.includes('analysis_required') || normalized.includes('incompatible_analysis_history')
        ? 'Cần phân tích lại repository trước khi tạo feedback mới.'
        : rawMessage
      set({ isGeneratingFeedback: false, error: message })
      throw error
    }
  },

  fetchFeedback: async (repoId) => {
    try {
      const feedback = asFeedback(await aiFeedbackApi.getResult(repoId))
      if (!hasFeedbackContent(feedback)) return null

      const feedbackRepoId = feedback.repositoryId || repoId
      set((state) => ({
        feedbackByRepoId: { ...state.feedbackByRepoId, [feedbackRepoId]: { ...feedback, repositoryId: feedbackRepoId } }
      }))
      return { ...feedback, repositoryId: feedbackRepoId }
    } catch {
      return null
    }
  },

  fetchMyFeedbacks: async () => {
    const requestToken = getToken()
    try {
      const feedbacks = asFeedbackList(await aiFeedbackApi.getMine())
      if (!isSameAuthSession(requestToken)) return
      set((state) => ({
        feedbackByRepoId: feedbacks.reduce(
          (acc, feedback) => {
            if (feedback.repositoryId && hasFeedbackContent(feedback)) acc[feedback.repositoryId] = feedback
            return acc
          },
          { ...state.feedbackByRepoId } as Record<string, AIFeedback>
        )
      }))
    } catch {
      return
    }
  },

  getAnalysisById: (id) => {
    return get().analyses.find((analysis) => analysis.id === id || analysis.repositoryId === id)
  },

  getAnalysisState: (repoId) => get().analysisStatesByRepoId[repoId],

  setSelectedRoleOption: (option) => set({ selectedRoleOption: option }),

  setSelectedRepository: (repo) => set({ selectedRepository: repo }),

  clearError: () => set({ error: null }),
  reset: () => set(emptyRepositoryState)
}))
