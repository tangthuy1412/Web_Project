import { create } from 'zustand'
import {
  learningApi,
  type LearningContent,
  type LearningResource
} from '../../../app/services/apis/learning'
import { getApiErrorMessage } from '../../../app/services/apis/core'

export interface LearningState {
  learningContent: LearningContent | null
  resources: LearningResource[]
  isLoadingContent: boolean
  isGenerating: boolean
  isLoadingResources: boolean
  error: string | null

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
  resources: [],
  isLoadingContent: false,
  isGenerating: false,
  isLoadingResources: false,
  error: null
}

export const useLearningStore = create<LearningState>((set) => ({
  ...initialState,

  fetchSkillContent: async (skillName, params) => {
    set({ isLoadingContent: true, error: null })
    try {
      const content = await learningApi.getLearningContent(skillName, params)
      set({ learningContent: content })
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
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
      const resources = await learningApi.getLearningResources(skillName, params)
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
