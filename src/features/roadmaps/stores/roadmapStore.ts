import { create } from 'zustand'
import { roadmapService, type RoadmapListParams } from '../services/roadmapService'
import type { AIRecommendation, LearningNodeStatus, Roadmap, RoadmapFilters, SkillProgress, UserLearningStats } from '../types'
import { getApiErrorMessage } from '../../../app/services/apis/apiClient'

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
  generateAIRoadmap: (targetRole?: string, forceRegenerate?: boolean, repoId?: string) => Promise<AIRecommendation | null>
  archiveRoadmap: (roadmapId: string) => Promise<void>
  setFilters: (filters: Partial<RoadmapFilters>) => void
  getRoadmapById: (idOrSlug: string) => Roadmap | undefined
  updateNodeStatus: (roadmapId: string, nodeId: string, status: LearningNodeStatus) => void
  toggleBookmark: (roadmapId: string, nodeId: string) => void
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
  const orderedNodeIds = roadmap.modules.flatMap((module) => module.nodes.map((node) => node.id))
  const firstOpenNodeId = orderedNodeIds.find((nodeId) =>
    roadmap.modules.some((module) =>
      module.nodes.some((node) => node.id === nodeId && node.status !== 'completed')
    )
  )

  return {
    ...roadmap,
    modules: roadmap.modules.map((module) => ({
      ...module,
      nodes: module.nodes.map((node) => {
        if (node.status === 'completed') return node
        if (node.id === firstOpenNodeId) return { ...node, status: 'unlocked' }
        return { ...node, status: 'locked' }
      })
    }))
  }
}

const refreshDerivedState = (roadmaps: Roadmap[], bookmarkedNodeIds: string[] = []) => ({
  roadmaps: roadmaps.map(normalizeRoadmapProgress),
  skillProgress: buildSkillProgress(roadmaps.map(normalizeRoadmapProgress)),
  learningStats: buildLearningStats(roadmaps.map(normalizeRoadmapProgress), bookmarkedNodeIds)
})

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  roadmaps: [],
  aiRecommendation: null,
  skillProgress: [],
  learningStats: emptyLearningStats,
  filters: {
    search: '',
    category: 'All',
    difficulty: 'All',
    duration: 'All'
  },
  isLoading: false,
  isGenerating: false,
  error: null,

  fetchRoadmaps: async (params = { status: 'active' }) => {
    set({ isLoading: true, error: null })

    try {
      const roadmaps = await roadmapService.getRoadmaps(params)
      set({
        ...refreshDerivedState(roadmaps, get().learningStats.bookmarkedNodeIds),
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

      const roadmaps = get().roadmaps.some((item) => item.id === roadmap.id)
        ? get().roadmaps.map((item) => (item.id === roadmap.id ? roadmap : item))
        : [roadmap, ...get().roadmaps]

      set({
        ...refreshDerivedState(roadmaps, get().learningStats.bookmarkedNodeIds),
        isLoading: false
      })

      return roadmap
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Không thể tải chi tiết roadmap.'
      })
      return undefined
    }
  },

  generateAIRoadmap: async (targetRole, forceRegenerate = false, repoId) => {
    set({ isGenerating: true, error: null })

    try {
      const aiRecommendation = await roadmapService.generateAIRoadmap(targetRole, forceRegenerate, repoId)
      const roadmaps = get().roadmaps.some((roadmap) => roadmap.id === aiRecommendation.roadmap.id)
        ? get().roadmaps.map((roadmap) => (roadmap.id === aiRecommendation.roadmap.id ? aiRecommendation.roadmap : roadmap))
        : [aiRecommendation.roadmap, ...get().roadmaps]

      set({
        aiRecommendation,
        ...refreshDerivedState(roadmaps, get().learningStats.bookmarkedNodeIds),
        isGenerating: false
      })

      return aiRecommendation
    } catch (error) {
      set({
        isGenerating: false,
        error: getApiErrorMessage(error)
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

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }))
  },

  getRoadmapById: (idOrSlug) =>
    get().roadmaps.find((roadmap) => roadmap.id === idOrSlug || roadmap.slug === idOrSlug),

  updateNodeStatus: (roadmapId, nodeId, status) => {
    set((state) => {
      const roadmaps = state.roadmaps.map((roadmap) =>
        roadmap.id === roadmapId || roadmap.slug === roadmapId
          ? normalizeRoadmapProgress(updateRoadmapNode(roadmap, nodeId, (node) => ({ ...node, status })))
          : roadmap
      )

      return refreshDerivedState(roadmaps, state.learningStats.bookmarkedNodeIds)
    })
  },

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
