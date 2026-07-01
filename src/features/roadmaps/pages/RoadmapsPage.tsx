import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Archive, BookmarkCheck, ChevronLeft, ChevronRight, FolderOpen, Search, Sparkles } from 'lucide-react'
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
import { filterRoadmaps, formatCategoryFilter, formatDifficultyFilter, formatDurationFilter } from '../utils/roadmapUtils'

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

const skillLabel = (value: unknown) => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return String(record.skill ?? record.skillName ?? record.canonicalSkillName ?? record.name ?? '').trim()
  }
  return ''
}

const skillList = (value: unknown) => Array.isArray(value) ? value.map(skillLabel).filter(Boolean) : []

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
  const [forceRegenerate, setForceRegenerate] = useState(true)
  const [roleMatches, setRoleMatches] = useState<RoleMatch[]>([])
  const [roleMatchSource, setRoleMatchSource] = useState<{
    sourceMode?: string
    totalRepositories?: number
    totalUserCommits?: number
    userLevel?: string
    userReadinessScore?: number
    repositoryNames?: string[]
  } | null>(null)
  const [isMatchingRoles, setIsMatchingRoles] = useState(false)
  const [roleMatchError, setRoleMatchError] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active')
  const [page, setPage] = useState(1)
  const analyzedRepos = useMemo(() => {
    const repos = new Map<string, { id: string; name: string; level?: string; commits?: number }>()

    analyses.forEach((analysis) => {
      if (!analysis.repositoryId || repos.has(analysis.repositoryId)) return
      repos.set(analysis.repositoryId, {
        id: analysis.repositoryId,
        name: analysis.repositoryName || analysis.repoName || analysis.fullName || analysis.repositoryId,
        level: analysis.summary?.userLevel,
        commits: analysis.analysisScope?.userCommits
      })
    })

    return Array.from(repos.values())
  }, [analyses])
  const repositoryId = selectedRepoIds[0] || analyzedRepos[0]?.id
  const targetRoleOptions = useMemo(() => {
    return Array.from(new Set(roleMatches.map((match) => match.roleName))).slice(0, 5)
  }, [roleMatches])
  const canGenerate = sourceMode === 'all_analyzed_repos'
    ? analyzedRepos.length > 0
    : sourceMode === 'single_repo'
      ? Boolean(repositoryId)
      : selectedRepoIds.length > 0
  const effectiveTargetRole = targetRole || targetRoleOptions[0] || 'Backend Developer'
  const isRoleMatchesLoading = isMatchingRoles

  useEffect(() => {
    if (!selectedRepoIds.length && analyzedRepos[0]?.id) {
      setSelectedRepoIds([analyzedRepos[0].id])
    }
  }, [analyzedRepos, selectedRepoIds.length])

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
      limit: 5,
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
      setRoleMatchError(requestError instanceof Error ? requestError.message : 'Không thể tính role phù hợp.')
    }).finally(() => {
      if (isCurrent) setIsMatchingRoles(false)
    })

    return () => { isCurrent = false }
  }, [canGenerate, repositoryId, selectedRepoIds, sourceMode])

  const handleGenerate = async (role?: Pick<RoleMatch, 'roleId' | 'roleName'>) => {
    const selectedRole = role ?? roleMatches.find((match) => match.roleName === effectiveTargetRole) ?? roleMatches[0]
    const recommendation = await generateAIRoadmap(selectedRole?.roleName ?? effectiveTargetRole, {
      sourceMode,
      repoId: sourceMode === 'single_repo' ? repositoryId : undefined,
      repoIds: sourceMode === 'selected_repos' ? selectedRepoIds : undefined,
      roleId: selectedRole?.roleId,
      level,
      durationWeeks,
      language: 'vi',
      useRoleMatching,
      forceRegenerate
    })
    if (recommendation) {
      navigate(`/roadmaps/${recommendation.roadmap.slug}`)
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

  return (
    <div className="max-w-7xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Badge variant="info" className="mb-3">
            <Sparkles className="mr-1 h-3 w-3" />
            Roadmap cá nhân hóa
          </Badge>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-slate-50">Roadmap của tôi</h1>
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
              <p className="text-sm text-slate-500 dark:text-slate-400">{statusFilter === 'active' ? 'Roadmap đang học' : 'Roadmap trong kho lưu trữ'}</p>
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
              <p className="font-semibold text-slate-950 dark:text-slate-50">Tạo roadmap từ role phù hợp</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Chọn nguồn đánh giá, hệ thống lấy 5 role phù hợp nhất rồi tạo roadmap theo role bạn chọn.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                aria-label="Cấp độ roadmap"
                value={level}
                onChange={(event) => setLevel(event.target.value as typeof level)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <select
                aria-label="Thời lượng roadmap"
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
              { value: 'single_repo', label: 'Một repo', description: 'Match role theo 1 repo cụ thể.' },
              { value: 'selected_repos', label: 'Một vài repo', description: 'Tổng hợp các repo bạn chọn.' },
              { value: 'all_analyzed_repos', label: 'Tất cả repo', description: 'Dùng toàn bộ repo đã phân tích.' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-lg border p-3 text-left transition ${sourceMode === option.value ? 'border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-100' : 'border-slate-200 hover:border-indigo-300 dark:border-slate-800'}`}
                onClick={() => setSourceMode(option.value as RoadmapSourceMode)}
              >
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{option.description}</span>
              </button>
            ))}
          </div>

          {sourceMode === 'single_repo' && (
            <select
              aria-label="Repository nguồn"
              value={repositoryId ?? ''}
              onChange={(event) => setSelectedRepoIds(event.target.value ? [event.target.value] : [])}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {analyzedRepos.map((repo) => (
                <option key={repo.id} value={repo.id}>{repo.name}{repo.level ? ` - ${repo.level}` : ''}{typeof repo.commits === 'number' ? ` - ${repo.commits} commits` : ''}</option>
              ))}
            </select>
          )}

          {sourceMode === 'selected_repos' && (
            <div className="max-h-44 overflow-auto rounded-lg border border-slate-200 p-2 dark:border-slate-800">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {analyzedRepos.map((repo) => (
                  <label key={repo.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={selectedRepoIds.includes(repo.id)}
                      onChange={(event) => setSelectedRepoIds((current) =>
                        event.target.checked ? [...current, repo.id] : current.filter((repoId) => repoId !== repo.id)
                      )}
                    />
                    <span className="min-w-0 truncate">{repo.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={forceRegenerate}
              onChange={(event) => setForceRegenerate(event.target.checked)}
            />
            Tạo mới lại nếu đã có roadmap cùng role
          </label>

          <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">5 role phù hợp nhất</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {isRoleMatchesLoading ? 'Đang tính role phù hợp...' : 'Role match và tạo roadmap luôn dùng cùng sourceMode.'}
                </p>
              </div>
              {roleMatches[0] && (
                <div className="shrink-0 sm:text-right">
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{Math.round(roleMatches[0].matchScore)}%</p>
                  <p className="text-xs text-slate-500">role tốt nhất</p>
                </div>
              )}
            </div>
            {roleMatchSource && (
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <div className="rounded-md bg-white/70 p-2 dark:bg-slate-900/70">
                  <p className="text-xs text-slate-500">Source mode</p>
                  <p className="text-sm font-semibold">{roleMatchSource.sourceMode || sourceMode}</p>
                </div>
                <div className="rounded-md bg-white/70 p-2 dark:bg-slate-900/70">
                  <p className="text-xs text-slate-500">Repo</p>
                  <p className="text-sm font-semibold">{roleMatchSource.totalRepositories ?? (sourceMode === 'single_repo' ? 1 : selectedRepoIds.length)}</p>
                </div>
                <div className="rounded-md bg-white/70 p-2 dark:bg-slate-900/70">
                  <p className="text-xs text-slate-500">User commits</p>
                  <p className="text-sm font-semibold">{roleMatchSource.totalUserCommits ?? 0}</p>
                </div>
                <div className="rounded-md bg-white/70 p-2 dark:bg-slate-900/70">
                  <p className="text-xs text-slate-500">Readiness</p>
                  <p className="text-sm font-semibold">{roleMatchSource.userReadinessScore ?? 0}% · {roleMatchSource.userLevel || 'N/A'}</p>
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
            <div className="grid gap-3 lg:grid-cols-2">
              {roleMatches.map((match) => {
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

                return (
                  <article key={match.roleId} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-slate-50">{match.roleName}</p>
                        <p className="mt-1 text-xs text-slate-500">{match.matchLevelLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{Math.round(match.matchScore)}%</p>
                        <p className="text-xs text-slate-500">match</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium uppercase text-slate-500">Đã khớp</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.slice(0, 4).map((skill) => <Badge key={skill} variant="success">{skill}</Badge>)}
                        {!matchedSkills.length && <span className="text-xs text-slate-500">Chưa có kỹ năng khớp rõ.</span>}
                      </div>
                      <p className="text-xs font-medium uppercase text-slate-500">Cần bù đắp</p>
                      <div className="flex flex-wrap gap-1.5">
                        {weakSkills.slice(0, 3).map((skill) => <Badge key={skill} variant="warning">{skill}</Badge>)}
                        {missingSkills.slice(0, 4).map((skill) => <Badge key={skill} variant="default">{skill}</Badge>)}
                        {!weakSkills.length && !missingSkills.length && <span className="text-xs text-slate-500">Không có thiếu hụt nổi bật.</span>}
                      </div>
                      <p className="text-xs font-medium uppercase text-slate-500">Nên học tiếp</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendedSkills.slice(0, 5).map((skill) => <Badge key={skill} variant="info">{skill}</Badge>)}
                        {!recommendedSkills.length && <span className="text-xs text-slate-500">Chưa có đề xuất tiếp theo.</span>}
                      </div>
                    </div>
                    <Button className="mt-4 w-full" size="sm" isLoading={isGenerating} disabled={!canGenerate} onClick={() => handleGenerate(match)}>
                      Tạo roadmap
                    </Button>
                  </article>
                )
              })}
            </div>
          ) : !isRoleMatchesLoading && (
            <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Chưa có role match để tạo roadmap.
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
              {statusFilter === 'active' ? 'Roadmap đang học' : 'Roadmap lưu trữ'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {statusFilter === 'active'
                ? 'Các roadmap active, đang nằm trong lộ trình học chính và có thể tiếp tục đánh dấu tiến độ.'
                : 'Các roadmap archived, đã được cất khỏi lộ trình học chính để bạn xem lại khi cần.'}
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
              <p className="font-medium text-slate-900 dark:text-slate-100">Không có roadmap phù hợp bộ lọc</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Hãy thử từ khóa khác hoặc đặt lại bộ lọc.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>{statusFilter === 'active' ? 'Chưa có roadmap đang học' : 'Chưa có roadmap lưu trữ'}</CardTitle>
              <CardDescription>
                {statusFilter === 'active'
                  ? 'Tạo roadmap đầu tiên để bắt đầu một lộ trình học theo mục tiêu nghề nghiệp của bạn.'
                  : 'Khi bạn lưu trữ roadmap, chúng sẽ xuất hiện ở đây để xem lại sau.'}
              </CardDescription>
            </CardHeader>
            {statusFilter === 'active' && (
              <CardContent className="flex justify-center pb-8">
                <Button isLoading={isGenerating} disabled={!canGenerate} onClick={() => handleGenerate()}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Tạo roadmap đầu tiên
                </Button>
              </CardContent>
            )}
          </Card>
        )}
      </section>
    </div>
  )
}
