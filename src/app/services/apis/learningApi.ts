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
  canonicalSkillName?: string
  requestedSkillName?: string
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
  resources?: LearningResource[]
}

export interface LearningResource {
  id?: string
  _id?: string
  skillName?: string
  targetRole: string
  level: string
  language: string
  type: string // 'video', 'article', 'docs', v.v.
  title: string
  url: string
  provider: string // 'YouTube', v.v.
  thumbnailUrl?: string
  channelTitle?: string
  publishedAt?: string
  source?: string // 'curated' | 'youtube_api'
  score?: number
  tags?: string[]
}

export interface RoadmapLearningListItem {
  itemId: string
  taskTitle?: string
  canonicalSkillName?: string
  skillName?: string
  targetRole?: string
  level?: string
  week?: number
  priority?: string
  learningStatus?: 'available' | 'missing' | string
}

export interface RoadmapLearningListResponse {
  roadmapId: string
  sourceMode?: string
  language?: string
  items: RoadmapLearningListItem[]
}

export interface RoadmapLearningItemResponse {
  roadmapId: string
  itemId: string
  task?: {
    itemId?: string
    title?: string
    description?: string
    skillName?: string
    canonicalSkillName?: string
    category?: string
    targetRole?: string
    level?: string
    priority?: string
    week?: number
    estimatedHours?: number
    status?: string
  }
  learning: LearningContent
  personalizedContext?: Record<string, unknown>
  progress?: Record<string, unknown>
}

const asRecord = (value: unknown) => value && typeof value === 'object'
  ? value as Record<string, unknown>
  : {}

const asString = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const asNumber = (value: unknown, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback
const asArray = (value: unknown) => Array.isArray(value) ? value : []
const asResourceArray = (value: unknown) => {
  if (Array.isArray(value)) return value

  const record = asRecord(value)
  if (Array.isArray(record.data)) return record.data
  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.resources)) return record.resources

  return []
}

const normalizeLearningContent = (payload: unknown): LearningContent => {
  const record = asRecord(payload)

  return {
    skillName: asString(record.skillName),
    canonicalSkillName: asString(record.canonicalSkillName) || undefined,
    requestedSkillName: asString(record.requestedSkillName) || undefined,
    targetRole: asString(record.targetRole),
    level: asString(record.level),
    language: asString(record.language, 'vi'),
    title: asString(record.title, asString(record.canonicalSkillName, asString(record.skillName, 'Bài học'))),
    overview: asString(record.overview),
    whyLearn: asString(record.whyLearn),
    useCases: asArray(record.useCases).map(String).filter(Boolean),
    howToApply: asString(record.howToApply),
    examples: asArray(record.examples).map((item, index) => {
      const example = asRecord(item)
      return {
        title: asString(example.title, `Ví dụ ${index + 1}`),
        code: asString(example.code),
        explanation: asString(example.explanation)
      }
    }),
    checklist: asArray(record.checklist).map(String).filter(Boolean),
    exercises: asArray(record.exercises).map((item, index) => {
      const exercise = asRecord(item)
      return {
        title: asString(exercise.title, `Bài tập ${index + 1}`),
        description: asString(exercise.description, asString(exercise.content))
      }
    }),
    commonMistakes: asArray(record.commonMistakes).map(String).filter(Boolean),
    nextSkills: asArray(record.nextSkills).map(String).filter(Boolean),
    resources: normalizeResourceList(record.resources)
  }
}

const normalizeResourceList = (items: unknown): LearningResource[] => {
  return asResourceArray(items).map((item, index) => {
    const record = asRecord(item)
    return {
      id: asString(record.id, asString(record._id, `resource-${index}`)),
      _id: asString(record._id) || undefined,
      skillName: asString(record.skillName) || undefined,
      targetRole: asString(record.targetRole),
      level: asString(record.level),
      language: asString(record.language, 'vi'),
      type: asString(record.type, 'article'),
      title: asString(record.title, 'Tài nguyên học tập'),
      url: asString(record.url, '#'),
      provider: asString(record.provider, asString(record.source, 'AI Mentor')),
      thumbnailUrl: asString(record.thumbnailUrl, asString(record.thumbnail_url)) || undefined,
      channelTitle: asString(record.channelTitle, asString(record.channel_title)) || undefined,
      publishedAt: asString(record.publishedAt, asString(record.published_at)) || undefined,
      source: asString(record.source) || undefined,
      score: typeof record.score === 'number' ? record.score : undefined,
      tags: asArray(record.tags).map(String).filter(Boolean)
    }
  })
}

const normalizeResources = (payload: unknown): LearningResource[] => {
  const data = unwrapResponse<unknown>(payload)
  if (Array.isArray(data)) return data as LearningResource[]

  const record = asRecord(data)
  if (Array.isArray(record.resources)) return normalizeResourceList(record.resources)
  if (Array.isArray(record.items)) return normalizeResourceList(record.items)

  return []
}

const normalizeRoadmapLearningItem = (payload: unknown, requestedItemId?: string): RoadmapLearningItemResponse => {
  const data = unwrapResponse<unknown>(payload)
  const record = asRecord(data)
  const task = asRecord(record.task)
  const responseItemId = asString(record.itemId, asString(task.itemId, requestedItemId))
  const learningRecord = asRecord(record.learning)
  const learning = normalizeLearningContent({
    ...learningRecord,
    resources: learningRecord.resources ?? record.resources
  })

  return {
    roadmapId: asString(record.roadmapId),
    itemId: responseItemId,
    task: Object.keys(task).length ? {
      itemId: asString(task.itemId, responseItemId) || undefined,
      title: asString(task.title) || undefined,
      description: asString(task.description) || undefined,
      skillName: asString(task.skillName) || undefined,
      canonicalSkillName: asString(task.canonicalSkillName) || undefined,
      category: asString(task.category) || undefined,
      targetRole: asString(task.targetRole) || undefined,
      level: asString(task.level) || undefined,
      priority: asString(task.priority) || undefined,
      week: asNumber(task.week) || undefined,
      estimatedHours: asNumber(task.estimatedHours) || undefined,
      status: asString(task.status) || undefined
    } : undefined,
    learning,
    personalizedContext: asRecord(record.personalizedContext),
    progress: asRecord(record.progress)
  }
}

export const learningApi = {
  async getRoadmapLearning(roadmapId: string): Promise<RoadmapLearningListResponse> {
    const response = await apiClient.get(`/roadmaps/${roadmapId}/learning`)
    const data = unwrapResponse<unknown>(response.data)
    const record = asRecord(data)

    return {
      roadmapId: asString(record.roadmapId, roadmapId),
      sourceMode: asString(record.sourceMode) || undefined,
      language: asString(record.language) || undefined,
      items: asArray(record.items).map((item) => {
        const source = asRecord(item)
        return {
          itemId: asString(source.itemId),
          taskTitle: asString(source.taskTitle) || undefined,
          canonicalSkillName: asString(source.canonicalSkillName) || undefined,
          skillName: asString(source.skillName) || undefined,
          targetRole: asString(source.targetRole) || undefined,
          level: asString(source.level) || undefined,
          week: asNumber(source.week) || undefined,
          priority: asString(source.priority) || undefined,
          learningStatus: asString(source.learningStatus) || undefined
        }
      }).filter((item) => item.itemId)
    }
  },

  async getRoadmapLearningItem(roadmapId: string, itemId: string): Promise<RoadmapLearningItemResponse> {
    const encodedItemId = encodeURIComponent(itemId)
    const response = await apiClient.get(`/roadmaps/${roadmapId}/learning/items/${encodedItemId}`, {
      params: { includeResources: true }
    })
    return normalizeRoadmapLearningItem(response.data, itemId)
  },

  async generateRoadmapLearningItem(
    roadmapId: string,
    itemId: string,
    data: { forceRegenerate?: boolean; includeResources?: boolean } = {}
  ): Promise<RoadmapLearningItemResponse> {
    const encodedItemId = encodeURIComponent(itemId)
    const response = await apiClient.post(`/roadmaps/${roadmapId}/learning/items/${encodedItemId}/generate`, {
      forceRegenerate: data.forceRegenerate ?? false,
      includeResources: data.includeResources ?? true
    })
    return normalizeRoadmapLearningItem(response.data, itemId)
  },

  async getLearningContent(
    skillName: string,
    params: { targetRole: string; level: string; language?: string }
  ): Promise<LearningContent> {
    const response = await apiClient.get(`/learning/skills/${skillName}`, { params })
    return normalizeLearningContent(unwrapResponse<unknown>(response.data))
  },

  async generateLearningContent(data: {
    skillName: string
    targetRole: string
    level: string
    language?: string
    forceRegenerate?: boolean
  }): Promise<LearningContent> {
    const response = await apiClient.post('/learning/skills/generate', data)
    return normalizeLearningContent(unwrapResponse<unknown>(response.data))
  },

  async getLearningResources(
    skillName: string,
    params: { targetRole: string; level: string; language?: string; type?: string }
  ): Promise<LearningResource[]> {
    const response = await apiClient.get(`/learning/skills/${skillName}/resources`, { params })
    return normalizeResources(response.data)
  },

  async searchAndCacheResources(
    skillName: string,
    data: { targetRole: string; level: string; language?: string }
  ): Promise<LearningResource[]> {
    const response = await apiClient.post(`/learning/skills/${skillName}/resources/search`, data)
    return normalizeResources(response.data)
  },

  async seedLearningResource(
    skillName: string,
    resource: Partial<LearningResource>
  ): Promise<LearningResource> {
    const response = await apiClient.post(`/learning/skills/${skillName}/resources`, resource)
    return unwrapResponse<LearningResource>(response.data)
  }
}
