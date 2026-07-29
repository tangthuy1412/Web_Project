import type { AnalysisResult, Dev2VecCompatibility, RepositoryAnalysisState } from '../../../types'
import { cleanAnalysisText } from './analysisText'
import { asArray, asNumber, asRecord, extractObject, firstString } from './helpers'

const optionalNumber = (value: unknown) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const optionalBoolean = (value: unknown) => typeof value === 'boolean' ? value : undefined

const normalizeFailedBranches = (value: unknown) => asArray(value).flatMap((item) => {
  if (typeof item === 'string') return [item]
  const branch = asRecord(item)
  if (!Object.keys(branch).length) return []
  return [{
    branch: firstString(branch.branch) || undefined,
    errorCode: firstString(branch.errorCode) || undefined,
    message: firstString(branch.message) || undefined
  }]
})

export const normalizeAnalysis = (payload: unknown): AnalysisResult => {
  const envelope = asRecord(payload)
  const source = asRecord(extractObject(payload, ['analysis', 'result', 'snapshot']))
  const snapshotReference = asRecord(envelope.snapshot ?? envelope.analysisSnapshot)
  const summary = asRecord(source.summary)
  const analysisScope = asRecord(source.analysisScope)
  const scoreBreakdown = asRecord(source.scoreBreakdown)
  const scores = asRecord(source.scores ?? source.scoreBreakdown)
  const careerDirectionValue = source.careerDirection
  const careerDirection = asRecord(careerDirectionValue)
  const commitSummary = asRecord(source.commitSummary)
  const checklist = asRecord(source.checklist)
  const portfolioReadiness = asRecord(source.portfolioReadiness)
  const repository = asRecord(source.repository)
  const repositoryId = firstString(source.repositoryId, repository.repositoryId, repository._id, repository.id)
  const repoName = firstString(source.repoName, source.repositoryName, repository.repoName, repository.name, 'Repository')

  return {
    id: firstString(source.id, source._id, source.analysisId),
    analysisId: firstString(source.analysisId, source.id, source._id) || undefined,
    snapshotId: firstString(
      source.snapshotId,
      source.analysisSnapshotId,
      snapshotReference.snapshotId,
      snapshotReference.id,
      snapshotReference._id,
      envelope.snapshotId,
      envelope.analysisSnapshotId
    ) || undefined,
    modelVersion: firstString(source.modelVersion) || undefined,
    pipelineVersion: firstString(source.pipelineVersion, source.analysisPipelineVersion) || undefined,
    repositoryId,
    repositoryName: repoName,
    repoName,
    fullName: firstString(source.fullName, repository.fullName, repository.full_name),
    createdAt: firstString(source.createdAt, source.analyzedAt, new Date().toISOString()),
    analyzedAt: firstString(source.analyzedAt) || undefined,
    projectType: cleanAnalysisText(firstString(summary.projectType, source.projectType, source.type, 'Unknown')),
    analysisScope: Object.keys(analysisScope).length ? {
      type: firstString(analysisScope.type) || undefined,
      githubUsername: firstString(analysisScope.githubUsername) || undefined,
      totalRepoCommits: optionalNumber(analysisScope.totalRepoCommits),
      userCommits: optionalNumber(analysisScope.userCommits),
      activeDays: optionalNumber(analysisScope.activeDays),
      firstCommitDate: firstString(analysisScope.firstCommitDate) || null,
      lastCommitDate: firstString(analysisScope.lastCommitDate) || null,
      analyzedCommitShas: Array.isArray(analysisScope.analyzedCommitShas)
        ? analysisScope.analyzedCommitShas.map(String)
        : undefined,
      analyzedSampleCommits: optionalNumber(analysisScope.analyzedSampleCommits),
      commitScope: firstString(analysisScope.commitScope) || undefined,
      branchesDiscovered: optionalNumber(analysisScope.branchesDiscovered),
      branchesAnalyzed: optionalNumber(analysisScope.branchesAnalyzed),
      failedBranches: Array.isArray(analysisScope.failedBranches)
        ? normalizeFailedBranches(analysisScope.failedBranches)
        : undefined,
      fetchComplete: optionalBoolean(analysisScope.fetchComplete),
      fetchTruncated: optionalBoolean(analysisScope.fetchTruncated),
      analysisLimit: optionalNumber(analysisScope.analysisLimit),
      selectionStrategy: firstString(analysisScope.selectionStrategy) || undefined,
      activeDayDateSource: firstString(analysisScope.activeDayDateSource) || undefined,
      activeDayTimezone: firstString(analysisScope.activeDayTimezone) || undefined,
      source: firstString(analysisScope.source) || undefined
    } : undefined,
    summary: {
      careerDirection: cleanAnalysisText(firstString(summary.careerDirection)),
      userLevel: firstString(summary.userLevel) || undefined,
      userReadinessScore: optionalNumber(summary.userReadinessScore),
      overallScore: optionalNumber(summary.overallScore),
      projectType: cleanAnalysisText(firstString(summary.projectType)),
      confidence: firstString(summary.confidence) || optionalNumber(summary.confidence)
    },
    topSkills: asArray(source.topSkills).map((item) => {
      const record = asRecord(item)
      return {
        skill: cleanAnalysisText(firstString(record.skill, record.skillName, record.name)),
        canonicalSkillName: cleanAnalysisText(firstString(record.canonicalSkillName)) || undefined,
        category: cleanAnalysisText(firstString(record.category)) || undefined,
        score: asNumber(record.score),
        level: firstString(record.level) || undefined
      }
    }).filter((item) => item.skill),
    scoreBreakdown: {
      skillScore: optionalNumber(scoreBreakdown.skillScore),
      contributionScore: optionalNumber(scoreBreakdown.contributionScore),
      commitQualityScore: optionalNumber(scoreBreakdown.commitQualityScore),
      projectCompletenessScore: optionalNumber(scoreBreakdown.projectCompletenessScore),
      missingCriticalPenalty: optionalNumber(scoreBreakdown.missingCriticalPenalty),
      confidence: optionalNumber(scoreBreakdown.confidence)
    },
    techStack: asArray(source.techStack ?? source.technologies).map(cleanAnalysisText),
    languages: asArray(source.languages).map(cleanAnalysisText),
    frameworks: asArray(source.frameworks).map(cleanAnalysisText),
    packages: asArray(source.packages).map((item) => {
      const record = asRecord(item)
      return cleanAnalysisText(firstString(record.name, record.path, String(item)))
    }).filter(Boolean),
    skillSignals: asArray(source.skillSignals).map(cleanAnalysisText),
    careerSignals: asArray(source.careerSignals).map(cleanAnalysisText),
    skillVector: asArray(source.skillVector).map((item) => {
      const record = asRecord(item)
      return {
        canonicalSkillName: cleanAnalysisText(firstString(record.canonicalSkillName, record.skillName, record.name)),
        normalizedSkillName: cleanAnalysisText(firstString(record.normalizedSkillName, record.normalizedName)) || undefined,
        category: cleanAnalysisText(firstString(record.category)) || undefined,
        score: asNumber(record.score),
        level: firstString(record.level, 'missing'),
        evidence: asArray(record.evidence).map(cleanAnalysisText),
        sources: asArray(record.sources).map(cleanAnalysisText)
      }
    }).filter((item) => item.canonicalSkillName),
    scores: {
      architecture: asNumber(scores.architecture),
      completeness: asNumber(scores.completeness),
      commitQuality: asNumber(scores.commitQuality ?? scores.commitQualityScore),
      documentation: asNumber(scores.documentation ?? scores.documentationScore),
      codeConvention: asNumber(scores.codeConvention ?? scores.codeQuality),
      overall: asNumber(scores.overall ?? scores.overallScore ?? summary.overallScore ?? source.overallScore),
      techStackScore: optionalNumber(scores.techStackScore ?? scores.techStack),
      documentationScore: optionalNumber(scores.documentationScore ?? scores.documentation),
      commitQualityScore: optionalNumber(scores.commitQualityScore ?? scores.commitQuality),
      deploymentScore: optionalNumber(scores.deploymentScore ?? scores.deployment),
      testingScore: optionalNumber(scores.testingScore ?? scores.testing),
      portfolioReadinessScore: optionalNumber(scores.portfolioReadinessScore ?? scores.portfolioReadiness),
      overallScore: asNumber(scores.overallScore ?? scores.overall ?? summary.overallScore ?? source.overallScore)
    },
    strengths: asArray(source.strengths).map(cleanAnalysisText),
    weaknesses: asArray(source.weaknesses).map(cleanAnalysisText),
    recommendations: asArray(source.recommendations).map((item, index) => {
      const record = asRecord(item)
      const text = typeof item === 'string' ? item : ''
      return {
        id: firstString(record.id, record._id, `recommendation-${index}`),
        title: cleanAnalysisText(firstString(record.title, text ? `Khuyến nghị ${index + 1}` : 'Khuyến nghị')),
        description: cleanAnalysisText(firstString(record.description, record.content, text)),
        priority: firstString(record.priority, 'medium') as 'high' | 'medium' | 'low',
        category: firstString(record.category, 'other') as 'architecture' | 'documentation' | 'testing' | 'security' | 'performance' | 'other'
      }
    }).filter((item) => item.title || item.description),
    missingSkills: asArray(source.missingSkills).map((item, index) => {
      const record = asRecord(item)
      return {
        id: firstString(record.id, record._id, `skill-${index}`),
        name: cleanAnalysisText(firstString(record.skill, record.name, record.skillName, record.canonicalSkillName, String(item))),
        category: cleanAnalysisText(firstString(record.category, 'Tổng quát')),
        level: firstString(record.level, 'beginner') as 'beginner' | 'intermediate' | 'advanced',
        importance: firstString(record.importance, record.priority, 'medium') as 'high' | 'medium' | 'low'
      }
    }).filter((item) => item.name),
    careerDirection: {
      primary: cleanAnalysisText(firstString(
        careerDirection.primary,
        summary.careerDirection,
        typeof careerDirectionValue === 'string' ? careerDirectionValue : undefined,
        source.targetCareer,
        'Software Engineer'
      )),
      secondary: asArray(careerDirection.secondary).map(cleanAnalysisText),
      confidence: asNumber(careerDirection.confidence),
      reasoning: cleanAnalysisText(firstString(careerDirection.reasoning))
    },
    commitSummary: {
      totalCommits: asNumber(commitSummary.totalCommits ?? analysisScope.userCommits),
      activeDays: asNumber(commitSummary.activeDays ?? analysisScope.activeDays),
      vagueCommitRatio: asNumber(commitSummary.vagueCommitRatio),
      conventionalCommitRatio: asNumber(commitSummary.conventionalCommitRatio),
      firstCommitDate: firstString(commitSummary.firstCommitDate, analysisScope.firstCommitDate) || undefined,
      lastCommitDate: firstString(commitSummary.lastCommitDate, analysisScope.lastCommitDate) || undefined
    },
    checklist: {
      hasReadme: Boolean(checklist.hasReadme),
      hasEnvExample: Boolean(checklist.hasEnvExample),
      hasDocker: Boolean(checklist.hasDocker),
      hasDockerCompose: Boolean(checklist.hasDockerCompose),
      hasCICD: Boolean(checklist.hasCICD),
      hasTesting: Boolean(checklist.hasTesting),
      hasLinting: Boolean(checklist.hasLinting),
      hasFormatter: Boolean(checklist.hasFormatter),
      hasPackageFile: Boolean(checklist.hasPackageFile)
    },
    portfolioReadiness: {
      overallReadiness: asNumber(portfolioReadiness.overallReadiness),
      items: asArray(portfolioReadiness.items).map((item) => {
        const record = asRecord(item)
        return {
          label: firstString(record.label, record.title),
          completed: Boolean(record.completed),
          importance: firstString(record.importance, 'important') as 'critical' | 'important' | 'nice-to-have'
        }
      })
    }
  }
}

export const normalizeAnalyses = (payload: unknown) => {
  const source = asRecord(extractObject(payload, ['data']))
  const analyses = Array.isArray(source.analyses)
    ? source.analyses
    : Array.isArray(payload)
      ? payload
      : []

  return analyses.map(normalizeAnalysis)
}

const normalizeCompatibility = (payload: unknown): Dev2VecCompatibility | undefined => {
  const source = asRecord(payload)
  if (!Object.keys(source).length) return undefined

  return {
    isCompatible: typeof source.isCompatible === 'boolean' ? source.isCompatible : undefined,
    isCurrentVersion: typeof source.isCurrentVersion === 'boolean' ? source.isCurrentVersion : undefined,
    isComparableWithCurrent: typeof source.isComparableWithCurrent === 'boolean' ? source.isComparableWithCurrent : undefined,
    modelVersion: firstString(source.modelVersion) || undefined,
    pipelineVersion: firstString(source.pipelineVersion, source.analysisPipelineVersion) || undefined,
    repoDocumentVersion: firstString(source.repoDocumentVersion) || undefined,
    issueDocumentVersion: firstString(source.issueDocumentVersion) || undefined,
    apiEvidenceVersion: firstString(source.apiEvidenceVersion) || undefined
  }
}

export const normalizeRepositoryAnalysisState = (
  payload: unknown,
  fallbackRepositoryId = ''
): RepositoryAnalysisState => {
  const envelope = asRecord(payload)
  const data = asRecord(envelope.data)
  const source = Object.keys(data).length ? data : envelope
  const analysisStatus = firstString(source.analysisStatus, envelope.analysisStatus)
  const reason = firstString(source.reason, envelope.reason)
  const compatibility = normalizeCompatibility(source.compatibility ?? envelope.compatibility)
  const analysisPayload = source.analysis ?? source.result ?? source.snapshot ?? source
  const analysisRecord = asRecord(analysisPayload)
  const repository = asRecord(source.repository ?? analysisRecord.repository)
  const repositoryId = firstString(
    source.repositoryId,
    analysisRecord.repositoryId,
    repository.repositoryId,
    repository.id,
    repository._id,
    fallbackRepositoryId
  )

  const typedRequiredReason = analysisStatus === 'incompatible_analysis_history' || analysisStatus === 'no_compatible_dev2vec_analysis'
    ? analysisStatus
    : reason
  if (analysisStatus === 'analysis_required' || typedRequiredReason === 'incompatible_analysis_history' || typedRequiredReason === 'no_compatible_dev2vec_analysis') {
    return {
      analysisStatus: 'analysis_required',
      repositoryId,
      reason: typedRequiredReason || 'no_compatible_dev2vec_analysis',
      compatibility
    }
  }

  const analysis = normalizeAnalysis(analysisPayload)
  const normalizedRepositoryId = analysis.repositoryId || repositoryId
  const hasLegacyAnalysis = Boolean(
    analysis.id ||
    firstString(analysisRecord.repositoryId, analysisRecord.analysisId, analysisRecord.snapshotId)
  )

  // Legacy responses did not include analysisStatus. A payload with a real
  // analysis identity remains available for backward compatibility.
  if (analysisStatus === 'available' || hasLegacyAnalysis) {
    return {
      analysisStatus: 'available',
      repositoryId: normalizedRepositoryId,
      analysis: {
        ...analysis,
        repositoryId: normalizedRepositoryId,
        modelVersion: analysis.modelVersion ?? compatibility?.modelVersion,
        pipelineVersion: analysis.pipelineVersion ?? compatibility?.pipelineVersion
      },
      compatibility,
      reason: reason || undefined
    }
  }

  return {
    analysisStatus: 'analysis_required',
    repositoryId: fallbackRepositoryId,
    reason: reason || 'no_compatible_dev2vec_analysis',
    compatibility
  }
}

export const normalizeRepositoryAnalysisStates = (payload: unknown): RepositoryAnalysisState[] => {
  const envelope = asRecord(payload)
  const data = asRecord(envelope.data)
  const source = Object.keys(data).length ? data : envelope
  const entries = Array.isArray(source.analyses)
    ? source.analyses
    : Array.isArray(source.repositories)
      ? source.repositories
      : Array.isArray(source.items)
        ? source.items
        : Array.isArray(payload)
          ? payload
          : []

  return entries.map((entry) => normalizeRepositoryAnalysisState(entry))
}
