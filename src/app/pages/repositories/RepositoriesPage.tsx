import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AlertCircle, ArrowRight, ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, GitFork, Loader2, MessageSquare, Play, RefreshCw, Search, Star } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { useChatStore } from '../../stores/chatStore'
import { formatRelativeTime } from '../../lib/utils'

const REPOSITORIES_PER_PAGE = 10
type AnalysisFilter = 'all' | 'analyzed' | 'pending'
type RepositorySort = 'updated' | 'name' | 'language' | 'stars' | 'readiness'

export const RepositoriesPage = () => {
  const navigate = useNavigate()
  const { repositories, analyses, fetchRepositories, fetchMyAnalyses, analyzeRepository, isLoading, error } = useRepositoryStore()
  const createSession = useChatStore(state => state.createSession)
  const [search, setSearch] = useState('')
  const [analysisFilter, setAnalysisFilter] = useState<AnalysisFilter>('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [sortBy, setSortBy] = useState<RepositorySort | null>(null)
  const [analyzingRepoId, setAnalyzingRepoId] = useState<string | null>(null)
  const [creatingChatRepoId, setCreatingChatRepoId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchRepositories().catch(() => undefined)
    fetchMyAnalyses().catch(() => undefined)
  }, [fetchMyAnalyses, fetchRepositories])

  const analysisByRepoId = useMemo(() => {
    return analyses.reduce(
      (map, analysis) => {
        if (analysis.repositoryId) map[analysis.repositoryId] = analysis
        return map
      },
      {} as Record<string, typeof analyses[number]>
    )
  }, [analyses])

  const languageOptions = useMemo(() => {
    return Array.from(new Set(repositories.map((repo) => repo.language).filter(Boolean)))
      .sort((left, right) => left.localeCompare(right, 'vi'))
  }, [repositories])

  const filteredRepositories = useMemo(() => {
    const keyword = search.toLowerCase().trim()
    const filtered = repositories.filter((repo) => {
      const hasAnalysis = Boolean(analysisByRepoId[repo.id] || repo.analyzed)
      const matchesSearch = !keyword || [repo.name, repo.fullName, repo.description, repo.language].some((value) =>
        value?.toLowerCase().includes(keyword)
      )
      const matchesStatus = analysisFilter === 'all' || (analysisFilter === 'analyzed' ? hasAnalysis : !hasAnalysis)
      const matchesLanguage = languageFilter === 'all' || repo.language === languageFilter
      return matchesSearch && matchesStatus && matchesLanguage
    })

    return [...filtered].sort((left, right) => {
      if (sortBy === 'name') return left.name.localeCompare(right.name, 'vi')
      if (sortBy === 'language') return (left.language || 'Khác').localeCompare(right.language || 'Khác', 'vi')
      if (sortBy === 'stars') return right.stars - left.stars || right.forks - left.forks
      if (sortBy === 'readiness') {
        const leftScore = analysisByRepoId[left.id]?.summary?.userReadinessScore ?? -1
        const rightScore = analysisByRepoId[right.id]?.summary?.userReadinessScore ?? -1
        return rightScore - leftScore
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    })
  }, [analysisByRepoId, analysisFilter, languageFilter, repositories, search, sortBy])
  const totalPages = Math.max(1, Math.ceil(filteredRepositories.length / REPOSITORIES_PER_PAGE))
  const visibleRepositories = filteredRepositories.slice((page - 1) * REPOSITORIES_PER_PAGE, page * REPOSITORIES_PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [analysisFilter, languageFilter, repositories.length, search, sortBy])

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const handleAnalyze = async (repoId: string, forceRegenerate = false) => {
    try {
      setAnalyzingRepoId(repoId)
      const result = await analyzeRepository(repoId, { forceRegenerate })
      navigate(`/repositories/${result.repositoryId || repoId}`)
    } finally {
      setAnalyzingRepoId(null)
    }
  }

  const handleAskAi = async (repo: typeof repositories[number]) => {
    try {
      setCreatingChatRepoId(repo.id)
      await createSession({
        title: `Tư vấn ${repo.name}`,
        repositoryId: repo.id
      })
      navigate('/chat')
    } finally {
      setCreatingChatRepoId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Dự án GitHub
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Đồng bộ dự án từ GitHub, xem dữ liệu đã lưu và chạy phân tích cho từng dự án.
          </p>
        </div>
        <Button onClick={() => fetchRepositories(true)} isLoading={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Đồng bộ dự án
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card className="p-4 lg:p-6">
        <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_auto_auto_auto] lg:items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm dự án..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <select
            aria-label="Lọc theo ngôn ngữ"
            value={languageFilter}
            onChange={(event) => setLanguageFilter(event.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="all">Tất cả ngôn ngữ</option>
            {languageOptions.map((language) => <option key={language} value={language}>{language}</option>)}
          </select>
          <select
            aria-label="Sắp xếp dự án"
            value={sortBy ?? ''}
            onChange={(event) => setSortBy(event.target.value ? event.target.value as RepositorySort : null)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Thứ tự mặc định</option>
            <option value="updated">Cập nhật gần nhất</option>
            <option value="name">Tên A-Z</option>
            <option value="language">Ngôn ngữ A-Z</option>
            <option value="stars">Nhiều lượt đánh dấu nhất</option>
            <option value="readiness">Mức sẵn sàng cao nhất</option>
          </select>
          <p className="whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{filteredRepositories.length} dự án</p>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {([
            ['all', 'Tất cả'],
            ['analyzed', 'Đã phân tích'],
            ['pending', 'Chưa phân tích']
          ] as Array<[AnalysisFilter, string]>).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAnalysisFilter((current) => value !== 'all' && current === value ? 'all' : value)}
              className={`h-8 rounded-md border px-3 text-sm font-medium transition ${analysisFilter === value ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Đang tải dự án...
          </div>
        ) : filteredRepositories.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium text-slate-900 dark:text-slate-100">Chưa có dự án</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Hãy kết nối GitHub và bấm Đồng bộ dự án để lấy dữ liệu thật.
            </p>
          </div>
        ) : (
          <div className="min-h-[690px] overflow-visible">
            <div className="space-y-3 xl:hidden">
              {visibleRepositories.map((repo) => {
                const analysis = analysisByRepoId[repo.id]
                const hasAnalysis = Boolean(analysis || repo.analyzed)
                const isRepoAnalyzing = analyzingRepoId === repo.id
                const analysisSummary = analysis?.summary
                const analysisOverall = Math.round(analysisSummary?.overallScore ?? analysis?.scores.overallScore ?? analysis?.scores.overall ?? 0)
                const analysisReadiness = typeof analysisSummary?.userReadinessScore === 'number' ? Math.round(analysisSummary.userReadinessScore) : undefined
                const analysisScoreLabel = analysisReadiness !== undefined ? 'Mức sẵn sàng ' + analysisReadiness + '%' : analysisOverall ? 'Điểm tổng quan ' + analysisOverall : ''

                return (
                  <article key={repo.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/repositories/${repo.id}`} className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                          {repo.name}
                        </Link>
                        {repo.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{repo.description}</p>}
                      </div>
                      <a href={repo.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <Button variant="ghost" size="sm" title="Mở trên GitHub">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Badge variant="default">{repo.language || 'Khác'}</Badge>
                      <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />{repo.stars}</span>
                      <span className="inline-flex items-center gap-1"><GitFork className="h-3.5 w-3.5" />{repo.forks}</span>
                      <span>{formatRelativeTime(repo.updatedAt)}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {hasAnalysis ? <Badge variant="success">Đã phân tích</Badge> : <Badge variant="default">Chưa phân tích</Badge>}
                      {analysisScoreLabel && <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{analysisScoreLabel}</span>}
                    </div>

                    {analysis && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {analysisSummary?.careerDirection || analysis.careerDirection.primary}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      {hasAnalysis && (
                        <Link to={`/repositories/${repo.id}`}>
                          <Button variant="outline" size="sm" className="w-full whitespace-nowrap sm:w-auto">Xem chi tiết</Button>
                        </Link>
                      )}
                      {hasAnalysis && (
                        <Button variant="outline" size="sm" className="w-full whitespace-nowrap sm:w-auto" onClick={() => handleAskAi(repo)} isLoading={creatingChatRepoId === repo.id}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Hỏi AI
                        </Button>
                      )}
                      <Button size="sm" className="col-span-2 w-full whitespace-nowrap sm:w-auto" onClick={() => handleAnalyze(repo.id, hasAnalysis)} disabled={isRepoAnalyzing}>
                        {isRepoAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : hasAnalysis ? <RefreshCw className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isRepoAnalyzing ? 'Đang phân tích...' : hasAnalysis ? 'Phân tích lại' : 'Phân tích'}
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
            <table className="hidden w-full table-fixed text-sm xl:table">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[34%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  {([
                    ['Dự án', 'name'],
                    ['Ngôn ngữ', 'language'],
                    ['Thống kê', 'stars'],
                    ['Phân tích', 'readiness'],
                    ['Cập nhật', 'updated']
                  ] as Array<[string, RepositorySort]>).map(([label, value]) => (
                    <th key={value} className="whitespace-nowrap px-2 py-3 font-medium lg:px-4">
                      <button
                        type="button"
                        onClick={() => setSortBy((current) => current === value ? null : value)}
                        className="inline-flex items-center gap-1.5 transition hover:text-indigo-600 dark:hover:text-indigo-400"
                        aria-label={sortBy === value ? `Bỏ sắp xếp theo ${label.toLowerCase()}` : `Sắp xếp theo ${label.toLowerCase()}`}
                        aria-pressed={sortBy === value}
                      >
                        {label}
                        <ArrowUpDown className={`h-3.5 w-3.5 ${sortBy === value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      </button>
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-2 py-3 text-right font-medium lg:px-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {visibleRepositories.map((repo) => {
                  const analysis = analysisByRepoId[repo.id]
                  const hasAnalysis = Boolean(analysis || repo.analyzed)
                  const isRepoAnalyzing = analyzingRepoId === repo.id
                  const analysisSummary = analysis?.summary
                  const analysisOverall = Math.round(analysisSummary?.overallScore ?? analysis?.scores.overallScore ?? analysis?.scores.overall ?? 0)
                  const analysisReadiness = typeof analysisSummary?.userReadinessScore === 'number' ? Math.round(analysisSummary.userReadinessScore) : undefined
                  const analysisScoreLabel = analysisReadiness !== undefined ? 'Mức sẵn sàng ' + analysisReadiness + '%' : analysisOverall ? 'Điểm tổng quan ' + analysisOverall : ''

                  return (
                    <tr key={repo.id} className="h-[76px] border-b border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                      <td className="px-2 py-3 align-middle lg:px-4">
                        <Link to={`/repositories/${repo.id}`} className="group inline-flex max-w-full items-center gap-2 font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                          <span className="truncate">{repo.name}</span>
                          <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                        {repo.description && (
                          <p className="mt-1 line-clamp-1 max-w-full text-sm text-slate-500 dark:text-slate-400">
                            {repo.description}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-3 align-middle lg:px-4">
                        <Badge variant="default">{repo.language || 'Khác'}</Badge>
                      </td>
                      <td className="px-2 py-3 align-middle lg:px-4">
                        <div className="flex flex-nowrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1"><Star className="h-4 w-4" />{repo.stars}</span>
                          <span className="inline-flex items-center gap-1"><GitFork className="h-4 w-4" />{repo.forks}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-middle lg:px-4">
                        {analysis && (
                          <div className="mb-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            <p className="truncate">{analysisSummary?.careerDirection || analysis.careerDirection.primary}</p>
                            {analysisScoreLabel && <p className="truncate">{analysisScoreLabel}</p>}
                          </div>
                        )}
                        {hasAnalysis ? <Badge variant="success">Đã phân tích</Badge> : <Badge variant="default">Chưa phân tích</Badge>}
                      </td>
                      <td className="px-2 py-3 align-middle text-sm text-slate-500 dark:text-slate-400 lg:px-4">
                        <span className="block truncate">{formatRelativeTime(repo.updatedAt)}</span>
                      </td>
                      <td className="px-2 py-3 align-middle lg:px-4">
                        <div className="flex items-center justify-end gap-2.5 whitespace-nowrap">
                          {hasAnalysis ? (
                            <>
                              <Link className="shrink-0" to={`/repositories/${repo.id}`}>
                                <Button variant="outline" size="sm" className="whitespace-nowrap">
                                  Xem chi tiết
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm" className="shrink-0 whitespace-nowrap" onClick={() => handleAskAi(repo)} isLoading={creatingChatRepoId === repo.id}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Hỏi AI
                              </Button>
                              <Button size="sm" className="shrink-0 whitespace-nowrap" onClick={() => handleAnalyze(repo.id, true)} disabled={isRepoAnalyzing}>
                                {isRepoAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                {isRepoAnalyzing ? 'Đang phân tích...' : 'Phân tích lại'}
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" className="shrink-0 whitespace-nowrap" onClick={() => handleAnalyze(repo.id)} disabled={isRepoAnalyzing}>
                              {isRepoAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                              {isRepoAnalyzing ? 'Đang phân tích...' : 'Phân tích'}
                            </Button>
                          )}
                          <a className="shrink-0" href={repo.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" title="Mở trên GitHub">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredRepositories.length > REPOSITORIES_PER_PAGE && (
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hiển thị {Math.min((page - 1) * REPOSITORIES_PER_PAGE + 1, filteredRepositories.length)}-{Math.min(page * REPOSITORIES_PER_PAGE, filteredRepositories.length)} / {filteredRepositories.length} dự án
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
      </Card>
    </div>
  )
}
