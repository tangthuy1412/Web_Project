import { apiClient, unwrapResponse } from '../../../app/services/apis/apiClient'
import type { CourseraCourseRecommendation, RoadmapCourseRecommendationsData, RoadmapCourseRecommendationTopic } from '../types/courseRecommendations'

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {}
const asString = (value: unknown) => typeof value === 'string' ? value : ''

const normalizeTopic = (value: unknown): RoadmapCourseRecommendationTopic => {
  const topic = asRecord(value)
  return {
    topicId: asString(topic.topicId),
    roleId: asString(topic.roleId),
    level: asString(topic.level),
    displayName: asString(topic.displayName)
  }
}

const normalizeCourse = (value: unknown): CourseraCourseRecommendation | null => {
  const course = asRecord(value)
  if (course.provider !== 'coursera' || typeof course.title !== 'string') return null

  return {
    provider: 'coursera',
    title: course.title,
    description: asString(course.description),
    url: asString(course.url),
    thumbnailUrl: asString(course.thumbnailUrl),
    contentType: asString(course.contentType),
    partnerName: asString(course.partnerName),
    level: asString(course.level),
    language: asString(course.language),
    estimatedDuration: asString(course.estimatedDuration),
    pricingType: 'provider_determined',
    linkType: 'direct_course',
    isExternal: true
  }
}

export const courseRecommendationService = {
  async getForRoadmap(roadmapId: string): Promise<RoadmapCourseRecommendationsData> {
    const normalizedRoadmapId = roadmapId.trim()
    if (!normalizedRoadmapId) throw new Error('Roadmap ID không hợp lệ.')

    const response = await apiClient.get(`/roadmaps/${encodeURIComponent(normalizedRoadmapId)}/course-recommendations`)
    const payload = asRecord(unwrapResponse<unknown>(response.data))
    return {
      roadmapId: asString(payload.roadmapId) || normalizedRoadmapId,
      topic: normalizeTopic(payload.topic),
      courses: Array.isArray(payload.courses)
        ? payload.courses.map(normalizeCourse).filter((course): course is CourseraCourseRecommendation => Boolean(course))
        : []
    }
  }
}
