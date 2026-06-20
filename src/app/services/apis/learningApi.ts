import { apiClient, unwrapResponse } from './apiClient'

export interface LearningExample {
  title: string
  code: string
  explanation: string
}

export interface LearningExercise {
  title: string
  description: string
}

export interface LearningContent {
  skillName: string
  targetRole: string
  level: string
  language: string
  title: string
  overview: string
  whyLearn: string
  useCases: string[]
  howToApply: string
  examples: LearningExample[]
  checklist: string[]
  exercises: LearningExercise[]
  commonMistakes: string[]
  nextSkills: string[]
}

export interface LearningResource {
  id?: string
  _id?: string
  skillName?: string
  targetRole: string
  level: string
  language: string
  type: string
  title: string
  url: string
  provider: string
  thumbnailUrl?: string
  channelTitle?: string
  source?: string
  score?: number
  tags?: string[]
}

export const learningApi = {
  async getLearningContent(
    skillName: string,
    params: { targetRole: string; level: string; language?: string }
  ): Promise<LearningContent> {
    const response = await apiClient.get(`/learning/skills/${skillName}`, { params })
    return unwrapResponse<LearningContent>(response.data)
  },

  async generateLearningContent(data: {
    skillName: string
    targetRole: string
    level: string
    language?: string
    forceRegenerate?: boolean
  }): Promise<LearningContent> {
    const response = await apiClient.post('/learning/skills/generate', data)
    return unwrapResponse<LearningContent>(response.data)
  },

  async getLearningResources(
    skillName: string,
    params: { targetRole: string; level: string; language?: string; type?: string }
  ): Promise<LearningResource[]> {
    const response = await apiClient.get(`/learning/skills/${skillName}/resources`, { params })
    return unwrapResponse<LearningResource[]>(response.data)
  },

  async searchAndCacheResources(
    skillName: string,
    data: { targetRole: string; level: string; language?: string }
  ): Promise<LearningResource[]> {
    const response = await apiClient.post(`/learning/skills/${skillName}/resources/search`, data)
    return unwrapResponse<LearningResource[]>(response.data)
  },

  async seedLearningResource(
    skillName: string,
    resource: Partial<LearningResource>
  ): Promise<LearningResource> {
    const response = await apiClient.post(`/learning/skills/${skillName}/resources`, resource)
    return unwrapResponse<LearningResource>(response.data)
  }
}
