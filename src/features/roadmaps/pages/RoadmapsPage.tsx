import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Archive, BookmarkCheck, BrainCircuit, ChevronLeft, ChevronRight, FolderOpen, Search, Sparkles } from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import { Input } from '../../../app/components/ui/Input'
import { RoadmapCard } from '../components/RoadmapCard'
import { RoadmapSkeleton } from '../components/RoadmapSkeleton'
import { useRepositoryStore } from '../../../app/stores/repositoryStore'
import { useRoadmapStore } from '../stores/roadmapStore'
import type { RoadmapCategory, RoadmapDifficulty } from '../types'
import { buildRepositoryAnalysisOverview } from '../../../app/services/analysis/analysisOverview'
import { getSuggestedRoadmapRoles, recommendJobReadinessRoadmaps, recommendRoadmapRole, type RoadmapRoleRecommendation } from '../utils/roadmapRecommendation'
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
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active')
  const [page, setPage] = useState(1)
  const analysisOverview = buildRepositoryAnalysisOverview(analyses)
  const recommendedRoadmap = recommendRoadmapRole(analyses)
  const jobReadinessRoadmaps = recommendJobReadinessRoadmaps(analyses)
  const suggestedTargetRoles = useMemo(() => getSuggestedRoadmapRoles(analyses), [analyses])
  const repositoryId = analyses[0]?.repositoryId

  useEffect(() => {
    fetchRoadmaps({ status: statusFilter })
  }, [fetchRoadmaps, statusFilter])

  useEffect(() => {
    fetchMyAnalyses()
  }, [fetchMyAnalyses])

  useEffect(() => {
    if (!suggestedTargetRoles.some((role) => role === targetRole)) {
      setTargetRole(suggestedTargetRoles[0])
    }
  }, [suggestedTargetRoles, targetRole])

  const handleGenerate = async () => {
    const recommendation = await generateAIRoadmap(targetRole, false, repositoryId)
    if (recommendation) {
      navigate(`/roadmaps/${recommendation.roadmap.slug}`)
    }
  }

  const handleGenerateRecommended = async () => {
    if (!recommendedRoadmap) return

    const recommendation = await generateAIRoadmap(recommendedRoadmap.role, false, repositoryId)
    if (recommendation) {
      navigate(`/roadmaps/${recommendation.roadmap.slug}`)
    }
  }

  const handleGenerateSuggestion = async (suggestion: RoadmapRoleRecommendation) => {
    const recommendation = await generateAIRoadmap(suggestion.role, false, repositoryId)
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
        <Link to="/roadmaps/ai">
          <Button size="lg">
            <BrainCircuit className="mr-2 h-5 w-5" />
            Tạo roadmap mới
          </Button>
        </Link>
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
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-semibold text-slate-950 dark:text-slate-50">Bạn muốn đi theo hướng nào tiếp theo?</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chọn vai trò mục tiêu, hệ thống sẽ tạo hoặc mở lại roadmap phù hợp với tài khoản của bạn.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(260px,1fr)_auto]">
            <select
              aria-label="Vai trò mục tiêu"
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {suggestedTargetRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <Button isLoading={isGenerating} onClick={handleGenerate}>
              <Sparkles className="mr-2 h-4 w-4" />
              Tạo lộ trình
            </Button>
          </div>
          {error && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200 lg:col-span-2">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-semibold text-slate-950 dark:text-slate-50">AI đề xuất roadmap phù hợp</p>
              {recommendedRoadmap ? (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Đề xuất chính: <span className="font-medium text-indigo-600 dark:text-indigo-300">{recommendedRoadmap.role}</span>. {recommendedRoadmap.reason}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Chưa có đủ dữ liệu phân tích repository. Hãy phân tích ít nhất một repository để AI đề xuất hướng đi phù hợp hơn.
                </p>
              )}
            </div>
            <Button isLoading={isGenerating} disabled={!recommendedRoadmap} onClick={handleGenerateRecommended}>
              <Sparkles className="mr-2 h-4 w-4" />
              Tạo theo đề xuất chính
            </Button>
          </div>

          {jobReadinessRoadmaps.length > 0 && (
            <div>
              <div className="mb-3">
                <p className="font-medium text-slate-900 dark:text-slate-100">2 đề xuất phụ để tăng khả năng xin việc</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Các lộ trình phụ tập trung vào những tín hiệu nhà tuyển dụng thường kiểm tra: kiểm thử, triển khai, CI/CD, tài liệu và chất lượng code.
                </p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {jobReadinessRoadmaps.map((suggestion) => (
                  <div key={suggestion.role} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Badge variant="warning">Phụ trợ xin việc</Badge>
                        <p className="mt-2 font-semibold text-slate-950 dark:text-slate-50">{suggestion.title}</p>
                        <p className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-300">{suggestion.role}</p>
                      </div>
                      <Button size="sm" variant="outline" isLoading={isGenerating} onClick={() => handleGenerateSuggestion(suggestion)}>
                        Tạo lộ trình
                      </Button>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{suggestion.reason}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Trọng tâm: {suggestion.focus}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tổng quan từ các repository đã phân tích</CardTitle>
          <CardDescription>
            Đây là bức tranh chung được tổng hợp từ toàn bộ kết quả phân tích repository trong tài khoản của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysisOverview ? (
            <div className="space-y-5">
              <p className="text-sm text-slate-600 dark:text-slate-300">{analysisOverview.summary}</p>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{analysisOverview.repositoriesCount}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">repo đã phân tích</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{analysisOverview.averageOverallScore}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">điểm tổng quan TB</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{analysisOverview.averageTestingScore}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">testing TB</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{analysisOverview.averageDeploymentScore}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">deployment TB</p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Ngôn ngữ nổi bật</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisOverview.topLanguages.length ? analysisOverview.topLanguages.map((item) => (
                      <Badge key={item.label} variant="default">{item.label} · {item.count}</Badge>
                    )) : <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Framework nổi bật</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisOverview.topFrameworks.length ? analysisOverview.topFrameworks.map((item) => (
                      <Badge key={item.label} variant="info">{item.label} · {item.count}</Badge>
                    )) : <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Hướng nghề nghiệp nổi bật</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisOverview.topCareerDirections.length ? analysisOverview.topCareerDirections.map((item) => (
                      <Badge key={item.label} variant="success">{item.label} · {item.count}</Badge>
                    )) : <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Tín hiệu kỹ năng mạnh</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisOverview.strongestSignals.length ? analysisOverview.strongestSignals.map((item) => (
                      <Badge key={item.label} variant="success">{item.label}</Badge>
                    )) : <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Kỹ năng nên bổ sung</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisOverview.missingSkills.length ? analysisOverview.missingSkills.map((item) => (
                      <Badge key={item.label} variant="warning">{item.label}</Badge>
                    )) : <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
              <p className="font-medium text-slate-900 dark:text-slate-100">Chưa có dữ liệu tổng quan</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Hãy phân tích repository trước, sau đó AI sẽ tổng hợp điểm mạnh, điểm thiếu và hướng nghề nghiệp nổi bật từ tất cả repo.
              </p>
            </div>
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
                <Button isLoading={isGenerating} onClick={handleGenerate}>
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
