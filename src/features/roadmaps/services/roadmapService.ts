import { mockAIRecommendation, mockLearningStats, mockRoadmaps, mockSkillProgress } from '../mock/roadmapData'
import type { AIRecommendation, Roadmap, SkillProgress, UserLearningStats } from '../types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const roadmapService = {
  async getRoadmaps(): Promise<Roadmap[]> {
    await delay(350)
    return mockRoadmaps
  },

  async getRoadmapById(idOrSlug: string): Promise<Roadmap | undefined> {
    await delay(250)
    return mockRoadmaps.find((roadmap) => roadmap.id === idOrSlug || roadmap.slug === idOrSlug)
  },

  async generateAIRoadmap(): Promise<AIRecommendation> {
    await delay(900)
    return mockAIRecommendation
  },

  async getSkillProgress(): Promise<SkillProgress[]> {
    await delay(250)
    return mockSkillProgress
  },

  async getLearningStats(): Promise<UserLearningStats> {
    await delay(250)
    return mockLearningStats
  }
}
