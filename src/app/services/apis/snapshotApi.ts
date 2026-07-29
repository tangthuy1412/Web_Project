import { apiClient, unwrapResponse } from './apiClient'
import type { AnalysisScopeSummary, SkillVectorItem } from '../../types'
import axios from 'axios'

type UnknownRecord = Record<string, unknown>

export type AnalysisSnapshot = {
  id: string
  repositoryId: string
  repoName?: string
  fullName?: string
  analysisId?: string
  analysisScope?: AnalysisScopeSummary
  createdAt: string
  analyzedAt?: string
  userLevel?: string
  projectType?: string
  confidence?: string | number
  careerDirection?: string
  analysisScopeType?: string
  scoringMethod?: string
  matchedSkillNames?: string[]
  weakSkillNames?: string[]
  missingSkillNames?: string[]
  recommendedNextSkills?: string[]
  rolePredictions?: unknown[]
  roleMatches?: unknown[]
  skillGapSummary?: Record<string, unknown>
  vectorSources?: unknown
  sourceStats?: Record<string, unknown>
  scoreBreakdown?: Record<string, unknown>
  recommendations?: unknown[]
  missingSkills: string[]
  topSkills?: SkillVectorItem[]
  skillVector?: SkillVectorItem[]
  skillVectorSummary?: SkillVectorSummary
  overallScore: number
  techStackScore?: number
  documentationScore?: number
  commitQualityScore?: number
  testingScore?: number
  deploymentScore?: number
  portfolioReadinessScore?: number
  modelVersion?: string
  pipelineVersion?: string
  repoDocumentVersion?: string
  issueDocumentVersion?: string
  apiEvidenceVersion?: string
  isCurrentVersion?: boolean
  isCompatible?: boolean
  isComparableWithCurrent?: boolean
}

export type SkillVectorSummary = {
  totalSkills: number
  missingCount: number
  weakCount: number
  developingCount: number
  strongCount: number
  averageScore: number
}

export type SnapshotScoreChange = {
  key: string
  label: string
  before: number
  after: number
  change: number
  status: 'improved' | 'regressed' | 'unchanged' | string
}

export type SnapshotDelta = {
  userReadinessScore: number
  levelChanged: boolean
  fromLevel?: string
  toLevel?: string
  userCommitsDelta?: number
  activeDaysDelta?: number
}

export type SkillComparisonItem = {
  skill: string
  skillName?: string
  canonicalSkillName?: string
  category?: string
  fromScore?: number
  toScore?: number
  delta?: number
  trend?: string
  beforePercent?: number
  afterPercent?: number
  changePercent?: number
  status: string
}

export type SkillComparisonSummary = {
  totalComparedSkills: number
  improvedCount: number
  regressedCount: number
  unchangedCount: number
  newSkillCount: number
  resolvedMissingCount: number
  remainingMissingCount: number
  newMissingCount: number
  averageBeforeScore: number
  averageAfterScore: number
  averageChange: number
}

export type SnapshotComparison = {
  comparisonStatus: 'comparable'
  comparisonMode?: 'full' | 'score_only' | string
  comparableSkillScores?: boolean
  warnings: string[]
  comparisonVersion?: {
    modelVersion?: string
    pipelineVersion?: string
  }
  repositoryId?: string
  repoName?: string
  fullName?: string
  analysisScopeType?: string
  enoughData?: boolean
  firstSnapshot: AnalysisSnapshot | null
  latestSnapshot: AnalysisSnapshot | null
  delta?: SnapshotDelta
  skillChanges: SkillComparisonItem[]
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
  newMissingSkills: string[]
  topImprovedSkills: SkillComparisonItem[]
  topRegressedSkills: SkillComparisonItem[]
  newSkills: SkillComparisonItem[]
  skillComparisonSummary: SkillComparisonSummary
  skillComparisonText: string
  raw: unknown
}

export type IncompatibleSnapshotComparison = {
  comparisonStatus: 'incompatible_snapshot_versions'
  message?: string
  leftVersion?: Record<string, unknown>
  rightVersion?: Record<string, unknown>
}

export type SnapshotComparisonState = SnapshotComparison | IncompatibleSnapshotComparison

export type RepositoryProgressComparisonState =
  | { comparisonStatus: 'comparable'; data: SnapshotComparison }
  | { comparisonStatus: 'insufficient_compatible_snapshots'; message?: string }

const asRecord = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {}
const asNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0
const asOptionalNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined
const asArray = (value: unknown) => Array.isArray(value) ? value : []
const asString = (value: unknown) => typeof value === 'string' && value.trim() ? value : undefined
const asOptionalBoolean = (value: unknown) => typeof value === 'boolean' ? value : undefined

type SnapshotQueryParams = {
  includeEvidence?: boolean
  includeSkillDetails?: boolean
}

type SnapshotHistoryParams = {
  page?: number
  limit?: number
  view?: 'summary' | 'detail'
  includeEvidence?: boolean
}

export type SnapshotHistory = {
  snapshots: AnalysisSnapshot[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const selectDefaultSnapshotPair = (snapshots: AnalysisSnapshot[]) => ({
  fromSnapshotId: snapshots[1]?.id ?? '',
  toSnapshotId: snapshots[0]?.id ?? ''
})

export const normalizeSnapshotPair = (left?: AnalysisSnapshot, right?: AnalysisSnapshot) => {
  if (!left || !right || left.id === right.id) return null
  const leftTime = new Date(left.analyzedAt || left.createdAt).getTime()
  const rightTime = new Date(right.analyzedAt || right.createdAt).getTime()
  return leftTime <= rightTime
    ? { fromSnapshotId: left.id, toSnapshotId: right.id }
    : { fromSnapshotId: right.id, toSnapshotId: left.id }
}

const finiteNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

export const formatReadinessScore = (value: unknown) => {
  const score = finiteNumber(value)
  if (score === null) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, useGrouping: false }).format(score)
}

export const formatReadinessDelta = (value: unknown) => {
  const delta = finiteNumber(value)
  if (delta === null) return '—'
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, useGrouping: false }).format(Math.abs(delta))
  return `${delta > 0 ? '+' : delta < 0 ? '-' : ''}${formatted}`
}

const getScore = (source: UnknownRecord, ...keys: string[]) => {
  const scores = asRecord(source.scores ?? source.score)
  for (const key of keys) {
    if (source[key] !== undefined) return asNumber(source[key])
    if (scores[key] !== undefined) return asNumber(scores[key])
  }
  return 0
}

export const mapSnapshotDetail = (payload: unknown): AnalysisSnapshot => {
  const sourcePayload = asRecord(payload)
  const source = asRecord(sourcePayload.snapshot ?? payload)
  const repository = asRecord(source.repository)
  const analysisScope = asRecord(source.analysisScope)
  const summary = asRecord(source.summary)
  const skillVectorSummary = asRecord(source.skillVectorSummary)
  const debug = asRecord(source.debug)
  const dev2vec = asRecord(debug.dev2vec ?? source.dev2vec)
  const normalizeSkill = (item: unknown): SkillVectorItem => {
    const record = asRecord(item)
    return {
      canonicalSkillName: String(record.canonicalSkillName ?? record.skillName ?? record.name ?? ''),
      normalizedSkillName: typeof record.normalizedSkillName === 'string' ? record.normalizedSkillName : undefined,
      category: typeof record.category === 'string' ? record.category : undefined,
      score: asNumber(record.score),
      level: String(record.level ?? 'missing'),
      evidence: asArray(record.evidence).map(String),
      sources: asArray(record.sources).map(String)
    } satisfies SkillVectorItem
  }

  return {
    id: String(source.snapshotId ?? source.id ?? source._id ?? source.analysisSnapshotId ?? ''),
    analysisId: asString(source.analysisId),
    repositoryId: String(source.repositoryId ?? source.repoId ?? repository.repositoryId ?? repository.id ?? repository._id ?? ''),
    repoName: asString(source.repoName) ?? asString(repository.repoName) ?? asString(repository.name),
    fullName: asString(source.fullName) ?? asString(repository.fullName),
    analysisScope: Object.keys(analysisScope).length ? {
      type: asString(analysisScope.type),
      githubUsername: asString(analysisScope.githubUsername),
      totalRepoCommits: asOptionalNumber(analysisScope.totalRepoCommits),
      userCommits: asOptionalNumber(analysisScope.userCommits),
      activeDays: asOptionalNumber(analysisScope.activeDays),
      firstCommitDate: asString(analysisScope.firstCommitDate) ?? null,
      lastCommitDate: asString(analysisScope.lastCommitDate) ?? null,
      analyzedCommitShas: Array.isArray(analysisScope.analyzedCommitShas) ? analysisScope.analyzedCommitShas.map(String) : undefined,
      analyzedSampleCommits: asOptionalNumber(analysisScope.analyzedSampleCommits),
      commitScope: asString(analysisScope.commitScope),
      branchesDiscovered: asOptionalNumber(analysisScope.branchesDiscovered),
      branchesAnalyzed: asOptionalNumber(analysisScope.branchesAnalyzed),
      failedBranches: Array.isArray(analysisScope.failedBranches)
        ? analysisScope.failedBranches.flatMap((item) => {
          if (typeof item === 'string') return [item]
          const branch = asRecord(item)
          return Object.keys(branch).length ? [{
            branch: asString(branch.branch),
            errorCode: asString(branch.errorCode),
            message: asString(branch.message)
          }] : []
        })
        : undefined,
      fetchComplete: asOptionalBoolean(analysisScope.fetchComplete),
      fetchTruncated: asOptionalBoolean(analysisScope.fetchTruncated),
      analysisLimit: asOptionalNumber(analysisScope.analysisLimit),
      selectionStrategy: asString(analysisScope.selectionStrategy),
      activeDayDateSource: asString(analysisScope.activeDayDateSource),
      activeDayTimezone: asString(analysisScope.activeDayTimezone),
      source: asString(analysisScope.source)
    } : undefined,
    analysisScopeType: asString(source.analysisScopeType) ?? asString(analysisScope.type),
    createdAt: String(source.createdAt ?? source.analyzedAt ?? source.timestamp ?? source.generatedAt ?? ''),
    analyzedAt: asString(source.analyzedAt),
    userLevel: asString(source.userLevel) ?? asString(summary.userLevel),
    projectType: asString(source.projectType) ?? asString(summary.projectType),
    confidence: asString(source.confidence) ?? asString(summary.confidence) ?? (typeof summary.confidence === 'number' ? summary.confidence : undefined),
    careerDirection: asString(source.careerDirection) ?? asString(summary.careerDirection),
    scoringMethod: asString(source.scoringMethod) ?? asString(summary.scoringMethod),
    matchedSkillNames: asArray(source.matchedSkillNames).map(String),
    weakSkillNames: asArray(source.weakSkillNames).map(String),
    missingSkillNames: asArray(source.missingSkillNames).map(String),
    recommendedNextSkills: asArray(source.recommendedNextSkills).map(String),
    rolePredictions: asArray(source.rolePredictions ?? dev2vec.rolePredictions),
    roleMatches: asArray(source.roleMatches ?? dev2vec.roleMatches),
    skillGapSummary: Object.keys(asRecord(source.skillGapSummary ?? dev2vec.skillGaps)).length ? asRecord(source.skillGapSummary ?? dev2vec.skillGaps) : undefined,
    vectorSources: source.vectorSources ?? dev2vec.vectorSources,
    sourceStats: Object.keys(asRecord(source.sourceStats ?? dev2vec.sourceStats)).length ? asRecord(source.sourceStats ?? dev2vec.sourceStats) : undefined,
    scoreBreakdown: Object.keys(asRecord(source.scoreBreakdown)).length ? asRecord(source.scoreBreakdown) : undefined,
    recommendations: asArray(source.recommendations),
    missingSkills: asArray(source.missingSkills).map((item) => {
      const record = asRecord(item)
      return String(record.skillName ?? record.canonicalSkillName ?? record.name ?? item)
    }).filter(Boolean),
    topSkills: asArray(source.topSkills).map(normalizeSkill).filter((item) => item.canonicalSkillName),
    skillVector: asArray(source.skillVector).map(normalizeSkill).filter((item) => item.canonicalSkillName),
    skillVectorSummary: Object.keys(skillVectorSummary).length ? {
      totalSkills: asNumber(skillVectorSummary.totalSkills ?? skillVectorSummary.total),
      missingCount: asNumber(skillVectorSummary.missingCount),
      weakCount: asNumber(skillVectorSummary.weakCount),
      developingCount: asNumber(skillVectorSummary.developingCount),
      strongCount: asNumber(skillVectorSummary.strongCount),
      averageScore: asNumber(skillVectorSummary.averageScore)
    } : undefined,
    overallScore: getScore(source, 'overallScore', 'overall', 'userReadinessScore') || asNumber(summary.userReadinessScore),
    techStackScore: getScore(source, 'techStackScore'),
    documentationScore: getScore(source, 'documentationScore', 'documentation'),
    commitQualityScore: getScore(source, 'commitQualityScore', 'commitQuality'),
    testingScore: getScore(source, 'testingScore'),
    deploymentScore: getScore(source, 'deploymentScore'),
    portfolioReadinessScore: getScore(source, 'portfolioReadinessScore'),
    modelVersion: asString(source.modelVersion) ?? asString(dev2vec.modelVersion),
    pipelineVersion: asString(source.pipelineVersion),
    repoDocumentVersion: asString(source.repoDocumentVersion),
    issueDocumentVersion: asString(source.issueDocumentVersion),
    apiEvidenceVersion: asString(source.apiEvidenceVersion),
    isCurrentVersion: asOptionalBoolean(source.isCurrentVersion),
    isCompatible: asOptionalBoolean(source.isCompatible),
    isComparableWithCurrent: asOptionalBoolean(source.isComparableWithCurrent)
  }
}

const getSnapshotList = (payload: unknown): SnapshotHistory => {
  const unwrapped = unwrapResponse<unknown>(payload)
  const data = asRecord(unwrapped)
  const pagination = asRecord(data.pagination)
  const source = Array.isArray(data.snapshots)
    ? data.snapshots
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(unwrapped)
        ? unwrapped
        : Array.isArray(payload)
          ? payload
        : []

  const snapshots = source.map(mapSnapshotDetail).filter((snapshot) => snapshot.id)
  const page = asNumber(pagination.page) || 1
  const limit = asNumber(pagination.limit) || Math.max(snapshots.length, 1)
  const total = asNumber(pagination.total) || snapshots.length
  return {
    snapshots,
    pagination: {
      page,
      limit,
      total,
      totalPages: asNumber(pagination.totalPages) || Math.max(1, Math.ceil(total / limit))
    }
  }
}

export const mapSnapshotComparison = (payload: unknown): SnapshotComparison => {
  const data = asRecord(unwrapResponse<unknown>(payload))
  const delta = asRecord(data.delta)
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
  const first = data.firstSnapshot ?? data.baseSnapshot ?? data.beforeSnapshot ?? data.oldSnapshot ?? data.fromSnapshot
  const latest = data.latestSnapshot ?? data.currentSnapshot ?? data.afterSnapshot ?? data.newSnapshot ?? data.toSnapshot
  const firstSnapshot = first ? mapSnapshotDetail(first) : data.fromSnapshotId ? {
    id: String(data.fromSnapshotId), repositoryId: String(data.repositoryId ?? ''), createdAt: String(data.fromDate ?? ''), missingSkills: [],
    overallScore: asNumber(data.overallBefore ?? data.fromUserReadinessScore), techStackScore: scoreValue('techStackScore', 'before'), documentationScore: scoreValue('documentationScore', 'before'),
    commitQualityScore: scoreValue('commitQualityScore', 'before'), deploymentScore: scoreValue('deploymentScore', 'before'),
    testingScore: scoreValue('testingScore', 'before'), portfolioReadinessScore: scoreValue('portfolioReadinessScore', 'before')
  } : null
  const latestSnapshot = latest ? mapSnapshotDetail(latest) : data.toSnapshotId ? {
    id: String(data.toSnapshotId), repositoryId: String(data.repositoryId ?? ''), createdAt: String(data.toDate ?? ''), missingSkills: [],
    overallScore: asNumber(data.overallAfter ?? data.toUserReadinessScore), techStackScore: scoreValue('techStackScore', 'after'), documentationScore: scoreValue('documentationScore', 'after'),
    commitQualityScore: scoreValue('commitQualityScore', 'after'), deploymentScore: scoreValue('deploymentScore', 'after'),
    testingScore: scoreValue('testingScore', 'after'), portfolioReadinessScore: scoreValue('portfolioReadinessScore', 'after')
  } : null
  const explicitChange = delta.userReadinessScore ?? data.overallChange ?? data.overallScoreChange ?? asRecord(data.changes).overallScore
  const skillVectorComparison = asRecord(data.skillVectorComparison)
  const skillSummary = asRecord(skillVectorComparison.skillSummary)
  const toSkillComparison = (item: unknown): SkillComparisonItem => {
    const source = asRecord(item)
    const fromScore = source.fromScore !== undefined ? asNumber(source.fromScore) : undefined
    const toScore = source.toScore !== undefined ? asNumber(source.toScore) : undefined
    const rawDelta = source.delta !== undefined ? asNumber(source.delta) : undefined
    return {
      skill: String(source.skill ?? source.skillName ?? source.canonicalSkillName ?? ''),
      skillName: asString(source.skillName),
      canonicalSkillName: asString(source.canonicalSkillName),
      category: asString(source.category),
      fromScore,
      toScore,
      delta: rawDelta,
      trend: asString(source.trend),
      beforePercent: source.beforePercent !== undefined ? asNumber(source.beforePercent) : fromScore,
      afterPercent: source.afterPercent !== undefined ? asNumber(source.afterPercent) : toScore,
      changePercent: source.changePercent !== undefined ? asNumber(source.changePercent) : rawDelta,
      status: String(source.status ?? source.trend ?? '')
    }
  }
  const skillChanges = asArray(data.skillChanges).map(toSkillComparison).filter((item) => item.skill)
  const improvedSkills = asArray(data.improvedSkills).map(toSkillComparison).filter((item) => item.skill)
  const weakerSkills = asArray(data.weakerSkills).map(toSkillComparison).filter((item) => item.skill)
  const newSkills = asArray(data.newSkills).map(toSkillComparison).filter((item) => item.skill)
  const resolvedMissingSkills = asArray(data.resolvedMissingSkills).map((item) => {
    const record = asRecord(item)
    return String(record.skillName ?? record.canonicalSkillName ?? record.name ?? item)
  }).filter(Boolean)
  const newMissingSkills = asArray(data.newMissingSkills).map((item) => {
    const record = asRecord(item)
    return String(record.skillName ?? record.canonicalSkillName ?? record.name ?? item)
  }).filter(Boolean)

  return {
    comparisonStatus: 'comparable',
    comparisonMode: asString(data.comparisonMode) ?? 'full',
    comparableSkillScores: typeof data.comparableSkillScores === 'boolean' ? data.comparableSkillScores : true,
    warnings: asArray(data.warnings).map(String),
    comparisonVersion: Object.keys(asRecord(data.comparisonVersion)).length ? {
      modelVersion: asString(asRecord(data.comparisonVersion).modelVersion),
      pipelineVersion: asString(asRecord(data.comparisonVersion).pipelineVersion)
    } : undefined,
    repositoryId: asString(data.repositoryId),
    repoName: asString(data.repoName),
    fullName: asString(data.fullName),
    analysisScopeType: asString(data.analysisScopeType),
    enoughData: typeof data.enoughData === 'boolean' ? data.enoughData : undefined,
    firstSnapshot,
    latestSnapshot,
    delta: Object.keys(delta).length ? {
      userReadinessScore: asNumber(delta.userReadinessScore),
      levelChanged: Boolean(delta.levelChanged),
      fromLevel: asString(delta.fromLevel),
      toLevel: asString(delta.toLevel),
      userCommitsDelta: asOptionalNumber(delta.userCommitsDelta),
      activeDaysDelta: asOptionalNumber(delta.activeDaysDelta)
    } : undefined,
    skillChanges,
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
    resolvedMissingSkills,
    newMissingSkills,
    topImprovedSkills: improvedSkills.length ? improvedSkills : asArray(skillVectorComparison.topImprovedSkills).map(toSkillComparison),
    topRegressedSkills: weakerSkills.length ? weakerSkills : asArray(skillVectorComparison.topRegressedSkills).map(toSkillComparison),
    newSkills: newSkills.length ? newSkills : asArray(skillVectorComparison.newSkills).map(toSkillComparison),
    skillComparisonSummary: {
      totalComparedSkills: asNumber(skillSummary.totalComparedSkills) || skillChanges.length,
      improvedCount: asNumber(skillSummary.improvedCount) || improvedSkills.length,
      regressedCount: asNumber(skillSummary.regressedCount) || weakerSkills.length,
      unchangedCount: asNumber(skillSummary.unchangedCount) || skillChanges.filter((item) => (item.trend || item.status) === 'unchanged').length,
      newSkillCount: asNumber(skillSummary.newSkillCount) || newSkills.length,
      resolvedMissingCount: asNumber(skillSummary.resolvedMissingCount) || resolvedMissingSkills.length,
      remainingMissingCount: asNumber(skillSummary.remainingMissingCount),
      newMissingCount: asNumber(skillSummary.newMissingCount) || newMissingSkills.length,
      averageBeforeScore: asNumber(skillSummary.averageBeforeScore),
      averageAfterScore: asNumber(skillSummary.averageAfterScore),
      averageChange: asNumber(skillSummary.averageChange)
    },
    skillComparisonText: String(skillVectorComparison.summary ?? ''),
    raw: payload
  }
}

export const snapshotApi = {
  async getProgressComparison(repositoryId: string, params: SnapshotQueryParams = { includeSkillDetails: true }): Promise<RepositoryProgressComparisonState> {
    try {
      const response = await apiClient.get(`/repositories/${repositoryId}/progress-comparison`, { params })
      const data = asRecord(unwrapResponse<unknown>(response.data))
      if (data.comparisonStatus === 'insufficient_compatible_snapshots') {
        return { comparisonStatus: 'insufficient_compatible_snapshots', message: asString(data.message) }
      }
      return { comparisonStatus: 'comparable', data: mapSnapshotComparison(response.data) }
    } catch (error) {
      const data = asRecord(axios.isAxiosError(error) ? error.response?.data : undefined)
      const details = asRecord(data.data)
      if (data.comparisonStatus === 'insufficient_compatible_snapshots' || details.comparisonStatus === 'insufficient_compatible_snapshots') {
        return { comparisonStatus: 'insufficient_compatible_snapshots', message: asString(data.message) ?? asString(details.message) }
      }
      throw error
    }
  },

  async getSnapshots(repositoryId: string, params: SnapshotHistoryParams = {}) {
    const view = params.view ?? 'summary'
    const response = await apiClient.get(`/repositories/${repositoryId}/snapshots`, {
      params: {
        page: params.page,
        limit: params.limit,
        view,
        ...(view === 'detail' ? { includeEvidence: params.includeEvidence ?? false } : {})
      },
      headers: { 'Cache-Control': 'no-cache' }
    })
    return getSnapshotList(response.data)
  },

  async getSnapshot(snapshotId: string, params: SnapshotQueryParams & { view?: 'summary' | 'detail' } = { view: 'detail', includeEvidence: true }) {
    const response = await apiClient.get(`/snapshots/${snapshotId}`, { params })
    return mapSnapshotDetail(unwrapResponse(response.data))
  },

  async compareSnapshots(fromSnapshotId: string, toSnapshotId: string, params: SnapshotQueryParams = { includeSkillDetails: true }): Promise<SnapshotComparisonState> {
    try {
      const response = await apiClient.post('/snapshots/compare', { fromSnapshotId, toSnapshotId }, { params })
      return mapSnapshotComparison(response.data)
    } catch (error) {
      const responseData = asRecord(axios.isAxiosError(error) ? error.response?.data : undefined)
      const data = asRecord(responseData.data)
      const source = Object.keys(data).length ? data : responseData
      if (axios.isAxiosError(error) && error.response?.status === 409 && source.comparisonStatus === 'incompatible_snapshot_versions') {
        const errors = asRecord(source.errors)
        return {
          comparisonStatus: 'incompatible_snapshot_versions',
          message: asString(source.message),
          leftVersion: asRecord(errors.leftVersion),
          rightVersion: asRecord(errors.rightVersion)
        }
      }
      throw error
    }
  }
}
