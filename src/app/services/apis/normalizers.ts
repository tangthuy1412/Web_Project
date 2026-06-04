import type { AnalysisResult, ChatMessage, ChatSession, Repository, User } from '../../types'

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

const extractObject = (value: unknown, keys: string[]) => {
  const record = asRecord(value)

  for (const key of keys) {
    if (record[key] && typeof record[key] === 'object') {
      return record[key]
    }
  }

  return value
}

const asArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value

  const record = asRecord(value)
  const candidates = [record.items, record.repositories, record.analyses, record.results, record.sessions, record.packages, record.files, record.data]
  const found = candidates.find(Array.isArray)

  return Array.isArray(found) ? found : []
}

const asString = (value: unknown, fallback = '') => {
  return typeof value === 'string' ? value : fallback
}

const asNumber = (value: unknown, fallback = 0) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

const firstString = (...values: unknown[]) => {
  return asString(values.find((value) => typeof value === 'string'), '')
}

export const normalizeUser = (payload: unknown): User => {
  const root = asRecord(extractObject(payload, ['user', 'account', 'profile']))
  const user = asRecord(root.user ?? root.profile ?? root)
  const github = asRecord(user.github ?? user.githubAccount)
  const githubUsername = firstString(user.githubUsername, github.username, github.login)

  return {
    id: firstString(user.id, user._id),
    email: firstString(user.email),
    name: firstString(user.name, user.fullName, user.username, user.email),
    avatar: firstString(user.avatar, user.avatarUrl, github.avatarUrl),
    githubConnected: Boolean(user.githubConnected ?? user.isGithubConnected ?? githubUsername),
    githubUsername: githubUsername || undefined,
    createdAt: firstString(user.createdAt, new Date().toISOString())
  }
}

export const normalizeRepository = (payload: unknown): Repository => {
  const repo = asRecord(extractObject(payload, ['repository', 'repo']))
  const owner = asRecord(repo.owner)
  const id = firstString(repo._id, repo.id, repo.githubId, repo.repoId)
  const fullName = firstString(repo.fullName, repo.full_name, `${firstString(owner.login)}/${firstString(repo.name)}`).replace(/^\//, '')

  return {
    id,
    name: firstString(repo.name, fullName.split('/').pop(), 'Repository'),
    fullName,
    description: firstString(repo.description) || undefined,
    language: firstString(repo.language, 'Unknown'),
    stars: asNumber(repo.stars ?? repo.stargazersCount ?? repo.stargazers_count),
    forks: asNumber(repo.forks ?? repo.forksCount ?? repo.forks_count),
    updatedAt: firstString(repo.updatedAt, repo.updated_at, repo.pushedAt, repo.pushed_at, new Date().toISOString()),
    hasReadme: Boolean(repo.hasReadme ?? repo.readme ?? repo.readmeUrl),
    analyzed: Boolean(repo.analyzed ?? repo.hasAnalysis ?? repo.analysisId),
    analysisId: firstString(repo.analysisId, repo.latestAnalysisId) || undefined,
    url: firstString(repo.url, repo.htmlUrl, repo.html_url, repo.cloneUrl, '#'),
    private: Boolean(repo.private ?? repo.isPrivate)
  }
}

export const normalizeRepositories = (payload: unknown) => {
  return asArray(payload).map(normalizeRepository)
}

export const normalizeAnalysis = (payload: unknown): AnalysisResult => {
  const source = asRecord(extractObject(payload, ['analysis', 'result', 'snapshot']))
  const scores = asRecord(source.scores ?? source.scoreBreakdown)
  const careerDirectionValue = source.careerDirection
  const careerDirection = asRecord(careerDirectionValue)
  const commitSummary = asRecord(source.commitSummary)
  const checklist = asRecord(source.checklist)
  const portfolioReadiness = asRecord(source.portfolioReadiness)
  const repository = asRecord(source.repository)
  const repositoryId = firstString(source.repositoryId, repository._id, repository.id)
  const repoName = firstString(source.repoName, source.repositoryName, repository.name, 'Repository')
  const languages = asArray(source.languages).map(String)
  const frameworks = asArray(source.frameworks).map(String)

  return {
    id: firstString(source.id, source._id),
    repositoryId,
    repositoryName: repoName,
    repoName,
    fullName: firstString(source.fullName, repository.fullName, repository.full_name),
    createdAt: firstString(source.createdAt, source.analyzedAt, new Date().toISOString()),
    projectType: firstString(source.projectType, source.type, 'Unknown'),
    techStack: asArray(source.techStack ?? source.technologies).map(String),
    languages,
    frameworks,
    packages: asArray(source.packages).map((item) => {
      const record = asRecord(item)
      return firstString(record.name, record.path, String(item))
    }).filter(Boolean),
    skillSignals: asArray(source.skillSignals).map(String),
    careerSignals: asArray(source.careerSignals).map(String),
    scores: {
      architecture: asNumber(scores.architecture),
      completeness: asNumber(scores.completeness),
      commitQuality: asNumber(scores.commitQuality ?? scores.commitQualityScore),
      documentation: asNumber(scores.documentation ?? scores.documentationScore),
      codeConvention: asNumber(scores.codeConvention ?? scores.codeQuality),
      overall: asNumber(scores.overall ?? scores.overallScore ?? source.overallScore),
      techStackScore: asNumber(scores.techStackScore ?? scores.techStack),
      documentationScore: asNumber(scores.documentationScore ?? scores.documentation),
      commitQualityScore: asNumber(scores.commitQualityScore ?? scores.commitQuality),
      deploymentScore: asNumber(scores.deploymentScore ?? scores.deployment),
      testingScore: asNumber(scores.testingScore ?? scores.testing),
      portfolioReadinessScore: asNumber(scores.portfolioReadinessScore ?? scores.portfolioReadiness),
      overallScore: asNumber(scores.overallScore ?? scores.overall ?? source.overallScore)
    },
    strengths: asArray(source.strengths).map(String),
    weaknesses: asArray(source.weaknesses).map(String),
    recommendations: asArray(source.recommendations).map((item, index) => {
      const record = asRecord(item)
      const text = typeof item === 'string' ? item : ''
      return {
        id: firstString(record.id, record._id, `recommendation-${index}`),
        title: firstString(record.title, text || 'Recommendation'),
        description: firstString(record.description, record.content),
        priority: firstString(record.priority, 'medium') as 'high' | 'medium' | 'low',
        category: firstString(record.category, 'other') as 'architecture' | 'documentation' | 'testing' | 'security' | 'performance' | 'other'
      }
    }),
    missingSkills: asArray(source.missingSkills).map((item, index) => {
      const record = asRecord(item)
      return {
        id: firstString(record.id, record._id, `skill-${index}`),
        name: firstString(record.name, String(item)),
        category: firstString(record.category, 'General'),
        level: firstString(record.level, 'beginner') as 'beginner' | 'intermediate' | 'advanced',
        importance: firstString(record.importance, 'medium') as 'high' | 'medium' | 'low'
      }
    }),
    careerDirection: {
      primary: firstString(
        careerDirection.primary,
        typeof careerDirectionValue === 'string' ? careerDirectionValue : undefined,
        source.targetCareer,
        'Software Engineer'
      ),
      secondary: asArray(careerDirection.secondary).map(String),
      confidence: asNumber(careerDirection.confidence),
      reasoning: firstString(careerDirection.reasoning)
    },
    commitSummary: {
      totalCommits: asNumber(commitSummary.totalCommits),
      activeDays: asNumber(commitSummary.activeDays),
      vagueCommitRatio: asNumber(commitSummary.vagueCommitRatio),
      conventionalCommitRatio: asNumber(commitSummary.conventionalCommitRatio),
      firstCommitDate: firstString(commitSummary.firstCommitDate) || undefined,
      lastCommitDate: firstString(commitSummary.lastCommitDate) || undefined
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
  return asArray(payload).map(normalizeAnalysis)
}

export const normalizeChatMessage = (payload: unknown): ChatMessage => {
  const message = asRecord(extractObject(payload, ['message', 'reply', 'assistantMessage', 'aiResponse', 'response']))

  return {
    id: firstString(message.id, message._id, `message-${Date.now()}`),
    role: firstString(message.role, message.sender) === 'user' ? 'user' : 'assistant',
    content: firstString(message.content, message.message, message.text, message.reply, message.response, message.aiResponse),
    timestamp: firstString(message.timestamp, message.createdAt, new Date().toISOString())
  }
}

export const normalizeChatSession = (payload: unknown): ChatSession => {
  const session = asRecord(extractObject(payload, ['session', 'chatSession']))

  return {
    id: firstString(session.id, session._id, session.sessionId),
    title: firstString(session.title, 'Cuoc tro chuyen moi'),
    createdAt: firstString(session.createdAt, new Date().toISOString()),
    messages: asArray(session.messages).map(normalizeChatMessage),
    repositoryContext: firstString(session.repositoryContext) || undefined
  }
}

export const normalizeChatSessions = (payload: unknown) => {
  return asArray(payload).map(normalizeChatSession)
}

export const normalizeFiles = (payload: unknown) => asArray(payload)
export const normalizeCommits = (payload: unknown) => asArray(payload)
