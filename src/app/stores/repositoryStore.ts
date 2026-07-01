import { create } from 'zustand'
import type { AIFeedback, AnalysisResult, Repository } from '../types'
import { getApiErrorMessage } from '../services/apis/core'
import {
  aiFeedbackApi,
  analysisApi,
  githubApi,
  normalizeAnalyses,
  normalizeAnalysis,
  normalizeCommits,
  normalizeFiles,
  normalizeRepositories,
  normalizeRepository
} from '../services/apis/repositories'

type RepositoryState = {
  repositories: Repository[]
  analyses: AnalysisResult[]
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
  fetchAnalysis: (repoId: string) => Promise<AnalysisResult | null>
  fetchMyAnalyses: () => Promise<void>
  generateFeedback: (repoId: string) => Promise<AIFeedback>
  fetchFeedback: (repoId: string) => Promise<AIFeedback | null>
  fetchMyFeedbacks: () => Promise<void>
  getAnalysisById: (id: string) => AnalysisResult | undefined
  setSelectedRepository: (repo: Repository | null) => void
  clearError: () => void
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
  repositories: [],
  analyses: [],
  selectedRepository: null,
  packagesByRepoId: {},
  commitsByRepoId: {},
  feedbackByRepoId: {},
  isLoading: false,
  isAnalyzing: false,
  isGeneratingFeedback: false,
  error: null,

  fetchRepositories: async (sync = false) => {
    set({ isLoading: true, error: null })

    try {
      const payload = sync ? await githubApi.syncRepositories() : await githubApi.getCachedRepositories()
      set({ repositories: normalizeRepositories(payload), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },

  fetchRepository: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const payload = await githubApi.getRepository(id)
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
      const result = normalizeAnalysis(await analysisApi.analyzeRepository(id, { includeEvidence: true }))

      set((state) => ({
        analyses: [result, ...state.analyses.filter((analysis) => analysis.repositoryId !== id && analysis.id !== result.id)],
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
    try {
      const result = normalizeAnalysis(await analysisApi.getResult(repoId, { includeEvidence: true }))
      if (!result.id && !result.repositoryId) return null

      set((state) => ({
        analyses: [result, ...state.analyses.filter((analysis) => analysis.repositoryId !== repoId && analysis.id !== result.id)]
      }))
      return result
    } catch {
      return null
    }
  },

  fetchMyAnalyses: async () => {
    try {
      set({ analyses: normalizeAnalyses(await analysisApi.getMine()) })
    } catch {
      set({ analyses: [] })
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
      set({ isGeneratingFeedback: false, error: getApiErrorMessage(error) })
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
    try {
      const feedbacks = asFeedbackList(await aiFeedbackApi.getMine())
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

  setSelectedRepository: (repo) => set({ selectedRepository: repo }),

  clearError: () => set({ error: null })
}))
