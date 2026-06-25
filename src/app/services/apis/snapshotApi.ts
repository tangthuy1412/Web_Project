import { apiClient, unwrapResponse } from './apiClient'

type UnknownRecord = Record<string, unknown>

export type AnalysisSnapshot = {
  id: string
  repositoryId: string
  createdAt: string
  careerDirection?: string
  missingSkills: string[]
  overallScore: number
  techStackScore?: number
  documentationScore?: number
  commitQualityScore?: number
  testingScore?: number
  deploymentScore?: number
  portfolioReadinessScore?: number
}

export type SnapshotScoreChange = {
  key: string
  label: string
  before: number
  after: number
  change: number
  status: 'improved' | 'regressed' | 'unchanged' | string
}

export type SkillComparisonItem = {
  skill: string
  category?: string
  beforePercent?: number
  afterPercent?: number
  changePercent?: number
  status: string
}

export type SkillComparisonSummary = {
  totalComparedSkills: number
  improvedCount: number
  regressedCount: number
  resolvedMissingCount: number
  remainingMissingCount: number
}

export type SnapshotComparison = {
  firstSnapshot: AnalysisSnapshot | null
  latestSnapshot: AnalysisSnapshot | null
  overallChange: number
  scoreChanges: SnapshotScoreChange[]
  summary: string
  improvements: SnapshotScoreChange[]
  regressions: SnapshotScoreChange[]
  improvedChecklist: string[]
  regressedChecklist: string[]
  stillMissingChecklist: string[]
  alreadyPresentChecklist: string[]
  remainingMissingSkills: string[]
  resolvedMissingSkills: string[]
  topImprovedSkills: SkillComparisonItem[]
  skillComparisonSummary: SkillComparisonSummary
  skillComparisonText: string
  raw: unknown
}

const asRecord = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {}
const asNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0
const asArray = (value: unknown) => Array.isArray(value) ? value : []

const getScore = (source: UnknownRecord, ...keys: string[]) => {
  const scores = asRecord(source.scores ?? source.score)
  for (const key of keys) {
    if (source[key] !== undefined) return asNumber(source[key])
    if (scores[key] !== undefined) return asNumber(scores[key])
  }
  return 0
}

const normalizeSnapshot = (payload: unknown): AnalysisSnapshot => {
  const source = asRecord(payload)
  return {
    id: String(source.snapshotId ?? source.id ?? source._id ?? source.analysisSnapshotId ?? ''),
    repositoryId: String(source.repositoryId ?? source.repoId ?? ''),
    createdAt: String(source.createdAt ?? source.analyzedAt ?? source.timestamp ?? source.generatedAt ?? ''),
    careerDirection: typeof source.careerDirection === 'string' ? source.careerDirection : undefined,
    missingSkills: asArray(source.missingSkills).map(String),
    overallScore: getScore(source, 'overallScore', 'overall'),
    techStackScore: getScore(source, 'techStackScore'),
    documentationScore: getScore(source, 'documentationScore', 'documentation'),
    commitQualityScore: getScore(source, 'commitQualityScore', 'commitQuality'),
    testingScore: getScore(source, 'testingScore'),
    deploymentScore: getScore(source, 'deploymentScore'),
    portfolioReadinessScore: getScore(source, 'portfolioReadinessScore')
  }
}

const getSnapshotList = (payload: unknown): AnalysisSnapshot[] => {
  const data = asRecord(unwrapResponse<unknown>(payload))
  const source = Array.isArray(data.snapshots)
    ? data.snapshots
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(payload)
        ? payload
        : []

  return source.map(normalizeSnapshot).filter((snapshot) => snapshot.id)
}

const normalizeComparison = (payload: unknown): SnapshotComparison => {
  const data = asRecord(unwrapResponse<unknown>(payload))
  const scoreChanges = asArray(data.scoreChanges).map((item) => {
    const source = asRecord(item)
    return {
      key: String(source.key ?? ''),
      label: String(source.label ?? source.key ?? ''),
      before: asNumber(source.before),
      after: asNumber(source.after),
      change: asNumber(source.change),
      status: String(source.status ?? 'unchanged')
    } satisfies SnapshotScoreChange
  })
  const scoreValue = (key: string, side: 'before' | 'after') => scoreChanges.find((item) => item.key === key)?.[side] ?? 0
  const first = data.firstSnapshot ?? data.baseSnapshot ?? data.beforeSnapshot ?? data.oldSnapshot
  const latest = data.latestSnapshot ?? data.currentSnapshot ?? data.afterSnapshot ?? data.newSnapshot
  const firstSnapshot = first ? normalizeSnapshot(first) : data.fromSnapshotId ? {
    id: String(data.fromSnapshotId), repositoryId: String(data.repositoryId ?? ''), createdAt: String(data.fromDate ?? ''), missingSkills: [],
    overallScore: asNumber(data.overallBefore), techStackScore: scoreValue('techStackScore', 'before'), documentationScore: scoreValue('documentationScore', 'before'),
    commitQualityScore: scoreValue('commitQualityScore', 'before'), deploymentScore: scoreValue('deploymentScore', 'before'),
    testingScore: scoreValue('testingScore', 'before'), portfolioReadinessScore: scoreValue('portfolioReadinessScore', 'before')
  } : null
  const latestSnapshot = latest ? normalizeSnapshot(latest) : data.toSnapshotId ? {
    id: String(data.toSnapshotId), repositoryId: String(data.repositoryId ?? ''), createdAt: String(data.toDate ?? ''), missingSkills: [],
    overallScore: asNumber(data.overallAfter), techStackScore: scoreValue('techStackScore', 'after'), documentationScore: scoreValue('documentationScore', 'after'),
    commitQualityScore: scoreValue('commitQualityScore', 'after'), deploymentScore: scoreValue('deploymentScore', 'after'),
    testingScore: scoreValue('testingScore', 'after'), portfolioReadinessScore: scoreValue('portfolioReadinessScore', 'after')
  } : null
  const explicitChange = data.overallChange ?? data.overallScoreChange ?? asRecord(data.changes).overallScore
  const skillVectorComparison = asRecord(data.skillVectorComparison)
  const skillSummary = asRecord(skillVectorComparison.skillSummary)
  const toSkillComparison = (item: unknown): SkillComparisonItem => {
    const source = asRecord(item)
    return { skill: String(source.skill ?? source.canonicalSkillName ?? ''), category: typeof source.category === 'string' ? source.category : undefined, beforePercent: asNumber(source.beforePercent), afterPercent: asNumber(source.afterPercent), changePercent: asNumber(source.changePercent), status: String(source.status ?? '') }
  }

  return {
    firstSnapshot,
    latestSnapshot,
    overallChange: explicitChange === undefined
      ? (latestSnapshot?.overallScore ?? 0) - (firstSnapshot?.overallScore ?? 0)
      : asNumber(explicitChange),
    scoreChanges,
    summary: String(data.summary ?? ''),
    improvements: asArray(data.improvements).map((item) => item as SnapshotScoreChange),
    regressions: asArray(data.regressions).map((item) => item as SnapshotScoreChange),
    improvedChecklist: asArray(data.improvedChecklist).map(String),
    regressedChecklist: asArray(data.regressedChecklist).map(String),
    stillMissingChecklist: asArray(data.stillMissingChecklist).map(String),
    alreadyPresentChecklist: asArray(data.alreadyPresentChecklist).map(String),
    remainingMissingSkills: asArray(data.remainingMissingSkills).map(String),
    resolvedMissingSkills: asArray(data.resolvedMissingSkills).map(String),
    topImprovedSkills: asArray(skillVectorComparison.topImprovedSkills).map(toSkillComparison),
    skillComparisonSummary: {
      totalComparedSkills: asNumber(skillSummary.totalComparedSkills),
      improvedCount: asNumber(skillSummary.improvedCount),
      regressedCount: asNumber(skillSummary.regressedCount),
      resolvedMissingCount: asNumber(skillSummary.resolvedMissingCount),
      remainingMissingCount: asNumber(skillSummary.remainingMissingCount)
    },
    skillComparisonText: String(skillVectorComparison.summary ?? ''),
    raw: payload
  }
}

export const snapshotApi = {
  async getProgressComparison(repositoryId: string) {
    const response = await apiClient.get(`/repositories/${repositoryId}/progress-comparison`)
    return normalizeComparison(response.data)
  },

  async getSnapshots(repositoryId: string) {
    const response = await apiClient.get(`/repositories/${repositoryId}/snapshots`)
    return getSnapshotList(response.data)
  },

  async getSnapshot(snapshotId: string) {
    const response = await apiClient.get(`/snapshots/${snapshotId}`)
    return normalizeSnapshot(unwrapResponse(response.data))
  },

  async compareSnapshots(fromSnapshotId: string, toSnapshotId: string) {
    const response = await apiClient.post('/snapshots/compare', { fromSnapshotId, toSnapshotId })
    return normalizeComparison(response.data)
  }
}
