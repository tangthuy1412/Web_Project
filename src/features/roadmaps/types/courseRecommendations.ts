export interface CourseraCourseRecommendation {
  provider: 'coursera'
  title: string
  description: string
  url: string
  thumbnailUrl: string
  contentType: 'course' | 'specialization' | 'professional_certificate' | 'guided_project' | string
  partnerName: string
  level: string
  language: string
  estimatedDuration: string
  pricingType: 'provider_determined'
  linkType: 'direct_course'
  isExternal: true
}

export interface RoadmapCourseRecommendationTopic {
  topicId: string
  roleId: string
  level: 'beginner' | 'intermediate' | 'advanced' | string
  displayName: string
}

export interface RoadmapCourseRecommendationsData {
  roadmapId: string
  topic: RoadmapCourseRecommendationTopic
  courses: CourseraCourseRecommendation[]
}
