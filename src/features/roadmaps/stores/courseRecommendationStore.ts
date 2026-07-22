import { create } from 'zustand'
import { getApiErrorMessage } from '../../../app/services/apis/core'
import { courseRecommendationService } from '../services/courseRecommendationService'
import type { RoadmapCourseRecommendationsData } from '../types/courseRecommendations'

export type CourseRecommendationEntry = {
  status: 'idle' | 'loading' | 'success' | 'error'
  data?: RoadmapCourseRecommendationsData
  error?: string | null
}

type CourseRecommendationState = {
  entriesByRoadmapId: Record<string, CourseRecommendationEntry>
  fetchCourseRecommendations: (roadmapId: string) => Promise<void>
  retryCourseRecommendations: (roadmapId: string) => Promise<void>
  clearCourseRecommendations: (roadmapId?: string) => void
}

const requestsByRoadmapId = new Map<string, Promise<void>>()

const loadEntry = async (
  roadmapId: string,
  set: (updater: (state: CourseRecommendationState) => Partial<CourseRecommendationState>) => void,
  force: boolean
) => {
  const id = roadmapId.trim()
  if (!id) return
  const state = useCourseRecommendationStore.getState()
  if (!force && state.entriesByRoadmapId[id]?.status === 'success') return
  const existingRequest = requestsByRoadmapId.get(id)
  if (existingRequest) return existingRequest

  set((current) => ({
    entriesByRoadmapId: { ...current.entriesByRoadmapId, [id]: { status: 'loading', data: force ? undefined : current.entriesByRoadmapId[id]?.data, error: null } }
  }))

  const request = courseRecommendationService.getForRoadmap(id)
    .then((data) => set((current) => ({
      entriesByRoadmapId: { ...current.entriesByRoadmapId, [id]: { status: 'success', data, error: null } }
    })))
    .catch((error) => set((current) => ({
      entriesByRoadmapId: {
        ...current.entriesByRoadmapId,
        [id]: { status: 'error', error: getApiErrorMessage(error) || 'Không thể tải khóa học Coursera lúc này.' }
      }
    })))
    .finally(() => requestsByRoadmapId.delete(id))

  requestsByRoadmapId.set(id, request)
  return request
}

export const useCourseRecommendationStore = create<CourseRecommendationState>((set) => ({
  entriesByRoadmapId: {},
  fetchCourseRecommendations: (roadmapId) => loadEntry(roadmapId, set, false),
  retryCourseRecommendations: (roadmapId) => loadEntry(roadmapId, set, true),
  clearCourseRecommendations: (roadmapId) => set((state) => {
    if (!roadmapId) return { entriesByRoadmapId: {} }
    const next = { ...state.entriesByRoadmapId }
    delete next[roadmapId.trim()]
    return { entriesByRoadmapId: next }
  })
}))
