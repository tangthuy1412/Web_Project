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
  status: 'idle' | 'loading' | 'generating' | 'ready' | 'error'
  currentLearningKey: string | null
  roadmapLearningItemsByKey: Record<string, RoadmapLearningItemResponse>
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
  status: 'idle' as const,
  currentLearningKey: null,
  roadmapLearningItemsByKey: {} as Record<string, RoadmapLearningItemResponse>,
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

const isMissingLearningContentError = (error: unknown) => {
  const status = (error as { response?: { status?: number; data?: unknown } })?.response?.status
  const message = getApiErrorMessage(error).toLowerCase()
  const payload = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
  const code = String(payload?.code ?? payload?.errorCode ?? payload?.error ?? '').toLowerCase()

  return status === 404 && (
    message.includes('learning content not found') ||
    message.includes('please generate it first') ||
    code.includes('learning_content_not_found') ||
    code.includes('content_missing')
  )
}

const itemKey = (roadmapId: string, itemId: string) => `${roadmapId}:${itemId}`

const getLearningItemId = (item: RoadmapLearningItemResponse | null | undefined) => {
  return item?.itemId || item?.task?.itemId || ''
}

const warnMismatchedLearningItem = (requestedItemId: string, responseItemId: string) => {
  if (import.meta.env.DEV) {
    console.warn('[learningStore] Ignored mismatched roadmap learning item response', {
      requestedItemId,
      responseItemId
    })
  }
}

const isLearningItemForRequest = (item: RoadmapLearningItemResponse, requestedItemId: string) => {
  const responseItemId = getLearningItemId(item)

  if (!responseItemId || responseItemId === requestedItemId) return true

  warnMismatchedLearningItem(requestedItemId, responseItemId)
  return false
}

export const useLearningStore = create<LearningState>((set, get) => ({
  ...initialState,

  fetchRoadmapLearning: async (roadmapId) => {
    set({ error: null })
    try {
      const roadmapLearning = await learningApi.getRoadmapLearning(roadmapId)
      set({ roadmapLearning })
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    }
  },

  fetchRoadmapItemContent: async (roadmapId, itemId) => {
    const key = itemKey(roadmapId, itemId)
    const cachedItem = get().roadmapLearningItemsByKey[key]

    set({
      currentLearningKey: key,
      isLoadingContent: !cachedItem,
      isGenerating: false,
      status: cachedItem ? 'ready' : 'loading',
      roadmapLearningItem: cachedItem ?? null,
      learningContent: cachedItem?.learning ?? null,
      resources: cachedItem?.learning.resources ?? [],
      error: null
    })

    try {
      const item = await learningApi.getRoadmapLearningItem(roadmapId, itemId)
      if (get().currentLearningKey !== key) return
      if (!isLearningItemForRequest(item, itemId)) {
        set({
          roadmapLearningItem: null,
          learningContent: null,
          resources: [],
          error: 'Nội dung học trả về không khớp task đang mở. Vui lòng tải lại roadmap.',
          status: 'error'
        })
        return
      }

      set({
        roadmapLearningItemsByKey: {
          ...get().roadmapLearningItemsByKey,
          [key]: item
        },
        roadmapLearningItem: item,
        learningContent: item.learning,
        resources: item.learning.resources ?? [],
        status: 'ready'
      })
    } catch (error) {
      if (!isMissingLearningContentError(error)) {
        if (get().currentLearningKey !== key) return
        set({
          error: isNotFoundError(error)
            ? 'Không tìm thấy task học. Vui lòng tải lại roadmap.'
            : getApiErrorMessage(error),
          status: 'error'
        })
        return
      }

      try {
        if (get().currentLearningKey !== key) return
        set({ isGenerating: true, status: 'generating' })
        const item = await learningApi.generateRoadmapLearningItem(roadmapId, itemId, {
          forceRegenerate: false,
          includeResources: true
        })
        if (get().currentLearningKey !== key) return
        if (!isLearningItemForRequest(item, itemId)) {
          set({
            roadmapLearningItem: null,
            learningContent: null,
            resources: [],
            error: 'Nội dung học trả về không khớp task đang mở. Vui lòng tải lại roadmap.',
            status: 'error'
          })
          return
        }

        set({
          roadmapLearningItemsByKey: {
            ...get().roadmapLearningItemsByKey,
            [key]: item
          },
          roadmapLearningItem: item,
          learningContent: item.learning,
          resources: item.learning.resources ?? [],
          error: null,
          status: 'ready'
        })
      } catch (generateError) {
        if (get().currentLearningKey !== key) return
        set({ error: getApiErrorMessage(generateError), status: 'error' })
      } finally {
        if (get().currentLearningKey === key) set({ isGenerating: false })
      }
    } finally {
      if (get().currentLearningKey === key) set({ isLoadingContent: false })
    }
  },

  generateRoadmapItemContent: async (roadmapId, itemId, data = {}) => {
    const key = itemKey(roadmapId, itemId)
    set({
      currentLearningKey: key,
      isGenerating: true,
      status: 'generating',
      error: null,
      roadmapLearningItem: null,
      learningContent: null,
      resources: []
    })
    try {
      const item = await learningApi.generateRoadmapLearningItem(roadmapId, itemId, {
        forceRegenerate: data.forceRegenerate ?? false,
        includeResources: data.includeResources ?? true
      })
      if (get().currentLearningKey !== key) return
      if (!isLearningItemForRequest(item, itemId)) {
        set({
          roadmapLearningItem: null,
          learningContent: null,
          resources: [],
          error: 'Nội dung học trả về không khớp task đang mở. Vui lòng tải lại roadmap.',
          status: 'error'
        })
        return
      }

      set({
        roadmapLearningItemsByKey: {
          ...get().roadmapLearningItemsByKey,
          [key]: item
        },
        roadmapLearningItem: item,
        learningContent: item.learning,
        resources: item.learning.resources ?? [],
        status: 'ready'
      })
    } catch (error) {
      if (get().currentLearningKey !== key) return
      set({ error: getApiErrorMessage(error), status: 'error' })
    } finally {
      if (get().currentLearningKey === key) set({ isGenerating: false })
    }
  },

  fetchSkillContent: async (skillName, params) => {
    set({ isLoadingContent: true, status: 'loading', error: null })
    try {
      const content = await learningApi.getLearningContent(skillName, params)
      set({ learningContent: content, status: 'ready' })
    } catch (error) {
      if (!isNotFoundError(error)) {
        set({ error: getApiErrorMessage(error), status: 'error' })
        return
      }

      try {
        set({ isGenerating: true, status: 'generating' })
        const content = await learningApi.generateLearningContent({
          skillName,
          ...params,
          forceRegenerate: false
        })
        set({ learningContent: content, error: null, status: 'ready' })
      } catch (generateError) {
        set({ error: getApiErrorMessage(generateError), status: 'error' })
      } finally {
        set({ isGenerating: false })
      }
    } finally {
      set({ isLoadingContent: false })
    }
  },

  generateSkillContent: async (data) => {
    set({ isGenerating: true, status: 'generating', error: null })
    try {
      const content = await learningApi.generateLearningContent(data)
      set({ learningContent: content, status: 'ready' })
    } catch (error) {
      set({ error: getApiErrorMessage(error), status: 'error' })
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
    set((state) => ({
      ...initialState,
      roadmapLearning: state.roadmapLearning,
      roadmapLearningItemsByKey: state.roadmapLearningItemsByKey
    }))
  }
}))
