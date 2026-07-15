import { create } from 'zustand'
import axios from 'axios'
import { roadmapService, type GenerateRoadmapOptions, type RoadmapListParams } from '../services/roadmapService'
import type { AIRecommendation, LearningNodeStatus, Roadmap, RoadmapFilters, RoadmapProgressRecord, SkillProgress, UserLearningStats } from '../types'
import { getApiErrorMessage } from '../../../app/services/apis/core'

const getRoadmapGenerationErrorMessage = (error: unknown) => {
  const rawMessage = getApiErrorMessage(error)
  const status = (error as { response?: { status?: number } })?.response?.status
  const normalizedMessage = rawMessage.toLowerCase()

  if (status === 502 || rawMessage.includes('502') || normalizedMessage.includes('bad gateway')) {
    return 'Hệ thống tạo lộ trình đang bận nên chưa hoàn tất yêu cầu. Vui lòng thử lại sau vài phút, hoặc chọn ít dự án hơn để nhận kết quả nhanh hơn.'
  }
  if (normalizedMessage.includes('dev2vec_analysis_required')) {
    return 'Cần phân tích dự án trước khi tạo lộ trình cá nhân hóa.'
  }
  if (normalizedMessage.includes('dev2vec_model_unavailable')) {
    return 'Tính năng gợi ý lộ trình đang tạm thời chưa sẵn sàng. Vui lòng thử lại sau.'
  }
  if (normalizedMessage.includes('dev2vec_inference_failed') || normalizedMessage.includes('dev2vec_invalid_output')) {
    return 'Chưa thể tạo lộ trình từ dữ liệu phân tích hiện tại. Bạn có thể thử phân tích lại dự án rồi tạo lộ trình mới.'
  }

  return rawMessage || 'Không thể tạo lộ trình lúc này.'
}

interface RoadmapState {
  roadmaps: Roadmap[]
  aiRecommendation: AIRecommendation | null
  skillProgress: SkillProgress[]
  learningStats: UserLearningStats
  filters: RoadmapFilters
  isLoading: boolean
  isGenerating: boolean
  error: string | null
  fetchRoadmaps: (params?: RoadmapListParams) => Promise<void>
  fetchRoadmapDetail: (idOrSlug: string) => Promise<Roadmap | undefined>
  generateAIRoadmap: (targetRole?: string, options?: GenerateRoadmapOptions | boolean, repoId?: string) => Promise<AIRecommendation | null>
  archiveRoadmap: (roadmapId: string) => Promise<void>
  deleteRoadmap: (roadmapId: string) => Promise<void>
  resetRoadmapProgress: (roadmapId: string) => Promise<void>
  updateSkillProgress: (roadmapId: string, skillName: string, status: 'not_started' | 'in_progress' | 'completed' | string) => Promise<void>
  setFilters: (filters: Partial<RoadmapFilters>) => void
  getRoadmapById: (idOrSlug: string) => Roadmap | undefined
  updateNodeStatus: (roadmapId: string, nodeId: string, status: LearningNodeStatus) => Promise<void>
  toggleBookmark: (roadmapId: string, nodeId: string) => void
  reset: () => void
}

const emptyLearningStats: UserLearningStats = {
  activeRoadmapIds: [],
  completedRoadmaps: 0,
  completedNodes: 0,
  totalNodes: 0,
  totalXp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  weeklyGoalHours: 0,
  weeklyHoursCompleted: 0,
  dailyGoalMinutes: 0,
  bookmarkedNodeIds: [],
  achievements: []
}

const getRoadmapNodes = (roadmap: Roadmap) => roadmap.modules.flatMap((module) => module.nodes)

const normalizeSkillKey = (value?: string) => (value ?? '').trim().toLowerCase()
const normalizeItemKey = (value?: string) => (value ?? '').trim()
const getNodeProgressSkill = (node: Roadmap['modules'][number]['nodes'][number]) =>
  node.canonicalSkillName || node.skillName || node.skills[0] || node.title

const getNodeProgressKeys = (node: Roadmap['modules'][number]['nodes'][number]) => {
  const primarySkill = getNodeProgressSkill(node)
  return [
    primarySkill,
    node.canonicalSkillName,
    node.skillName
  ].map(normalizeSkillKey).filter(Boolean)
}

const getNodeProgressItemId = (node: Roadmap['modules'][number]['nodes'][number]) =>
  node.itemId || node.id

const toBackendProgressStatus = (status: LearningNodeStatus) => {
  if (status === 'completed') return 'completed'
  if (status === 'in-progress' || status === 'unlocked') return 'in_progress'
  return 'not_started'
}

const toNodeStatus = (status: string, progressPercent: number): LearningNodeStatus => {
  if (status === 'completed' || progressPercent >= 100) return 'completed'
  if (status === 'in_progress' || progressPercent > 0) return 'in-progress'
  return 'locked'
}

const buildLearningStats = (roadmaps: Roadmap[], bookmarkedNodeIds: string[] = []): UserLearningStats => {
  const nodes = roadmaps.flatMap(getRoadmapNodes)
  const completedNodes = nodes.filter((node) => node.status === 'completed').length
  const activeRoadmapIds = roadmaps
    .filter((roadmap) => roadmap.progress > 0 && roadmap.progress < 100)
    .map((roadmap) => roadmap.id)

  return {
    ...emptyLearningStats,
    activeRoadmapIds,
    completedRoadmaps: roadmaps.filter((roadmap) => roadmap.progress >= 100).length,
    completedNodes,
    totalNodes: nodes.length,
    totalXp: completedNodes * 120,
    bookmarkedNodeIds
  }
}

const buildSkillProgress = (roadmaps: Roadmap[]): SkillProgress[] => {
  const skillCounts = new Map<string, { count: number; category: Roadmap['category'] }>()

  roadmaps.forEach((roadmap) => {
    roadmap.requiredSkills.forEach((skill) => {
      const current = skillCounts.get(skill)
      skillCounts.set(skill, {
        count: (current?.count ?? 0) + 1,
        category: current?.category ?? roadmap.category
      })
    })
  })

  return Array.from(skillCounts.entries()).slice(0, 8).map(([skill, value]) => ({
    id: skill,
    skill,
    category: value.category,
    current: Math.min(100, 35 + value.count * 15),
    target: 80,
    history: []
  }))
}

const updateRoadmapNode = (
  roadmap: Roadmap,
  nodeId: string,
  updater: (node: Roadmap['modules'][number]['nodes'][number]) => Roadmap['modules'][number]['nodes'][number]
) => ({
  ...roadmap,
  modules: roadmap.modules.map((module) => ({
    ...module,
    nodes: module.nodes.map((node) => (node.id === nodeId ? updater(node) : node))
  }))
})

const normalizeRoadmapProgress = (roadmap: Roadmap): Roadmap => {
  return {
    ...roadmap,
    modules: roadmap.modules.map((module) => ({
      ...module,
      nodes: module.nodes.map((node) => {
        if (node.status === 'completed') return node
        if (node.status === 'in-progress') return node
        return { ...node, status: 'unlocked' }
      })
    }))
  }
}

const applyRoadmapProgress = (roadmap: Roadmap, progress: RoadmapProgressRecord): Roadmap => {
  const mergedItems = (() => {
    const items = new Map<string, RoadmapProgressRecord['items'][number]>()
    ;(roadmap.progressItems ?? []).forEach((item) => {
      items.set(item.itemId ? `item:${normalizeItemKey(item.itemId)}` : `skill:${normalizeSkillKey(item.normalizedSkillName || item.skillName)}`, item)
    })
    progress.items.forEach((item) => {
      items.set(item.itemId ? `item:${normalizeItemKey(item.itemId)}` : `skill:${normalizeSkillKey(item.normalizedSkillName || item.skillName)}`, item)
    })
    return Array.from(items.values())
  })()
  const itemIdMap = new Map<string, RoadmapProgressRecord['items'][number]>()
  const itemMap = new Map<string, RoadmapProgressRecord['items'][number]>()
  mergedItems.forEach((item) => {
    if (item.itemId) itemIdMap.set(normalizeItemKey(item.itemId), item)
    itemMap.set(normalizeSkillKey(item.skillName), item)
    if (item.normalizedSkillName) itemMap.set(normalizeSkillKey(item.normalizedSkillName), item)
    if (item.canonicalSkillName) itemMap.set(normalizeSkillKey(item.canonicalSkillName), item)
  })

  return {
    ...roadmap,
    progressRecordId: progress.id || roadmap.progressRecordId,
    progress: Math.max(0, Math.min(100, Math.round(progress.overallProgress))),
    progressSummary: {
      ...roadmap.progressSummary,
      overallProgress: progress.overallProgress,
      totalItems: progress.items.length || roadmap.progressSummary?.totalItems,
      completedItems: progress.items.filter((item) => item.status === 'completed').length,
      inProgressItems: progress.items.filter((item) => item.status === 'in_progress').length
    },
    progressItems: mergedItems,
    modules: roadmap.modules.map((module) => ({
      ...module,
      nodes: module.nodes.map((node) => {
        const item = itemIdMap.get(normalizeItemKey(getNodeProgressItemId(node))) ??
          getNodeProgressKeys(node).map((key) => itemMap.get(key)).find(Boolean)

        if (!item) return node

        return {
          ...node,
          title: item.taskTitle || node.title,
          skillName: item.skillName || node.skillName,
          canonicalSkillName: item.canonicalSkillName || node.canonicalSkillName,
          category: item.category || node.category,
          targetRole: item.targetRole || node.targetRole,
          level: item.level || node.level,
          week: item.week ?? node.week,
          priority: item.priority ?? node.priority,
          skills: [
            item.canonicalSkillName || item.skillName,
            ...node.skills
          ].filter((skill, index, list): skill is string => Boolean(skill) && list.indexOf(skill) === index),
          status: toNodeStatus(item.status, item.progressPercent),
          progressPercent: item.progressPercent
        }
      })
    }))
  }
}

const hydrateRoadmapsProgress = async (roadmaps: Roadmap[]) => {
  const hydrated = await Promise.all(roadmaps.map(async (roadmap) => {
    try {
      const progress = await roadmapService.getRoadmapProgress(roadmap.id)
      return applyRoadmapProgress(roadmap, progress)
    } catch {
      return roadmap
    }
  }))

  return hydrated
}

const refreshDerivedState = (roadmaps: Roadmap[], bookmarkedNodeIds: string[] = []) => ({
  roadmaps: roadmaps.map(normalizeRoadmapProgress),
  skillProgress: buildSkillProgress(roadmaps.map(normalizeRoadmapProgress)),
  learningStats: buildLearningStats(roadmaps.map(normalizeRoadmapProgress), bookmarkedNodeIds)
})

const initialRoadmapState = {
  roadmaps: [],
  aiRecommendation: null,
  skillProgress: [],
  learningStats: emptyLearningStats,
  filters: {
    search: '',
    category: 'All' as const,
    difficulty: 'All' as const,
    duration: 'All' as const
  },
  isLoading: false,
  isGenerating: false,
  error: null
}
export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  ...initialRoadmapState,

  fetchRoadmaps: async (params = { status: 'active' }) => {
    set({ isLoading: true, error: null })

    try {
      const roadmaps = await roadmapService.getRoadmaps(params)
      const hydratedRoadmaps = await hydrateRoadmapsProgress(roadmaps)
      set({
        ...refreshDerivedState(hydratedRoadmaps, get().learningStats.bookmarkedNodeIds),
        isLoading: false
      })
    } catch (error) {
      set({
        roadmaps: [],
        skillProgress: [],
        learningStats: emptyLearningStats,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Không thể tải roadmap của bạn.'
      })
    }
  },

  fetchRoadmapDetail: async (idOrSlug) => {
    const existingRoadmap = get().getRoadmapById(idOrSlug)
    if (existingRoadmap) return existingRoadmap

    set({ isLoading: true, error: null })

    try {
      const roadmap = await roadmapService.getRoadmapById(idOrSlug)

      if (!roadmap) {
        set({ isLoading: false })
        return undefined
      }

      const progress = await roadmapService.getRoadmapProgress(roadmap.id).catch(() => null)
      const hydratedRoadmap = progress ? applyRoadmapProgress(roadmap, progress) : roadmap
      const roadmaps = get().roadmaps.some((item) => item.id === hydratedRoadmap.id)
        ? get().roadmaps.map((item) => (item.id === hydratedRoadmap.id ? hydratedRoadmap : item))
        : [hydratedRoadmap, ...get().roadmaps]

      set({
        ...refreshDerivedState(roadmaps, get().learningStats.bookmarkedNodeIds),
        isLoading: false
      })

      return hydratedRoadmap
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Không thể tải chi tiết roadmap.'
      })
      return undefined
    }
  },

  generateAIRoadmap: async (targetRole, options = false, repoId) => {
    set({ isGenerating: true, error: null })

    try {
      const aiRecommendation = await roadmapService.generateAIRoadmap(targetRole, options, repoId)
      const progress = await roadmapService.getRoadmapProgress(aiRecommendation.roadmap.id).catch(() => null)
      const syncedRoadmap = progress ? applyRoadmapProgress(aiRecommendation.roadmap, progress) : aiRecommendation.roadmap
      const syncedRecommendation = { ...aiRecommendation, roadmap: syncedRoadmap }
      const roadmaps = get().roadmaps.some((roadmap) => roadmap.id === syncedRoadmap.id)
        ? get().roadmaps.map((roadmap) => (roadmap.id === syncedRoadmap.id ? syncedRoadmap : roadmap))
        : [syncedRoadmap, ...get().roadmaps]

      set({
        aiRecommendation: syncedRecommendation,
        ...refreshDerivedState(roadmaps, get().learningStats.bookmarkedNodeIds),
        isGenerating: false
      })

      return syncedRecommendation
    } catch (error) {
      set({
        isGenerating: false,
        error: getRoadmapGenerationErrorMessage(error)
      })
      return null
    }
  },

  archiveRoadmap: async (roadmapId) => {
    set({ isLoading: true, error: null })

    try {
      await roadmapService.archiveRoadmap(roadmapId)
      const roadmaps = get().roadmaps.filter((roadmap) => roadmap.id !== roadmapId)
      set({
        ...refreshDerivedState(roadmaps, get().learningStats.bookmarkedNodeIds),
        isLoading: false
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Không thể lưu trữ roadmap.'
      })
    }
  },

  deleteRoadmap: async (roadmapId) => {
    set({ isLoading: true, error: null })

    try {
      await roadmapService.deleteRoadmap(roadmapId)
      const roadmaps = get().roadmaps.filter((roadmap) => roadmap.id !== roadmapId && roadmap.slug !== roadmapId)
      set({
        ...refreshDerivedState(roadmaps, get().learningStats.bookmarkedNodeIds),
        isLoading: false
      })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const roadmaps = get().roadmaps.filter((roadmap) => roadmap.id !== roadmapId && roadmap.slug !== roadmapId)
        set({
          ...refreshDerivedState(roadmaps, get().learningStats.bookmarkedNodeIds),
          isLoading: false
        })
        return
      }

      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Khong the xoa roadmap.'
      })
      throw error
    }
  },

  resetRoadmapProgress: async (roadmapId) => {
    set({ error: null })

    try {
      const roadmap = get().getRoadmapById(roadmapId)
      if (!roadmap) return

      const progress = await roadmapService.resetRoadmapProgress(roadmap.id)
      const roadmaps = get().roadmaps.map((item) =>
        item.id === roadmap.id || item.slug === roadmapId
          ? applyRoadmapProgress(item, progress)
          : item
      )
      set(refreshDerivedState(roadmaps, get().learningStats.bookmarkedNodeIds))
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    }
  },

  updateSkillProgress: async (roadmapId, skillName, status) => {
    set({ error: null })

    const roadmap = get().getRoadmapById(roadmapId)
    if (!roadmap || !skillName) return

    try {
      const progress = await roadmapService.updateRoadmapProgressItem(roadmap.id, { skillName, status })
      const roadmaps = get().roadmaps.map((item) =>
        item.id === roadmap.id || item.slug === roadmapId
          ? applyRoadmapProgress(item, progress)
          : item
      )

      set(refreshDerivedState(roadmaps, get().learningStats.bookmarkedNodeIds))
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }))
  },

  getRoadmapById: (idOrSlug) =>
    get().roadmaps.find((roadmap) => roadmap.id === idOrSlug || roadmap.slug === idOrSlug),

  updateNodeStatus: async (roadmapId, nodeId, status) => {
    set({ error: null })

    const roadmap = get().getRoadmapById(roadmapId)
    const node = roadmap?.modules.flatMap((module) => module.nodes).find((item) => item.id === nodeId)
    const itemId = node ? getNodeProgressItemId(node) : ''
    const skillName = node ? getNodeProgressSkill(node) : ''

    if (!roadmap || !node || (!itemId && !skillName)) return

    try {
      const progress = await roadmapService.updateRoadmapProgressItem(roadmap.id, {
        ...(itemId ? { itemId } : { skillName }),
        status: toBackendProgressStatus(status)
      })
      const roadmaps = get().roadmaps.map((item) =>
        item.id === roadmap.id || item.slug === roadmapId
          ? applyRoadmapProgress(updateRoadmapNode(item, nodeId, (currentNode) => ({
            ...currentNode,
            status,
            progressPercent: status === 'completed' ? 100 : status === 'in-progress' ? Math.max(currentNode.progressPercent ?? 0, 1) : 0
          })), progress)
          : item
      )

      set(refreshDerivedState(roadmaps, get().learningStats.bookmarkedNodeIds))
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    }
  },

  reset: () => set(initialRoadmapState),

  toggleBookmark: (roadmapId, nodeId) => {
    set((state) => {
      const isBookmarked = state.learningStats.bookmarkedNodeIds.includes(nodeId)
      const bookmarkedNodeIds = isBookmarked
        ? state.learningStats.bookmarkedNodeIds.filter((id) => id !== nodeId)
        : [...state.learningStats.bookmarkedNodeIds, nodeId]
      const roadmaps = state.roadmaps.map((roadmap) =>
        roadmap.id === roadmapId || roadmap.slug === roadmapId
          ? updateRoadmapNode(roadmap, nodeId, (node) => ({ ...node, bookmarked: !node.bookmarked }))
          : roadmap
      )

      return refreshDerivedState(roadmaps, bookmarkedNodeIds)
    })
  }
}))
