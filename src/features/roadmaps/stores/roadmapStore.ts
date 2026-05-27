import { create } from 'zustand'
import { mockAIRecommendation, mockLearningStats, mockRoadmaps, mockSkillProgress } from '../mock/roadmapData'
import { roadmapService } from '../services/roadmapService'
import type { AIRecommendation, LearningNodeStatus, Roadmap, RoadmapFilters, SkillProgress, UserLearningStats } from '../types'

interface RoadmapState {
  roadmaps: Roadmap[]
  aiRecommendation: AIRecommendation | null
  skillProgress: SkillProgress[]
  learningStats: UserLearningStats
  filters: RoadmapFilters
  isLoading: boolean
  isGenerating: boolean
  fetchRoadmaps: () => Promise<void>
  generateAIRoadmap: () => Promise<void>
  setFilters: (filters: Partial<RoadmapFilters>) => void
  getRoadmapById: (idOrSlug: string) => Roadmap | undefined
  updateNodeStatus: (roadmapId: string, nodeId: string, status: LearningNodeStatus) => void
  toggleBookmark: (roadmapId: string, nodeId: string) => void
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

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  roadmaps: mockRoadmaps,
  aiRecommendation: mockAIRecommendation,
  skillProgress: mockSkillProgress,
  learningStats: mockLearningStats,
  filters: {
    search: '',
    category: 'All',
    difficulty: 'All',
    duration: 'All'
  },
  isLoading: false,
  isGenerating: false,

  fetchRoadmaps: async () => {
    set({ isLoading: true })
    const [roadmaps, skillProgress, learningStats] = await Promise.all([
      roadmapService.getRoadmaps(),
      roadmapService.getSkillProgress(),
      roadmapService.getLearningStats()
    ])
    set({ roadmaps, skillProgress, learningStats, isLoading: false })
  },

  generateAIRoadmap: async () => {
    set({ isGenerating: true })
    const aiRecommendation = await roadmapService.generateAIRoadmap()
    set((state) => ({
      aiRecommendation,
      roadmaps: state.roadmaps.some((roadmap) => roadmap.id === aiRecommendation.roadmap.id)
        ? state.roadmaps
        : [aiRecommendation.roadmap, ...state.roadmaps],
      isGenerating: false
    }))
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }))
  },

  getRoadmapById: (idOrSlug) =>
    get().roadmaps.find((roadmap) => roadmap.id === idOrSlug || roadmap.slug === idOrSlug),

  updateNodeStatus: (roadmapId, nodeId, status) => {
    set((state) => ({
      roadmaps: state.roadmaps.map((roadmap) =>
        roadmap.id === roadmapId || roadmap.slug === roadmapId
          ? updateRoadmapNode(roadmap, nodeId, (node) => ({ ...node, status }))
          : roadmap
      ),
      learningStats: {
        ...state.learningStats,
        completedNodes:
          status === 'completed'
            ? state.learningStats.completedNodes + 1
            : Math.max(0, state.learningStats.completedNodes - 1),
        totalXp:
          status === 'completed'
            ? state.learningStats.totalXp + 120
            : Math.max(0, state.learningStats.totalXp - 120)
      }
    }))
  },

  toggleBookmark: (roadmapId, nodeId) => {
    set((state) => {
      const isBookmarked = state.learningStats.bookmarkedNodeIds.includes(nodeId)

      return {
        roadmaps: state.roadmaps.map((roadmap) =>
          roadmap.id === roadmapId || roadmap.slug === roadmapId
            ? updateRoadmapNode(roadmap, nodeId, (node) => ({ ...node, bookmarked: !node.bookmarked }))
            : roadmap
        ),
        learningStats: {
          ...state.learningStats,
          bookmarkedNodeIds: isBookmarked
            ? state.learningStats.bookmarkedNodeIds.filter((id) => id !== nodeId)
            : [...state.learningStats.bookmarkedNodeIds, nodeId]
        }
      }
    })
  }
}))
