export type RoadmapCategory =
  | 'Frontend'
  | 'Backend'
  | 'Fullstack'
  | 'DevOps'
  | 'Mobile'
  | 'AI/ML'
  | 'System Design'
  | 'Testing'
  | 'Blockchain'
  | 'Cloud'

export type RoadmapDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type LearningNodeStatus = 'locked' | 'unlocked' | 'in-progress' | 'completed'
export type ResourceType = 'article' | 'video' | 'docs' | 'course' | 'repo' | 'exercise'

export interface LearningResource {
  id: string
  title: string
  type: ResourceType
  url: string
  provider: string
  estimatedMinutes: number
}

export interface LearningNode {
  id: string
  itemId?: string
  hasBackendItemId?: boolean
  title: string
  description: string
  estimatedHours: number
  difficulty: RoadmapDifficulty
  dependencies: string[]
  status: LearningNodeStatus
  skills: string[]
  skillName?: string
  canonicalSkillName?: string
  targetRole?: string
  category?: string
  priority?: number
  week?: number
  level?: string
  learningStatus?: 'available' | 'missing' | string
  progressPercent?: number
  resources: LearningResource[]
  project?: string
  quiz?: {
    questions: number
    passingScore: number
  }
  notes?: string
  bookmarked?: boolean
  xp: number
}

export interface RoadmapMilestone {
  id: string
  title: string
  description: string
  targetWeek: number
  nodeIds: string[]
  rewardXp: number
  completed: boolean
}

export interface RoadmapModule {
  id: string
  title: string
  description: string
  order: number
  estimatedHours: number
  nodes: LearningNode[]
  milestones: RoadmapMilestone[]
}

export interface Roadmap {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  category: RoadmapCategory
  difficulty: RoadmapDifficulty
  estimatedWeeks: number
  estimatedHours: number
  requiredSkills: string[]
  objectives: string[]
  tags: string[]
  popularity: number
  rating: number
  learners: number
  isFeatured: boolean
  isAIRecommended: boolean
  progress: number
  progressRecordId?: string
  progressItems?: RoadmapProgressItem[]
  modules: RoadmapModule[]
  createdFrom?: 'manual' | 'ai'
  careerOutcome: string
  status?: 'active' | 'archived'
  createdAt?: string
  updatedAt?: string
  sourceRepositoriesCount?: number
  roleId?: string
  requestedLevel?: string
  effectiveLevel?: string
  durationWeeks?: number
  language?: string
  missingSkills?: string[]
  roadmapSource?: RoadmapSource | string
  progressSummary?: {
    overallProgress?: number
    completedItems?: number
    totalItems?: number
    inProgressItems?: number
  }
  roleMatch?: {
    roleId?: string
    roleName?: string
    matchScore?: number
    matchLevel?: string
    matchLevelLabel?: string
    scoringMethod?: string
    probability?: number
    rank?: number
    modelVersion?: string
    vectorSources?: string[]
    sourceStats?: Record<string, unknown>
  }
  skillGapSummary?: {
    totalGaps?: number
    missingRequiredCount?: number
    weakSkillCount?: number
    recommendedNextSkills?: string[]
    prioritySkills?: string[]
    gaps?: RoadmapSkillGap[]
  }
  supportingPaths?: {
    id: string
    title: string
    reason: string
    skills: string[]
    suggestedTasks: string[]
  }[]
}

export type RoadmapProgressItemStatus = 'not_started' | 'in_progress' | 'completed' | string

export interface RoadmapProgressItem {
  itemId?: string
  taskTitle?: string
  skillName: string
  normalizedSkillName?: string
  canonicalSkillName?: string
  category?: string
  targetRole?: string
  level?: string
  week?: number
  priority?: number | string
  status: RoadmapProgressItemStatus
  progressPercent: number
  startedAt?: string | null
  completedAt?: string | null
  updatedAt?: string
}

export interface RoadmapSourceRepository {
  repositoryId?: string
  repoName?: string
  fullName?: string
  snapshotId?: string
  analysisId?: string
  githubUsername?: string
  totalRepoCommits?: number
  userCommits?: number
  activeDays?: number
  userLevel?: string
  userReadinessScore?: number
  careerDirection?: string
  projectType?: string
}

export interface RoadmapSource {
  type?: string
  sourceMode?: string
  contextSource?: string
  modelVersion?: string
  scoringMethod?: string
  vectorSources?: string[]
  sourceStats?: Record<string, unknown>
  analysisId?: string
  analysisIds?: string[]
  repositoryIds?: string[]
  repositories?: RoadmapSourceRepository[]
  totalRepositories?: number
  snapshotId?: string
  repositoryId?: string
  repoName?: string
  fullName?: string
  githubUsername?: string
  totalRepoCommits?: number
  userCommits?: number
  totalUserCommits?: number
  activeDays?: number
  firstCommitDate?: string
  lastCommitDate?: string
  userLevel?: string
  userReadinessScore?: number
  careerDirection?: string
  projectType?: string
}

export interface RoadmapSkillGap {
  skillName?: string
  canonicalSkillName?: string
  category?: string
  currentLevel?: string
  targetLevel?: string
  currentScore?: number
  requiredScore?: number
  gap?: number
  priority?: string
  reason?: string
}

export interface RoadmapProgressRecord {
  id?: string
  roadmapId: string
  overallProgress: number
  items: RoadmapProgressItem[]
  createdAt?: string
  updatedAt?: string
}

export interface SkillProgress {
  id: string
  skill: string
  category: RoadmapCategory
  current: number
  target: number
  history: { month: string; value: number }[]
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: string
  progress: number
  target: number
  xpReward: number
}

export interface UserLearningStats {
  activeRoadmapIds: string[]
  completedRoadmaps: number
  completedNodes: number
  totalNodes: number
  totalXp: number
  level: number
  currentStreak: number
  longestStreak: number
  weeklyGoalHours: number
  weeklyHoursCompleted: number
  dailyGoalMinutes: number
  bookmarkedNodeIds: string[]
  achievements: Achievement[]
}

export interface SkillGapAnalysis {
  skill: string
  category: RoadmapCategory
  currentScore: number
  targetScore: number
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  evidence: string
  recommendedNodeIds: string[]
}

export interface AIRecommendation {
  id: string
  generatedAt: string
  summary: string
  confidence: number
  sourceRepositories: string[]
  strengths: string[]
  weaknesses: string[]
  missingSkills: string[]
  commitPatternInsight: string
  complexityInsight: string
  careerSuggestion: string
  estimatedCompletionWeeks: number
  skillGaps: SkillGapAnalysis[]
  roadmap: Roadmap
}

export interface RoadmapFilters {
  search: string
  category: RoadmapCategory | 'All'
  difficulty: RoadmapDifficulty | 'All'
  duration: 'All' | 'Short' | 'Medium' | 'Long'
}

