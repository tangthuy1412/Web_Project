import type { LearningNode, Roadmap, RoadmapFilters } from '../types'

export const getRoadmapNodes = (roadmap: Roadmap): LearningNode[] =>
  roadmap.modules.flatMap((module) => module.nodes)

export const getRoadmapCompletion = (roadmap: Roadmap): number => {
  const nodes = getRoadmapNodes(roadmap)
  if (nodes.length === 0) return 0
  const completed = nodes.filter((node) => node.status === 'completed').length
  return Math.round((completed / nodes.length) * 100)
}

export const getRoadmapHoursRemaining = (roadmap: Roadmap): number =>
  getRoadmapNodes(roadmap)
    .filter((node) => node.status !== 'completed')
    .reduce((total, node) => total + node.estimatedHours, 0)

export const getNextLearningNode = (roadmap: Roadmap): LearningNode | undefined =>
  getRoadmapNodes(roadmap).find((node) => node.status === 'in-progress') ??
  getRoadmapNodes(roadmap).find((node) => node.status === 'unlocked')

export const filterRoadmaps = (roadmaps: Roadmap[], filters: RoadmapFilters): Roadmap[] => {
  const query = filters.search.trim().toLowerCase()

  return roadmaps.filter((roadmap) => {
    const matchesQuery =
      query.length === 0 ||
      roadmap.title.toLowerCase().includes(query) ||
      roadmap.subtitle.toLowerCase().includes(query) ||
      roadmap.tags.some((tag) => tag.toLowerCase().includes(query))

    const matchesCategory = filters.category === 'All' || roadmap.category === filters.category
    const matchesDifficulty = filters.difficulty === 'All' || roadmap.difficulty === filters.difficulty
    const matchesDuration =
      filters.duration === 'All' ||
      (filters.duration === 'Short' && roadmap.estimatedWeeks <= 6) ||
      (filters.duration === 'Medium' && roadmap.estimatedWeeks > 6 && roadmap.estimatedWeeks <= 10) ||
      (filters.duration === 'Long' && roadmap.estimatedWeeks > 10)

    return matchesQuery && matchesCategory && matchesDifficulty && matchesDuration
  })
}

export const getStatusTone = (status: LearningNode['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
    case 'in-progress':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
    case 'unlocked':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400'
    case 'locked':
      return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
  }
}

export const getDifficultyTone = (difficulty: Roadmap['difficulty']) => {
  switch (difficulty) {
    case 'Beginner':
      return 'success'
    case 'Intermediate':
      return 'info'
    case 'Advanced':
      return 'warning'
  }
}

export const formatRoadmapDifficulty = (difficulty: Roadmap['difficulty']): string => {
  switch (difficulty) {
    case 'Beginner':
      return 'Cơ bản'
    case 'Intermediate':
      return 'Trung cấp'
    case 'Advanced':
      return 'Nâng cao'
  }
}

export const formatLearningStatus = (status: LearningNode['status']): string => {
  switch (status) {
    case 'completed':
      return 'Đã hoàn thành'
    case 'in-progress':
      return 'Đang học'
    case 'unlocked':
      return 'Có thể học'
    case 'locked':
      return 'Đang khóa'
  }
}

export const formatDurationFilter = (duration: RoadmapFilters['duration']): string => {
  switch (duration) {
    case 'All':
      return 'Tất cả thời lượng'
    case 'Short':
      return 'Ngắn'
    case 'Medium':
      return 'Trung bình'
    case 'Long':
      return 'Dài'
  }
}

export const formatCategoryFilter = (category: RoadmapFilters['category']): string =>
  category === 'All' ? 'Tất cả danh mục' : category

export const formatDifficultyFilter = (difficulty: RoadmapFilters['difficulty']): string =>
  difficulty === 'All' ? 'Tất cả cấp độ' : formatRoadmapDifficulty(difficulty)

export const formatSkillGapPriority = (priority: 'Critical' | 'High' | 'Medium' | 'Low'): string => {
  switch (priority) {
    case 'Critical':
      return 'Rất quan trọng'
    case 'High':
      return 'Cao'
    case 'Medium':
      return 'Trung bình'
    case 'Low':
      return 'Thấp'
  }
}
