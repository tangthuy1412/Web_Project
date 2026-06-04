import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AlertCircle, ArrowLeft, BookOpen, Bot, CheckCircle2, ExternalLink, FileJson, GitCommit, GitFork, Lightbulb, Play, RefreshCw, Star, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatRelativeTime } from '../../lib/utils'

const preview = (value: unknown) => {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

export const RepositoryDetailPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const {
    repositories,
    selectedRepository,
    packagesByRepoId,
    commitsByRepoId,
    feedbackByRepoId,
    fetchRepository,
    fetchPackages,
    fetchCommits,
    analyzeRepository,
    generateFeedback,
    fetchFeedback,
    isLoading,
    isAnalyzing,
    isGeneratingFeedback,
    error
  } = useRepositoryStore()
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [commitsLoading, setCommitsLoading] = useState(false)

  const repository = useMemo(() => {
    return repositories.find((repo) => repo.id === id) ?? selectedRepository
  }, [id, repositories, selectedRepository])
  const packages = packagesByRepoId[id] ?? []
  const commits = commitsByRepoId[id] ?? []
  const feedback = feedbackByRepoId[id]
  const analysisRoute = `/repositories/${id}/analysis`

  useEffect(() => {
    if (!repository && id) fetchRepository(id)
    fetchPackages(id).catch(() => undefined)
    fetchCommits(id).catch(() => undefined)
    fetchFeedback(id).catch(() => undefined)
  }, [fetchCommits, fetchFeedback, fetchPackages, fetchRepository, id, repository])

  const handleAnalyze = async () => {
    const result = await analyzeRepository(id)
    navigate(`/repositories/${result.repositoryId || id}/analysis`)
  }

  const handleFetchPackages = async () => {
    setPackagesLoading(true)
    try {
      await fetchPackages(id, true)
    } finally {
      setPackagesLoading(false)
    }
  }

  const handleFetchCommits = async () => {
    setCommitsLoading(true)
    try {
      await fetchCommits(id, true)
    } finally {
      setCommitsLoading(false)
    }
  }

  const handleGenerateFeedback = async () => {
    await generateFeedback(id)
  }

  if (isLoading && !repository) {
    return <div className="text-sm text-slate-500">Đang tải repository...</div>
  }

  if (!repository) {
    return (
      <div className="max-w-4xl">
        <p className="text-slate-500">Không tìm thấy repository.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <Link to="/repositories" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          <ArrowLeft className="h-4 w-4" />
          Quay lại repositories
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {repository.name}
            </h1>
            {repository.description && (
              <p className="mt-2 text-slate-500 dark:text-slate-400">{repository.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Badge variant="info">{repository.language}</Badge>
              <span className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400"><Star className="h-4 w-4" />{repository.stars}</span>
              <span className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400"><GitFork className="h-4 w-4" />{repository.forks}</span>
              <span className="text-sm text-slate-500">Cập nhật {formatRelativeTime(repository.updatedAt)}</span>
              <a href={repository.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                GitHub <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {repository.analyzed && (
              <Link to={analysisRoute}>
                <Button variant="outline">
                  Xem phân tích
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleFetchPackages} isLoading={packagesLoading}>
              <FileJson className="mr-2 h-4 w-4" />
              Tải packages
            </Button>
            <Button variant="outline" onClick={handleFetchCommits} isLoading={commitsLoading}>
              <GitCommit className="mr-2 h-4 w-4" />
              Tải commits
            </Button>
            <Button onClick={handleAnalyze} isLoading={isAnalyzing}>
              <Play className="mr-2 h-4 w-4" />
              Phân tích
            </Button>
            <Button variant="outline" onClick={handleGenerateFeedback} isLoading={isGeneratingFeedback}>
              <Bot className="mr-2 h-4 w-4" />
              Tạo AI feedback
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Phân tích repository này
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Hệ thống sẽ đồng bộ packages, commits, chạy phân tích và lấy kết quả mới nhất cho repo đang mở: {repository.fullName || repository.name}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={repository.private ? 'warning' : 'success'}>{repository.private ? 'Private' : 'Public'}</Badge>
                <Badge variant={repository.hasReadme ? 'success' : 'default'}>{repository.hasReadme ? 'Có README' : 'Thiếu README'}</Badge>
                <Badge variant={repository.analyzed ? 'success' : 'default'}>{repository.analyzed ? 'Đã có phân tích' : 'Chưa có phân tích'}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAnalyze} isLoading={isAnalyzing}>
                <Play className="mr-2 h-4 w-4" />
                {repository.analyzed ? 'Phân tích lại' : 'Phân tích ngay'}
              </Button>
              {repository.analyzed && (
                <Link to={analysisRoute}>
                  <Button variant="outline">Xem kết quả</Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5" />Packages / file cấu hình</CardTitle>
          </CardHeader>
          <CardContent>
            {packages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                Chưa có packages cached. Bấm Tải packages để đồng bộ.
              </div>
            ) : (
              <div className="space-y-3">
                {packages.slice(0, 8).map((item, index) => (
                  <pre key={index} className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                    {preview(item)}
                  </pre>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GitCommit className="h-5 w-5" />Lịch sử commit</CardTitle>
          </CardHeader>
          <CardContent>
            {commits.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                Chưa có commits cached. Bấm Tải commits để đồng bộ.
              </div>
            ) : (
              <div className="space-y-3">
                {commits.slice(0, 12).map((item, index) => (
                  <pre key={index} className="max-h-36 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {preview(item)}
                  </pre>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI feedback cho repository này</CardTitle>
        </CardHeader>
        <CardContent>
          {feedback ? (
            <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{feedback.projectType || repository.language || 'Project'}</Badge>
                  {feedback.careerDirection && <Badge variant="success">{feedback.careerDirection}</Badge>}
                  {(feedback.generatedAt || feedback.createdAt) && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Tạo lúc {formatRelativeTime(feedback.generatedAt || feedback.createdAt || '')}
                    </span>
                  )}
                </div>
                {feedback.summary && (
                  <p className="mt-3 leading-6 text-slate-700 dark:text-slate-300">{feedback.summary}</p>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Feedback điểm mạnh
                  </h4>
                  {feedback.strengthFeedback?.length ? (
                    <ul className="space-y-2">
                      {feedback.strengthFeedback.map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  ) : <p>Chưa có feedback điểm mạnh.</p>}
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4" />
                    Feedback điểm yếu
                  </h4>
                  {feedback.weaknessFeedback?.length ? (
                    <ul className="space-y-2">
                      {feedback.weaknessFeedback.map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  ) : <p>Chưa có feedback điểm yếu.</p>}
                </div>
              </div>

              {feedback.learningAdvice && (
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                    <BookOpen className="h-4 w-4" />
                    Gợi ý học tập
                  </h4>
                  <p className="leading-6">{feedback.learningAdvice}</p>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                    <Target className="h-4 w-4" />
                    Bước tiếp theo
                  </h4>
                  {feedback.nextSteps?.length ? (
                    <ul className="space-y-2">
                      {feedback.nextSteps.map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  ) : <p>Chưa có bước tiếp theo.</p>}
                </div>

                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                    <Lightbulb className="h-4 w-4" />
                    Chủ đề nên học
                  </h4>
                  {feedback.recommendedTopics?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {feedback.recommendedTopics.map((item) => <Badge key={item} variant="default">{item}</Badge>)}
                    </div>
                  ) : <p>Chưa có chủ đề gợi ý.</p>}
                </div>
              </div>

              {(feedback.careerSuggestion || feedback.portfolioAdvice) && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {feedback.careerSuggestion && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
                      <h4 className="mb-2 font-semibold text-indigo-800 dark:text-indigo-300">Gợi ý nghề nghiệp</h4>
                      <p className="leading-6">{feedback.careerSuggestion}</p>
                    </div>
                  )}
                  {feedback.portfolioAdvice && (
                    <div className="rounded-lg border border-cyan-200 bg-cyan-50/60 p-4 dark:border-cyan-900 dark:bg-cyan-950/20">
                      <h4 className="mb-2 font-semibold text-cyan-800 dark:text-cyan-300">Gợi ý portfolio</h4>
                      <p className="leading-6">{feedback.portfolioAdvice}</p>
                    </div>
                  )}
                </div>
              )}

              {feedback.riskNotes?.length ? (
                <div className="rounded-lg border border-red-200 bg-red-50/60 p-4 dark:border-red-900 dark:bg-red-950/20">
                  <h4 className="mb-3 font-semibold text-red-800 dark:text-red-300">Lưu ý rủi ro</h4>
                  <ul className="space-y-2">
                    {feedback.riskNotes.map((item) => <li key={item}>- {item}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
              <span>Chưa có feedback. Cần có kết quả phân tích trước khi tạo feedback.</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fetchFeedback(id)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tải lại
                </Button>
                <Button onClick={handleGenerateFeedback} isLoading={isGeneratingFeedback}>
                  <Bot className="mr-2 h-4 w-4" />
                  Tạo feedback
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
