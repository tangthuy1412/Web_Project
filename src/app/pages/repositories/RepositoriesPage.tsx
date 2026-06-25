import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AlertCircle, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, GitFork, Loader2, Play, RefreshCw, Search, Star, XCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatRelativeTime } from '../../lib/utils'

const REPOSITORIES_PER_PAGE = 10

export const RepositoriesPage = () => {
  const navigate = useNavigate()
  const { repositories, analyses, fetchRepositories, fetchMyAnalyses, analyzeRepository, isLoading, error } = useRepositoryStore()
  const [search, setSearch] = useState('')
  const [analyzingRepoId, setAnalyzingRepoId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchRepositories().catch(() => undefined)
    fetchMyAnalyses().catch(() => undefined)
  }, [fetchMyAnalyses, fetchRepositories])

  const filteredRepositories = useMemo(() => {
    const keyword = search.toLowerCase().trim()
    if (!keyword) return repositories

    return repositories.filter((repo) =>
      [repo.name, repo.fullName, repo.description, repo.language].some((value) =>
        value?.toLowerCase().includes(keyword)
      )
    )
  }, [repositories, search])

  const analysisByRepoId = useMemo(() => {
    return analyses.reduce(
      (map, analysis) => {
        if (analysis.repositoryId) map[analysis.repositoryId] = analysis
        return map
      },
      {} as Record<string, typeof analyses[number]>
    )
  }, [analyses])
  const totalPages = Math.max(1, Math.ceil(filteredRepositories.length / REPOSITORIES_PER_PAGE))
  const visibleRepositories = filteredRepositories.slice((page - 1) * REPOSITORIES_PER_PAGE, page * REPOSITORIES_PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [search, repositories.length])

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const handleAnalyze = async (repoId: string) => {
    try {
      setAnalyzingRepoId(repoId)
      const result = await analyzeRepository(repoId)
      navigate(`/repositories/${result.repositoryId || repoId}/analysis`)
    } finally {
      setAnalyzingRepoId(null)
    }
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Repositories
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Đồng bộ repository từ GitHub, xem dữ liệu cached và chạy phân tích cho từng repo.
          </p>
        </div>
        <Button onClick={() => fetchRepositories(true)} isLoading={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Đồng bộ repositories
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card className="p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm repository..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredRepositories.length} repository
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Đang tải repository...
          </div>
        ) : filteredRepositories.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium text-slate-900 dark:text-slate-100">Chưa có repository</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Hãy kết nối GitHub và bấm Đồng bộ repositories để lấy dữ liệu thật.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  <th className="px-4 py-3 font-medium">Repository</th>
                  <th className="px-4 py-3 font-medium">Ngôn ngữ</th>
                  <th className="px-4 py-3 font-medium">Thống kê</th>
                  <th className="px-4 py-3 font-medium">README</th>
                  <th className="px-4 py-3 font-medium">Phân tích</th>
                  <th className="px-4 py-3 font-medium">Cập nhật</th>
                  <th className="px-4 py-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {visibleRepositories.map((repo) => {
                  const analysis = analysisByRepoId[repo.id]
                  const hasAnalysis = Boolean(analysis || repo.analyzed)
                  const isRepoAnalyzing = analyzingRepoId === repo.id

                  return (
                    <tr key={repo.id} className="border-b border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-4">
                        <Link to={`/repositories/${repo.id}`} className="group inline-flex items-center gap-2 font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                          {repo.name}
                          <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                        {repo.description && (
                          <p className="mt-1 max-w-md text-sm text-slate-500 line-clamp-2 dark:text-slate-400">
                            {repo.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="default">{repo.language}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1"><Star className="h-4 w-4" />{repo.stars}</span>
                          <span className="inline-flex items-center gap-1"><GitFork className="h-4 w-4" />{repo.forks}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {repo.hasReadme ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-slate-300 dark:text-slate-700" />}
                      </td>
                      <td className="px-4 py-4">
                        {hasAnalysis ? <Badge variant="success">Đã phân tích</Badge> : <Badge variant="default">Chưa phân tích</Badge>}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(repo.updatedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {hasAnalysis ? (
                            <>
                              <Link to={`/repositories/${repo.id}/analysis`}>
                                <Button variant="outline" size="sm">
                                  Xem phân tích
                                </Button>
                              </Link>
                              <Button size="sm" onClick={() => handleAnalyze(repo.id)} disabled={isRepoAnalyzing}>
                                {isRepoAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                {isRepoAnalyzing ? 'Đang phân tích...' : 'Phân tích lại'}
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" onClick={() => handleAnalyze(repo.id)} disabled={isRepoAnalyzing}>
                              {isRepoAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                              {isRepoAnalyzing ? 'Đang phân tích...' : 'Phân tích'}
                            </Button>
                          )}
                          <a href={repo.url} target="_blank" rel="noopener noreferrer">
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
              Hiển thị {Math.min((page - 1) * REPOSITORIES_PER_PAGE + 1, filteredRepositories.length)}-{Math.min(page * REPOSITORIES_PER_PAGE, filteredRepositories.length)} / {filteredRepositories.length} repository
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
