import { getNextLearningNode, getRoadmapCompletion, getRoadmapHoursRemaining } from '../utils/roadmapUtils'
import type { Roadmap } from '../types'

export const useRoadmapProgress = (roadmap: Roadmap | undefined) => {
  if (!roadmap) {
    return {
      completion: 0,
      hoursRemaining: 0,
      nextNode: undefined
    }
  }

  return {
    completion: getRoadmapCompletion(roadmap),
    hoursRemaining: getRoadmapHoursRemaining(roadmap),
    nextNode: getNextLearningNode(roadmap)
  }
}
