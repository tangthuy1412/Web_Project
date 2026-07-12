import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Archive, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, FolderOpen, Loader2, Search, Sparkles } from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import { Input } from '../../../app/components/ui/Input'
import { RoadmapCard } from '../components/RoadmapCard'
import { RoadmapSkeleton } from '../components/RoadmapSkeleton'
import { useRepositoryStore } from '../../../app/stores/repositoryStore'
import { roleMatchApi } from '../../../app/services/apis/analysis'
import { useRoadmapStore } from '../stores/roadmapStore'
import type { RoadmapCategory, RoadmapDifficulty } from '../types'
import type { RoadmapSourceMode } from '../services/roadmapService'
import type { RoleMatch } from '../../../app/types'
import { filterRoadmaps, formatCategoryFilter, formatDifficultyFilter, formatDurationFilter, formatUserLevel } from '../utils/roadmapUtils'

const categories: (RoadmapCategory | 'All')[] = [
  'All',
  'Frontend',
  'Backend',
  'Fullstack',
  'DevOps',
  'Mobile',
  'AI/ML',
  'System Design',
  'Testing',
  'Blockchain',
  'Cloud'
]
const difficulties: (RoadmapDifficulty | 'All')[] = ['All', 'Beginner', 'Intermediate', 'Advanced']
const durations = ['All', 'Short', 'Medium', 'Long'] as const
const ROADMAPS_PER_PAGE = 3

const formatRoleMatchError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? '')

  if (message.includes('DEV2VEC_ANALYSIS_REQUIRED')) return 'Cần phân tích dự án trước khi gợi ý vai trò phù hợp.'
  if (message.includes('DEV2VEC_MODEL_UNAVAILABLE')) return 'Tính năng gợi ý vai trò đang tạm thời chưa sẵn sàng. Vui lòng thử lại sau.'
  if (message.includes('DEV2VEC_INFERENCE_FAILED') || message.includes('DEV2VEC_INVALID_OUTPUT')) return 'Chưa thể tính vai trò phù hợp từ dữ liệu hiện tại. Bạn có thể thử phân tích lại dự án.'

  return message || 'Không thể tính vai trò phù hợp.'
}
const skillLabel = (value: unknown) => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return String(record.skill ?? record.skillName ?? record.canonicalSkillName ?? record.name ?? '').trim()
  }
  return ''
}

const skillList = (value: unknown) => Array.isArray(value) ? value.map(skillLabel).filter(Boolean) : []

const sourceModeLabel = (sourceMode: RoadmapSourceMode) => {
  switch (sourceMode) {
    case 'single_repo':
      return 'Một dự án đã phân tích'
    case 'selected_repos':
      return 'Nhóm dự án đã chọn'
    case 'all_analyzed_repos':
      return 'Toàn bộ dự án đã phân tích'
  }
}


interface RoleSuggestionCardProps {
  match: RoleMatch
  featured?: boolean
  isGenerating: boolean
  disabled: boolean
  onCreate: (match: RoleMatch) => void
}

const RoleSuggestionCard = ({ match, featured = false, isGenerating, disabled, onCreate }: RoleSuggestionCardProps) => {
  const matchedSkills = [
    ...skillList(match.matchedSkillNames),
    ...skillList(match.topMatchedSkills),
    ...skillList(match.matchedSkills)
  ].filter((skill, index, list) => list.indexOf(skill) === index)
  const weakSkills = [
    ...skillList(match.weakSkillNames),
    ...skillList(match.weakSkills)
  ].filter((skill, index, list) => list.indexOf(skill) === index)
  const missingSkills = [
    ...skillList(match.missingSkillNames),
    ...skillList(match.topMissingSkills),
    ...skillList(match.missingRequiredSkills)
  ].filter((skill, index, list) => list.indexOf(skill) === index)
  const recommendedSkills = skillList(match.recommendedNextSkills)
  const cardClassName = featured
    ? 'rounded-lg border border-indigo-200 bg-white p-5 shadow-sm dark:border-indigo-900 dark:bg-slate-900'
    : 'rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'

  return (
    <article className={cardClassName}>
      <div className={featured ? 'grid gap-5 lg:grid-cols-[1fr_220px]' : 'space-y-4'}>
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {featured && <Badge variant="info" className="mb-2">Gợi ý phù hợp nhất</Badge>}
              <p className="font-semibold text-slate-950 dark:text-slate-50">{match.roleName}</p>
              <p className="mt-1 text-xs text-slate-500">{match.matchLevelLabel}</p>
            </div>
            <div className={featured ? 'text-left sm:text-right' : 'text-right'}>
              <p className={featured ? 'text-3xl font-bold text-indigo-700 dark:text-indigo-300' : 'text-2xl font-bold text-indigo-700 dark:text-indigo-300'}>
                {Math.round(match.matchScore)}%
              </p>
              <p className="text-xs text-slate-500">mức phù hợp</p>
            </div>
          </div>

          <div className={featured ? 'mt-4 grid gap-4 md:grid-cols-3' : 'mt-3 space-y-3'}>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Năng lực hiện có</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {matchedSkills.slice(0, featured ? 5 : 4).map((skill) => <Badge key={skill} variant="success">{skill}</Badge>)}
                {!matchedSkills.length && <span className="text-xs text-slate-500">Chưa có tín hiệu nổi bật.</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Cần củng cố</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {weakSkills.slice(0, featured ? 4 : 3).map((skill) => <Badge key={skill} variant="warning">{skill}</Badge>)}
                {missingSkills.slice(0, featured ? 5 : 4).map((skill) => <Badge key={skill} variant="default">{skill}</Badge>)}
                {!weakSkills.length && !missingSkills.length && <span className="text-xs text-slate-500">Chưa có thiếu hụt nổi bật.</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Nên học tiếp</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recommendedSkills.slice(0, featured ? 6 : 5).map((skill) => <Badge key={skill} variant="info">{skill}</Badge>)}
                {!recommendedSkills.length && <span className="text-xs text-slate-500">Chưa có đề xuất tiếp theo.</span>}
              </div>
            </div>
          </div>
        </div>

        <div className={featured ? 'flex flex-col justify-end gap-3 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950/30' : ''}>
          {featured && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Vai trò này đang phù hợp nhất với dữ liệu học tập và dự án đã phân tích của bạn.
            </p>
          )}
          <Button className="w-full" size="sm" isLoading={isGenerating} disabled={disabled} onClick={() => onCreate(match)}>
            Tạo lộ trình học
          </Button>
        </div>
      </div>
    </article>
  )
}

export const RoadmapsPage = () => {
  const navigate = useNavigate()
  const {
    roadmaps,
    filters,
    isLoading,
    isGenerating,
    error,
    learningStats,
    fetchRoadmaps,
    generateAIRoadmap,
    setFilters
  } = useRoadmapStore()
  const { analyses, fetchMyAnalyses } = useRepositoryStore()
  const [targetRole, setTargetRole] = useState('Backend Developer')
  const [sourceMode, setSourceMode] = useState<RoadmapSourceMode>('single_repo')
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([])
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [durationWeeks, setDurationWeeks] = useState(6)
  const useRoleMatching = true
  const [forceRegenerate, setForceRegenerate] = useState(false)
  const [roleMatches, setRoleMatches] = useState<RoleMatch[]>([])
  const [roleMatchSource, setRoleMatchSource] = useState<{
    sourceMode?: string
    totalRepositories?: number
    totalUserCommits?: number
    userLevel?: string
    userReadinessScore?: number
    repositoryNames?: string[]
    contextSource?: string
    modelVersion?: string
    scoringMethod?: string
    vectorSources?: string[]
    sourceStats?: Record<string, unknown>
  } | null>(null)
  const [isMatchingRoles, setIsMatchingRoles] = useState(false)
  const [generatingKey, setGeneratingKey] = useState('')
  const [roleMatchError, setRoleMatchError] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active')
  const [page, setPage] = useState(1)
  const analyzedRepos = useMemo(() => {
    const repos = new Map<string, { id: string; name: string; level?: string; commits?: number; readiness?: number; updatedAt?: number }>()

    analyses.forEach((analysis) => {
      if (!analysis.repositoryId) return
      const updatedAt = new Date(analysis.analyzedAt || analysis.createdAt || '').getTime() || 0
      const existing = repos.get(analysis.repositoryId)
      if (existing && (existing.updatedAt ?? 0) > updatedAt) return

      repos.set(analysis.repositoryId, {
        id: analysis.repositoryId,
        name: analysis.repositoryName || analysis.repoName || analysis.fullName || analysis.repositoryId,
        level: analysis.summary?.userLevel,
        commits: analysis.analysisScope?.userCommits ?? analysis.commitSummary?.totalCommits,
        readiness: analysis.summary?.userReadinessScore ?? analysis.summary?.overallScore ?? analysis.scores.overallScore ?? analysis.scores.overall,
        updatedAt
      })
    })

    return Array.from(repos.values())
  }, [analyses])
  const repositoryId = selectedRepoIds[0]
  const targetRoleOptions = useMemo(() => {
    return Array.from(new Set(roleMatches.map((match) => match.roleName))).slice(0, 3)
  }, [roleMatches])
  const canGenerate = sourceMode === 'all_analyzed_repos'
    ? analyzedRepos.length > 0
    : sourceMode === 'single_repo'
      ? Boolean(repositoryId)
      : selectedRepoIds.length > 0
  const effectiveTargetRole = targetRole || targetRoleOptions[0] || 'Backend Developer'
  const isRoleMatchesLoading = isMatchingRoles
  const selectedSourceStats = useMemo(() => {
    const selectedIds = sourceMode === 'all_analyzed_repos'
      ? analyzedRepos.map((repo) => repo.id)
      : sourceMode === 'selected_repos'
        ? selectedRepoIds
        : repositoryId
          ? [repositoryId]
          : []
    const selectedRepos = analyzedRepos.filter((repo) => selectedIds.includes(repo.id))
    const totalUserCommits = selectedRepos.reduce((sum, repo) => sum + (repo.commits ?? 0), 0)
    const readinessValues = selectedRepos.map((repo) => repo.readiness).filter((value): value is number => typeof value === 'number')
    const userReadinessScore = readinessValues.length
      ? Math.round(readinessValues.reduce((sum, value) => sum + value, 0) / readinessValues.length)
      : undefined
    const userLevel = sourceMode === 'single_repo'
      ? selectedRepos[0]?.level
      : roleMatchSource?.userLevel

    return {
      totalRepositories: selectedRepos.length,
      totalUserCommits,
      userReadinessScore,
      userLevel,
      repositoryNames: selectedRepos.map((repo) => repo.name)
    }
  }, [analyzedRepos, repositoryId, roleMatchSource?.userLevel, selectedRepoIds, sourceMode])
  const sourceDisplay = {
    totalRepositories: roleMatchSource?.totalRepositories || selectedSourceStats.totalRepositories || selectedRepoIds.length,
    totalUserCommits: roleMatchSource?.totalUserCommits || selectedSourceStats.totalUserCommits,
    userReadinessScore: roleMatchSource?.userReadinessScore ?? selectedSourceStats.userReadinessScore,
    userLevel: roleMatchSource?.userLevel || selectedSourceStats.userLevel,
    repositoryNames: roleMatchSource?.repositoryNames?.length ? roleMatchSource.repositoryNames : selectedSourceStats.repositoryNames
  }

  useEffect(() => {
    setSelectedRepoIds((current) => current.length || !analyzedRepos[0]?.id ? current : [analyzedRepos[0].id])
  }, [analyzedRepos])

  useEffect(() => {
    fetchRoadmaps({ status: statusFilter })
  }, [fetchRoadmaps, statusFilter])

  useEffect(() => {
    fetchMyAnalyses()
  }, [fetchMyAnalyses])

  useEffect(() => {
    if (!targetRoleOptions.some((role) => role === targetRole)) {
      setTargetRole(targetRoleOptions[0] ?? 'Backend Developer')
    }
  }, [targetRole, targetRoleOptions])

  useEffect(() => {
    if (!canGenerate) {
      setRoleMatches([])
      setRoleMatchSource(null)
      return
    }

    let isCurrent = true
    setIsMatchingRoles(true)
    setRoleMatchError('')

    roleMatchApi.calculateRoleMatches({
      sourceMode,
      ...(sourceMode === 'single_repo' ? { repoId: repositoryId } : {}),
      ...(sourceMode === 'selected_repos' ? { repoIds: selectedRepoIds } : {}),
      limit: 3,
      includeDetails: true
    }).then((response) => {
      if (!isCurrent) return
      const matches = response.matches ?? []
      setRoleMatches(matches)
      setRoleMatchSource(response.analysisSource ?? null)
      if (matches[0]?.roleName) setTargetRole(matches[0].roleName)
    }).catch((requestError) => {
      if (!isCurrent) return
      setRoleMatches([])
      setRoleMatchSource(null)
      setRoleMatchError(formatRoleMatchError(requestError))
    }).finally(() => {
      if (isCurrent) setIsMatchingRoles(false)
    })

    return () => { isCurrent = false }
  }, [canGenerate, repositoryId, selectedRepoIds, sourceMode])

  const handleGenerate = async (role?: Pick<RoleMatch, 'roleId' | 'roleName'>, key = 'manual') => {
    const selectedRole = role ?? roleMatches.find((match) => match.roleName === effectiveTargetRole) ?? roleMatches[0]
    setGeneratingKey(key)
    try {
      const recommendation = await generateAIRoadmap(selectedRole?.roleName ?? effectiveTargetRole, {
        sourceMode,
        repoId: sourceMode === 'single_repo' ? repositoryId : undefined,
        repoIds: sourceMode === 'selected_repos' ? selectedRepoIds : undefined,
        roleId: selectedRole?.roleId,
        selectedRole: selectedRole ? { roleId: selectedRole.roleId, roleName: selectedRole.roleName } : undefined,
        level,
        durationWeeks,
        language: 'vi',
        useRoleMatching,
        forceRegenerate
      })
      if (recommendation) {
        navigate(`/roadmaps/${recommendation.roadmap.slug}`)
      }
    } finally {
      setGeneratingKey('')
    }
  }

  const filteredRoadmaps = filterRoadmaps(roadmaps, filters)
  const archivedCount = roadmaps.filter((roadmap) => roadmap.status === 'archived').length
  const visibleRoadmapCount = roadmaps.length
  const inProgressCount = roadmaps.filter((roadmap) => roadmap.status !== 'archived' && roadmap.progress > 0 && roadmap.progress < 100).length
  const completedNodeCount = learningStats.completedNodes
  const totalNodes = learningStats.totalNodes
  const totalPages = Math.max(1, Math.ceil(filteredRoadmaps.length / ROADMAPS_PER_PAGE))
  const visibleRoadmaps = filteredRoadmaps.slice((page - 1) * ROADMAPS_PER_PAGE, page * ROADMAPS_PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [filters.search, filters.category, filters.difficulty, filters.duration, statusFilter])

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const handleSourceModeClick = (nextMode: RoadmapSourceMode) => {
    if (sourceMode !== nextMode) {
      setSourceMode(nextMode)
      return
    }

    if (nextMode === 'single_repo') setSelectedRepoIds([])
    if (nextMode === 'selected_repos') setSelectedRepoIds([])
  }

  const toggleSingleRepo = (repoId: string) => {
    setSelectedRepoIds((current) => current[0] === repoId ? [] : [repoId])
  }

  const toggleSelectedRepo = (repoId: string) => {
    setSelectedRepoIds((current) =>
      current.includes(repoId) ? current.filter((id) => id !== repoId) : [...current, repoId]
    )
  }

  return (
    <div className="max-w-7xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Badge variant="info" className="mb-3">
            <Sparkles className="mr-1 h-3 w-3" />
            Lộ trình cá nhân hóa
          </Badge>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-slate-50">Lộ trình học của tôi</h1>
          <p className="mt-1 max-w-2xl text-slate-500 dark:text-slate-400">
            Quản lý các lộ trình học được tạo từ hồ sơ GitHub và mục tiêu nghề nghiệp của bạn.
          </p>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{visibleRoadmapCount}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{statusFilter === 'active' ? 'Lộ trình đang học' : 'Lộ trình đã lưu trữ'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-cyan-50 p-3 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300">
              {statusFilter === 'active' ? <BookmarkCheck className="h-5 w-5" /> : <Archive className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{statusFilter === 'active' ? inProgressCount : archivedCount}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{statusFilter === 'active' ? 'Có tiến độ học' : 'Đã cất đi'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{completedNodeCount}/{totalNodes || 0}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Nhiệm vụ đã hoàn thành</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="font-semibold text-slate-950 dark:text-slate-50">Tạo lộ trình học theo vai trò mục tiêu</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Chọn dữ liệu học tập đã phân tích, hệ thống sẽ đề xuất các hướng nghề nghiệp phù hợp để bạn tạo lộ trình học.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                aria-label="Cấp độ lộ trình"
                value={level}
                onChange={(event) => setLevel(event.target.value as typeof level)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="beginner">Mới bắt đầu</option>
                <option value="intermediate">Trung cấp</option>
                <option value="advanced">Nâng cao</option>
              </select>
              <select
                aria-label="Thời lượng lộ trình"
                value={durationWeeks}
                onChange={(event) => setDurationWeeks(Number(event.target.value))}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value={4}>4 tuần</option>
                <option value={6}>6 tuần</option>
                <option value={8}>8 tuần</option>
                <option value={12}>12 tuần</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {[
              { value: 'single_repo', label: 'Một dự án', description: 'Đề xuất vai trò từ một dự án cụ thể.' },
              { value: 'selected_repos', label: 'Một vài dự án', description: 'Kết hợp các dự án bạn muốn đưa vào đánh giá.' },
              { value: 'all_analyzed_repos', label: 'Tất cả dự án', description: 'Dùng toàn bộ dự án đã có kết quả phân tích.' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`min-h-[86px] rounded-lg border p-3 text-left transition ${sourceMode === option.value ? 'border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-100' : 'border-slate-200 hover:border-indigo-300 dark:border-slate-800'}`}
                onClick={() => handleSourceModeClick(option.value as RoadmapSourceMode)}
              >
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{option.description}</span>
              </button>
            ))}
          </div>

          {sourceMode === 'single_repo' && (
            <div className="h-44 overflow-auto rounded-lg border border-slate-200 p-2 dark:border-slate-800">
              <div className="grid auto-rows-fr gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {analyzedRepos.map((repo) => {
                  const selected = repositoryId === repo.id && selectedRepoIds[0] === repo.id

                  return (
                    <button
                      key={repo.id}
                      type="button"
                      className={`flex min-h-[72px] items-start justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${selected ? 'border-indigo-500 bg-indigo-50 text-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900'}`}
                      onClick={() => toggleSingleRepo(repo.id)}
                      aria-pressed={selected}
                    >
                      <span className="min-w-0">
                        <span className="line-clamp-1 break-all font-medium">{repo.name}</span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                          {formatUserLevel(repo.level)} · {repo.commits ?? 0} đóng góp
                        </span>
                      </span>
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                        {selected ? <CheckCircle2 className="h-4 w-4 text-indigo-600" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {sourceMode === 'selected_repos' && (
            <div className="h-44 overflow-auto rounded-lg border border-slate-200 p-2 dark:border-slate-800">
              <div className="grid auto-rows-fr gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {analyzedRepos.map((repo) => (
                  <button
                    key={repo.id}
                    type="button"
                    className={`flex min-h-[72px] items-start justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${selectedRepoIds.includes(repo.id) ? 'border-indigo-500 bg-indigo-50 text-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900'}`}
                    onClick={() => toggleSelectedRepo(repo.id)}
                    aria-pressed={selectedRepoIds.includes(repo.id)}
                  >
                    <span className="min-w-0">
                      <span className="line-clamp-1 break-all font-medium">{repo.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                        {formatUserLevel(repo.level)} · {repo.commits ?? 0} đóng góp
                      </span>
                    </span>
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      {selectedRepoIds.includes(repo.id) ? <CheckCircle2 className="h-4 w-4 text-indigo-600" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Tạo lộ trình mới</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bật khi bạn muốn tạo lại từ đầu. Tắt để ưu tiên dùng lộ trình đã có và phản hồi nhanh hơn.</p>
            </div>
            <button
              type="button"
              className={`inline-flex h-7 w-12 items-center rounded-full p-1 transition ${forceRegenerate ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              onClick={() => setForceRegenerate((value) => !value)}
              aria-pressed={forceRegenerate}
              aria-label="Tạo lộ trình mới"
            >
              <span className={`h-5 w-5 rounded-full bg-white shadow transition ${forceRegenerate ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className={`relative overflow-hidden rounded-lg border p-4 transition ${isRoleMatchesLoading ? 'border-indigo-400 bg-indigo-50 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-200/90 dark:border-indigo-500 dark:bg-indigo-950/40 dark:ring-indigo-800/70' : 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20'}`}>
            {isRoleMatchesLoading && (
              <>
                <div className="pointer-events-none absolute inset-0 animate-pulse bg-indigo-500/5 dark:bg-indigo-300/5" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-400/20 blur-2xl" />
              </>
            )}
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Gợi ý vai trò phù hợp với hồ sơ học tập</p>
                  {isRoleMatchesLoading && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-indigo-500/30">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang xử lý
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {isRoleMatchesLoading ? 'Đang phân tích mức phù hợp từ dữ liệu dự án. Quá trình này có thể mất vài giây.' : 'Chọn vai trò bạn muốn theo đuổi để tạo lộ trình học cá nhân hóa.'}
                </p>
                {isRoleMatchesLoading && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950">
                    <div className="h-full w-2/3 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 shadow-sm" />
                  </div>
                )}
              </div>
              {roleMatches[0] && (
                <div className="shrink-0 sm:text-right">
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{Math.round(roleMatches[0].matchScore)}%</p>
                  <p className="text-xs text-slate-500">mức phù hợp cao nhất</p>
                </div>
              )}
            </div>
            {(roleMatchSource || canGenerate) && (
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <div className="rounded-md bg-white/70 p-2 dark:bg-slate-900/70">
                  <p className="text-xs text-slate-500">Nguồn dữ liệu</p>
                  <p className="text-sm font-semibold">{sourceModeLabel(sourceMode)}</p>
                </div>
                <div className="rounded-md bg-white/70 p-2 dark:bg-slate-900/70">
                  <p className="text-xs text-slate-500">Dự án đã dùng</p>
                  <p className="text-sm font-semibold">{sourceDisplay.totalRepositories}</p>
                </div>
                <div className="rounded-md bg-white/70 p-2 dark:bg-slate-900/70">
                  <p className="text-xs text-slate-500">Đóng góp của bạn</p>
                  <p className="text-sm font-semibold">{sourceDisplay.totalUserCommits}</p>
                </div>
                <div className="rounded-md bg-white/70 p-2 dark:bg-slate-900/70">
                  <p className="text-xs text-slate-500">Mức sẵn sàng</p>
                  <p className="text-sm font-semibold">{sourceDisplay.userReadinessScore ?? 0}% · {formatUserLevel(sourceDisplay.userLevel)}</p>
                </div>
              </div>
            )}
          </div>

          {roleMatchError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {roleMatchError}
            </p>
          )}

          {roleMatches.length > 0 ? (
            <div className="space-y-3">
              <RoleSuggestionCard
                match={roleMatches[0]}
                featured
                isGenerating={isGenerating && generatingKey === `role:${roleMatches[0].roleId}`}
                disabled={!canGenerate || isGenerating}
                onCreate={(match) => handleGenerate(match, `role:${match.roleId}`)}
              />
              {roleMatches.length > 1 && (
                <div className="grid gap-3 lg:grid-cols-2">
                  {roleMatches.slice(1).map((match) => (
                    <RoleSuggestionCard
                      key={match.roleId}
                      match={match}
                      isGenerating={isGenerating && generatingKey === `role:${match.roleId}`}
                      disabled={!canGenerate || isGenerating}
                      onCreate={(selectedMatch) => handleGenerate(selectedMatch, `role:${selectedMatch.roleId}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : !isRoleMatchesLoading && (
            <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Chưa có gợi ý vai trò. Hãy chọn ít nhất một dự án đã phân tích để hệ thống đề xuất lộ trình phù hợp.
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${statusFilter === 'active' ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}
              onClick={() => setStatusFilter('active')}
            >
              Đang học
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${statusFilter === 'archived' ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}
              onClick={() => setStatusFilter('archived')}
            >
              Lưu trữ
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_160px_170px_150px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                aria-label="Tìm roadmap"
                placeholder="Tìm theo tên roadmap, kỹ năng hoặc vai trò"
                className="pl-9"
                value={filters.search}
                onChange={(event) => setFilters({ search: event.target.value })}
              />
            </div>
            <select
              aria-label="Lọc theo danh mục"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={filters.category}
              onChange={(event) => setFilters({ category: event.target.value as typeof filters.category })}
            >
              {categories.map((category) => (
                <option key={category} value={category}>{formatCategoryFilter(category)}</option>
              ))}
            </select>
            <select
              aria-label="Lọc theo cấp độ"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={filters.difficulty}
              onChange={(event) => setFilters({ difficulty: event.target.value as typeof filters.difficulty })}
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>{formatDifficultyFilter(difficulty)}</option>
              ))}
            </select>
            <select
              aria-label="Lọc theo thời lượng"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={filters.duration}
              onChange={(event) => setFilters({ duration: event.target.value as typeof filters.duration })}
            >
              {durations.map((duration) => (
                <option key={duration} value={duration}>{formatDurationFilter(duration)}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
              {statusFilter === 'active' ? 'Lộ trình đang học' : 'Lộ trình đã lưu trữ'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {statusFilter === 'active'
                ? 'Các lộ trình đang nằm trong kế hoạch học chính và có thể tiếp tục đánh dấu tiến độ.'
                : 'Các lộ trình đã được cất khỏi kế hoạch học chính để bạn xem lại khi cần.'}
            </p>
          </div>
          <Badge variant="default">{filteredRoadmaps.length} lộ trình</Badge>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => <RoadmapSkeleton key={item} />)}
          </div>
        ) : filteredRoadmaps.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleRoadmaps.map((roadmap) => <RoadmapCard key={roadmap.id} roadmap={roadmap} />)}
            </div>
            {filteredRoadmaps.length > ROADMAPS_PER_PAGE && (
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Hiển thị {Math.min((page - 1) * ROADMAPS_PER_PAGE + 1, filteredRoadmaps.length)}-{Math.min(page * ROADMAPS_PER_PAGE, filteredRoadmaps.length)} / {filteredRoadmaps.length} lộ trình
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Trước
                  </Button>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                    Sau
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : roadmaps.length > 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="font-medium text-slate-900 dark:text-slate-100">Không có lộ trình phù hợp bộ lọc</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Hãy thử từ khóa khác hoặc đặt lại bộ lọc.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>{statusFilter === 'active' ? 'Chưa có lộ trình đang học' : 'Chưa có lộ trình đã lưu trữ'}</CardTitle>
              <CardDescription>
                {statusFilter === 'active'
                  ? 'Tạo lộ trình đầu tiên để bắt đầu học theo mục tiêu nghề nghiệp của bạn.'
                  : 'Khi bạn lưu trữ lộ trình, chúng sẽ xuất hiện ở đây để xem lại sau.'}
              </CardDescription>
            </CardHeader>
            {statusFilter === 'active' && (
              <CardContent className="flex justify-center pb-8">
                <Button isLoading={isGenerating && generatingKey === 'first'} disabled={!canGenerate || isGenerating} onClick={() => handleGenerate(undefined, 'first')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Tạo lộ trình đầu tiên
                </Button>
              </CardContent>
            )}
          </Card>
        )}
      </section>
    </div>
  )
}


