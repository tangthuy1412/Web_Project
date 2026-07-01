import { create } from 'zustand'
import {
  learningApi,
  type LearningContent,
  type LearningResource,
  type RoadmapLearningItemResponse,
  type RoadmapLearningListResponse
} from '../../../app/services/apis/learning'
import { getApiErrorMessage } from '../../../app/services/apis/core'

export interface LearningState {
  learningContent: LearningContent | null
  roadmapLearning: RoadmapLearningListResponse | null
  roadmapLearningItem: RoadmapLearningItemResponse | null
  resources: LearningResource[]
  isLoadingContent: boolean
  isGenerating: boolean
  isLoadingResources: boolean
  error: string | null

  fetchRoadmapLearning(roadmapId: string): Promise<void>
  fetchRoadmapItemContent(roadmapId: string, itemId: string): Promise<void>
  generateRoadmapItemContent(
    roadmapId: string,
    itemId: string,
    data?: { forceRegenerate?: boolean; includeResources?: boolean }
  ): Promise<void>
  fetchSkillContent(
    skillName: string,
    params: { targetRole: string; level: string; language?: string }
  ): Promise<void>
  generateSkillContent(data: {
    skillName: string
    targetRole: string
    level: string
    language?: string
    forceRegenerate?: boolean
  }): Promise<void>
  fetchSkillResources(
    skillName: string,
    params: { targetRole: string; level: string; language?: string; type?: string }
  ): Promise<void>
  searchSkillResources(
    skillName: string,
    data: { targetRole: string; level: string; language?: string }
  ): Promise<void>
  clearStore(): void
}

const initialState = {
  learningContent: null,
  roadmapLearning: null,
  roadmapLearningItem: null,
  resources: [],
  isLoadingContent: false,
  isGenerating: false,
  isLoadingResources: false,
  error: null
}

const isNotFoundError = (error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response?.status
  const message = getApiErrorMessage(error).toLowerCase()
  return status === 404 || message.includes('404') || message.includes('not found')
}

export const useLearningStore = create<LearningState>((set) => ({
  ...initialState,

  fetchRoadmapLearning: async (roadmapId) => {
    set({ isLoadingContent: true, error: null })
    try {
      const roadmapLearning = await learningApi.getRoadmapLearning(roadmapId)
      set({ roadmapLearning })
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    } finally {
      set({ isLoadingContent: false })
    }
  },

  fetchRoadmapItemContent: async (roadmapId, itemId) => {
    set({ isLoadingContent: true, error: null })
    try {
      const item = await learningApi.getRoadmapLearningItem(roadmapId, itemId)
      set({
        roadmapLearningItem: item,
        learningContent: item.learning,
        resources: item.learning.resources ?? []
      })
    } catch (error) {
      if (!isNotFoundError(error)) {
        set({ error: getApiErrorMessage(error) })
        return
      }

      try {
        set({ isGenerating: true })
        const item = await learningApi.generateRoadmapLearningItem(roadmapId, itemId, {
          forceRegenerate: false,
          includeResources: true
        })
        set({
          roadmapLearningItem: item,
          learningContent: item.learning,
          resources: item.learning.resources ?? [],
          error: null
        })
      } catch (generateError) {
        set({ error: getApiErrorMessage(generateError) })
      } finally {
        set({ isGenerating: false })
      }
    } finally {
      set({ isLoadingContent: false })
    }
  },

  generateRoadmapItemContent: async (roadmapId, itemId, data = {}) => {
    set({ isGenerating: true, error: null })
    try {
      const item = await learningApi.generateRoadmapLearningItem(roadmapId, itemId, {
        forceRegenerate: data.forceRegenerate ?? false,
        includeResources: data.includeResources ?? true
      })
      set({
        roadmapLearningItem: item,
        learningContent: item.learning,
        resources: item.learning.resources ?? []
      })
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    } finally {
      set({ isGenerating: false })
    }
  },

  fetchSkillContent: async (skillName, params) => {
    set({ isLoadingContent: true, error: null })
    try {
      const content = await learningApi.getLearningContent(skillName, params)
      set({ learningContent: content })
    } catch (error) {
      if (!isNotFoundError(error)) {
        set({ error: getApiErrorMessage(error) })
        return
      }

      try {
        set({ isGenerating: true })
        const content = await learningApi.generateLearningContent({
          skillName,
          ...params,
          forceRegenerate: false
        })
        set({ learningContent: content, error: null })
      } catch (generateError) {
        set({ error: getApiErrorMessage(generateError) })
      } finally {
        set({ isGenerating: false })
      }
    } finally {
      set({ isLoadingContent: false })
    }
  },

  generateSkillContent: async (data) => {
    set({ isGenerating: true, error: null })
    try {
      const content = await learningApi.generateLearningContent(data)
      set({ learningContent: content })
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    } finally {
      set({ isGenerating: false })
    }
  },

  fetchSkillResources: async (skillName, params) => {
    set({ isLoadingResources: true, error: null })
    try {
      const cachedResources = await learningApi.getLearningResources(skillName, params)
      const resources = cachedResources.length
        ? cachedResources
        : await learningApi.searchAndCacheResources(skillName, {
          targetRole: params.targetRole,
          level: params.level,
          language: params.language
        })
      set({ resources })
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    } finally {
      set({ isLoadingResources: false })
    }
  },

  searchSkillResources: async (skillName, data) => {
    set({ isLoadingResources: true, error: null })
    try {
      const resources = await learningApi.searchAndCacheResources(skillName, data)
      set({ resources })
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    } finally {
      set({ isLoadingResources: false })
    }
  },

  clearStore: () => {
    set(initialState)
  }
}))
