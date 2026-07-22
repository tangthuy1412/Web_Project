import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AlertCircle, ArrowLeft, BookOpen, Bot, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, FileJson, Flag, GitCommit, GitFork, Lightbulb, MessageSquare, Play, RefreshCw, Send, Star, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { RoleMatchPanel } from '../../components/analysis/RoleMatchPanel'
import { useChatStore } from '../../stores/chatStore'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatRelativeTime } from '../../lib/utils'
import { getApiErrorMessage } from '../../services/apis/core'
import { reportApi } from '../../services/apis/repositories'
import type { RoleOption } from '../../types'

const reportReasons = [
  'Nội dung không phù hợp',
  'Repository có nội dung gây hiểu nhầm',
  'Repository chứa nội dung spam',
  'Repository có dấu hiệu lạm dụng',
  'Thông tin repository không chính xác',
  'Khác'
]
const COMMITS_PER_PAGE = 5
const FEEDBACK_LIST_LIMIT = 5
const TOPIC_LIMIT = 8
const PACKAGE_BADGE_LIMIT = 10

const asRecord = (value: unknown) => value && typeof value === 'object' ? value as Record<string, unknown> : {}
const asArray = (value: unknown) => Array.isArray(value) ? value : []
const asStringList = (value: unknown) => asArray(value).map(String).filter(Boolean)
const textOf = (...values: unknown[]) => {
  const found = values.find((value) => typeof value === 'string' && value.trim())
  return typeof found === 'string' ? found : ''
}

const getPackageAnalysis = (items: unknown[]) => {
  const first = asRecord(items[0])
  return Array.isArray(first.detectedFiles) || Array.isArray(first.packages) || Array.isArray(first.frameworks)
    ? first
    : {}
}

const getCommitInfo = (item: unknown) => {
  const record = asRecord(item)
  return {
    sha: textOf(record.sha, record.hash, record.id),
    message: textOf(record.message).split('\n')[0] || 'Commit không có message',
    authorName: textOf(record.authorName, record.author),
    authorDate: textOf(record.authorDate, record.date, record.createdAt),
    htmlUrl: textOf(record.htmlUrl, record.url),
    additions: typeof record.additions === 'number' ? record.additions : 0,
    deletions: typeof record.deletions === 'number' ? record.deletions : 0,
    changedFiles: typeof record.changedFiles === 'number' ? record.changedFiles : 0
  }
}

export const RepositoryDetailPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const createSession = useChatStore(state => state.createSession)
  const {
    repositories,
    analyses,
    analysisStatesByRepoId,
    analysisLoadingByRepoId,
    analysisErrorsByRepoId,
    selectedRoleOption,
    selectedRepository,
    packagesByRepoId,
    commitsByRepoId,
    feedbackByRepoId,
    fetchRepository,
    fetchPackages,
    fetchCommits,
    fetchMyAnalyses,
    fetchAnalysis,
    fetchMyFeedbacks,
    analyzeRepository,
    generateFeedback,
    setSelectedRoleOption,
    fetchFeedback,
    isLoading,
    isAnalyzing,
    isGeneratingFeedback,
    error
  } = useRepositoryStore()
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [commitsLoading, setCommitsLoading] = useState(false)
  const [reportReason, setReportReason] = useState(reportReasons[0])
  const [reportDescription, setReportDescription] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [reportMessage, setReportMessage] = useState('')
  const [reportError, setReportError] = useState('')
  const [commitPage, setCommitPage] = useState(1)

  const repository = useMemo(() => {
    return repositories.find((repo) => repo.id === id) ?? selectedRepository
  }, [id, repositories, selectedRepository])
  const packages = packagesByRepoId[id] ?? []
  const commits = commitsByRepoId[id] ?? []
  const feedback = feedbackByRepoId[id]
  const packageAnalysis = getPackageAnalysis(packages)
  const packageFiles = asStringList(packageAnalysis.packageFiles)
  const packageNames = asStringList(packageAnalysis.packages)
  const frameworks = asStringList(packageAnalysis.frameworks)
  const configs = asStringList(packageAnalysis.configs)
  const detectedFiles = asArray(packageAnalysis.detectedFiles)
  const totalCommitPages = Math.max(1, Math.ceil(commits.length / COMMITS_PER_PAGE))
  const visibleCommits = commits.slice((commitPage - 1) * COMMITS_PER_PAGE, commitPage * COMMITS_PER_PAGE)
  const latestAnalysis = useMemo(() => {
    const state = analysisStatesByRepoId[id]
    if (state?.analysisStatus === 'available') return state.analysis
    if (state?.analysisStatus === 'analysis_required') return undefined
    return analyses.find((analysis) => analysis.repositoryId === id)
  }, [analyses, analysisStatesByRepoId, id])
  const analysisState = analysisStatesByRepoId[id]
  const isLoadingAnalysis = Boolean(analysisLoadingByRepoId[id])
  const analysisRequestError = analysisErrorsByRepoId[id]
  const latestSummary = latestAnalysis?.summary
  const latestScope = latestAnalysis?.analysisScope
  const latestScoreValue = latestSummary?.userReadinessScore ?? latestSummary?.overallScore ?? latestAnalysis?.scores.overallScore ?? latestAnalysis?.scores.overall
  const latestScore = typeof latestScoreValue === 'number' && Number.isFinite(latestScoreValue) ? Math.round(latestScoreValue) : undefined
  const latestScoreLabel = latestSummary?.userReadinessScore !== undefined ? 'Mức sẵn sàng' : 'Điểm tổng quan'
  const latestTopSkills = latestAnalysis?.topSkills ?? []

  useEffect(() => {
    if (!repository && id) fetchRepository(id)
    fetchPackages(id).catch(() => undefined)
    fetchCommits(id).catch(() => undefined)
    fetchMyAnalyses().catch(() => undefined)
    fetchAnalysis(id).catch(() => undefined)
    fetchMyFeedbacks().catch(() => undefined)
    fetchFeedback(id).catch(() => undefined)
  }, [fetchAnalysis, fetchCommits, fetchFeedback, fetchMyAnalyses, fetchMyFeedbacks, fetchPackages, fetchRepository, id, repository])

  useEffect(() => {
    setCommitPage(1)
  }, [id, commits.length])

  const handleAnalyze = async () => {
    await analyzeRepository(id)
  }

  const handleSelectRole = (option: RoleOption) => {
    setSelectedRoleOption(option)
    navigate('/roadmaps', { state: { selectedRoleOption: option, currentRepositoryId: id } })
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
    if (feedback) return
    const existingFeedback = await fetchFeedback(id)
    if (existingFeedback && !existingFeedback.isStale) return

    await generateFeedback(id)
  }

  const handleAskAi = async () => {
    if (!repository) return

    setIsCreatingChat(true)
    try {
      await createSession({
        title: `Tư vấn ${repository.name}`,
        repositoryId: repository.id
      })
      navigate('/chat')
    } finally {
      setIsCreatingChat(false)
    }
  }

  const handleSubmitReport = async () => {
    const description = reportDescription.trim()

    if (!description) {
      setReportError('Vui lòng mô tả ngắn gọn vấn đề bạn muốn báo cáo.')
      setReportMessage('')
      return
    }

    setIsSubmittingReport(true)
    setReportError('')
    setReportMessage('')

    try {
      await reportApi.createReport({
        targetType: 'repository',
        targetId: id,
        reason: reportReason,
        description
      })
      setReportDescription('')
      setReportMessage('Đã gửi báo cáo. Quản trị viên sẽ xem xét nội dung này.')
    } catch (err) {
      setReportError(getApiErrorMessage(err))
    } finally {
      setIsSubmittingReport(false)
    }
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
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
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
            <Button variant="outline" onClick={handleFetchPackages} isLoading={packagesLoading}>
              <FileJson className="mr-2 h-4 w-4" />
              Cập nhật công nghệ
            </Button>
            <Button variant="outline" onClick={handleFetchCommits} isLoading={commitsLoading}>
              <GitCommit className="mr-2 h-4 w-4" />
              Cập nhật lịch sử
            </Button>
            <Button onClick={handleAnalyze} isLoading={isAnalyzing}>
              <Play className="mr-2 h-4 w-4" />
              {repository.analyzed || latestAnalysis ? 'Phân tích lại' : 'Phân tích'}
            </Button>
            <Button variant="outline" onClick={handleGenerateFeedback} isLoading={isGeneratingFeedback}>
              <Bot className="mr-2 h-4 w-4" />
              Tạo AI feedback
            </Button>
            <Button variant="outline" onClick={handleAskAi} isLoading={isCreatingChat} disabled={!latestAnalysis}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Hỏi AI về repo này
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

      {latestAnalysis && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Tổng quan năng lực</CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kết quả mới nhất từ dữ liệu đã đồng bộ của dự án.</p>
            </div>
            <Button size="sm" onClick={handleAnalyze} isLoading={isAnalyzing}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Phân tích lại
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-xs text-slate-500">Định hướng</p>
                <p className="mt-1 truncate font-semibold text-slate-900 dark:text-slate-100">
                  {latestSummary?.careerDirection || latestAnalysis.careerDirection.primary}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-xs text-slate-500">{latestScoreLabel}</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {latestScore !== undefined ? `${latestScore}%` : 'Chưa có dữ liệu'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-xs text-slate-500">Đóng góp của bạn / toàn dự án</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {latestScope?.userCommits ?? latestAnalysis.commitSummary?.totalCommits ?? '—'} / {latestScope?.totalRepoCommits ?? latestAnalysis.commitSummary?.totalCommits ?? '—'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-xs text-slate-500">Ngày hoạt động</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {latestScope?.activeDays ?? latestAnalysis.commitSummary?.activeDays ?? 'Chưa có dữ liệu'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Kỹ năng nổi bật</p>
                <div className="flex flex-wrap gap-2">
                  {latestTopSkills.length ? latestTopSkills.slice(0, 6).map((skill) => (
                    <Badge key={skill.canonicalSkillName || skill.skill} variant="success">
                      {skill.skill}
                    </Badge>
                  )) : <span className="text-sm text-slate-500">Chưa có kỹ năng nổi bật.</span>}
                  {latestTopSkills.length > 6 && <Badge variant="success">+{latestTopSkills.length - 6}</Badge>}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Kỹ năng cần bổ sung</p>
                <div className="flex flex-wrap gap-2">
                  {latestAnalysis.missingSkills.length ? latestAnalysis.missingSkills.slice(0, 6).map((skill) => (
                    <Badge key={skill.id} variant={skill.importance === 'high' ? 'danger' : 'warning'}>
                      {skill.name}
                    </Badge>
                  )) : <span className="text-sm text-slate-500">Chưa có kỹ năng cần bổ sung.</span>}
                  {latestAnalysis.missingSkills.length > 6 && <Badge variant="warning">+{latestAnalysis.missingSkills.length - 6}</Badge>}
                </div>
              </div>
            </div>

            {(latestAnalysis.strengths.length > 0 || latestAnalysis.recommendations.length > 0) && (
              <div className="grid gap-4 border-t border-slate-200 pt-4 dark:border-slate-800 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Điểm mạnh đáng chú ý</p>
                  {latestAnalysis.strengths.length ? (
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      {latestAnalysis.strengths.slice(0, 3).map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  ) : <p className="text-sm text-slate-500">Chưa có dữ liệu điểm mạnh.</p>}
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Ưu tiên cải thiện</p>
                  {latestAnalysis.recommendations.length ? (
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      {latestAnalysis.recommendations.slice(0, 3).map((item) => <li key={item.id}>- {item.title}</li>)}
                    </ul>
                  ) : <p className="text-sm text-slate-500">Chưa có gợi ý cải thiện.</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isLoadingAnalysis && !latestAnalysis && (
        <Card className="border-dashed">
          <CardContent className="p-5">
            <div className="h-5 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
          </CardContent>
        </Card>
      )}

      {!isLoadingAnalysis && analysisState?.analysisStatus === 'analysis_required' && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                {analysisState.reason === 'incompatible_analysis_history'
                  ? 'Kết quả phân tích trước đây không còn tương thích'
                  : 'Repository cần được phân tích bằng phiên bản hiện tại'}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {analysisState.reason === 'incompatible_analysis_history'
                  ? 'Lịch sử cũ vẫn được giữ lại, nhưng không được dùng như kết quả Dev2Vec hiện hành.'
                  : 'Chưa có kết quả Dev2Vec tương thích để hiển thị điểm số và vai trò.'}
              </p>
            </div>
            <Button onClick={handleAnalyze} isLoading={isAnalyzing}><RefreshCw className="mr-2 h-4 w-4" />Phân tích lại repository</Button>
          </CardContent>
        </Card>
      )}

      {!isLoadingAnalysis && analysisRequestError && !analysisState && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div><h2 className="font-semibold">Không thể tải kết quả phân tích</h2><p className="mt-1 text-sm text-slate-500">{analysisRequestError}</p></div>
            <Button variant="outline" onClick={() => fetchAnalysis(id)}><RefreshCw className="mr-2 h-4 w-4" />Thử lại</Button>
          </CardContent>
        </Card>
      )}

      {!isLoadingAnalysis && !latestAnalysis && !analysisState && !analysisRequestError && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Dự án chưa có kết quả phân tích</h2>
              <p className="mt-1 text-sm text-slate-500">Chạy phân tích để xem mức sẵn sàng, kỹ năng và vai trò phù hợp.</p>
            </div>
            <Button onClick={handleAnalyze} isLoading={isAnalyzing}>
              <Play className="mr-2 h-4 w-4" />
              Phân tích ngay
            </Button>
          </CardContent>
        </Card>
      )}

      {latestAnalysis && (
        <RoleMatchPanel
          key={latestAnalysis.id || latestAnalysis.analyzedAt || id}
          repositoryId={id}
          selectedRoleId={selectedRoleOption?.roleId}
          onSelectRole={handleSelectRole}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5" />Công nghệ phát hiện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!packageFiles.length && !packageNames.length && !detectedFiles.length ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                Chưa có dữ liệu công nghệ. Bấm Cập nhật công nghệ để đồng bộ.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-900">
                    <p className="text-lg font-semibold">{packageFiles.length}</p>
                    <p className="text-xs text-slate-500">file phát hiện</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-900">
                    <p className="text-lg font-semibold">{packageNames.length}</p>
                    <p className="text-xs text-slate-500">thư viện</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-900">
                    <p className="text-lg font-semibold">{frameworks.length}</p>
                    <p className="text-xs text-slate-500">framework</p>
                  </div>
                </div>

                {frameworks.length ? (
                  <div>
                    <p className="mb-2 text-sm font-medium">Framework</p>
                    <div className="flex flex-wrap gap-2">{frameworks.slice(0, PACKAGE_BADGE_LIMIT).map((item) => <Badge key={item} variant="info">{item}</Badge>)}{frameworks.length > PACKAGE_BADGE_LIMIT && <Badge variant="info">+{frameworks.length - PACKAGE_BADGE_LIMIT}</Badge>}</div>
                  </div>
                ) : null}

                <div>
                  <p className="mb-2 text-sm font-medium">Thư viện chính</p>
                  <div className="flex flex-wrap gap-2">
                    {packageNames.slice(0, PACKAGE_BADGE_LIMIT).map((item) => <Badge key={item} variant="default">{item}</Badge>)}
                    {packageNames.length > PACKAGE_BADGE_LIMIT && <Badge variant="default">+{packageNames.length - PACKAGE_BADGE_LIMIT}</Badge>}
                    {!packageNames.length && <span className="text-sm text-slate-500">Chưa phát hiện thư viện.</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">File liên quan</p>
                  {detectedFiles.slice(0, 4).map((item) => {
                    const file = asRecord(item)
                    const scripts = asStringList(file.detectedScripts)
                    const fileFrameworks = asStringList(file.detectedFrameworks)

                    return (
                      <div key={textOf(file.path, file.fileName)} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{textOf(file.path, file.fileName, 'File')}</p>
                          <Badge variant="default">{textOf(file.type, 'config')}</Badge>
                        </div>
                        {(scripts.length || fileFrameworks.length) ? (
                          <p className="mt-2 text-xs text-slate-500">
                            {scripts.length ? `Scripts: ${scripts.join(', ')}` : ''}
                            {scripts.length && fileFrameworks.length ? ' · ' : ''}
                            {fileFrameworks.length ? `Framework: ${fileFrameworks.join(', ')}` : ''}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                {configs.length ? <p className="text-xs text-slate-500">Config: {configs.join(', ')}</p> : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GitCommit className="h-5 w-5" />Lịch sử đóng góp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {commits.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                Chưa có dữ liệu đóng góp. Bấm Cập nhật lịch sử để đồng bộ.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                  <div>
                    <p className="text-lg font-semibold">{commits.length}</p>
                    <p className="text-xs text-slate-500">commit đã đồng bộ</p>
                  </div>
                  {commits.length > COMMITS_PER_PAGE && (
                    <Badge variant="info">Trang {commitPage}/{totalCommitPages}</Badge>
                  )}
                </div>

                {visibleCommits.map((item) => {
                  const commit = getCommitInfo(item)

                  return (
                    <div key={commit.sha || commit.message} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{commit.message}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {commit.authorName || 'Không rõ tác giả'}{commit.authorDate ? ` · ${formatRelativeTime(commit.authorDate)}` : ''}{commit.sha ? ` · ${commit.sha.slice(0, 7)}` : ''}
                          </p>
                        </div>
                        {commit.htmlUrl && (
                          <a href={commit.htmlUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400" title="Mở commit trên GitHub">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      {(commit.additions > 0 || commit.deletions > 0 || commit.changedFiles > 0) && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {commit.additions > 0 && <Badge variant="success">+{commit.additions}</Badge>}
                          {commit.deletions > 0 && <Badge variant="danger">-{commit.deletions}</Badge>}
                          {commit.changedFiles > 0 && <Badge variant="default">{commit.changedFiles} file</Badge>}
                        </div>
                      )}
                    </div>
                  )
                })}

                {commits.length > COMMITS_PER_PAGE && (
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCommitPage((page) => Math.max(1, page - 1))}
                      disabled={commitPage === 1}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Trước
                    </Button>
                    <span className="text-xs text-slate-500">
                      {Math.min((commitPage - 1) * COMMITS_PER_PAGE + 1, commits.length)}-{Math.min(commitPage * COMMITS_PER_PAGE, commits.length)} / {commits.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCommitPage((page) => Math.min(totalCommitPages, page + 1))}
                      disabled={commitPage === totalCommitPages}
                    >
                      Sau
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                )}
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
                  {feedback.isStale && <Badge variant="warning">Feedback cũ</Badge>}
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
                {feedback.isStale && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <span>{feedback.staleReason || 'Feedback này được tạo từ phiên bản phân tích cũ.'}</span>
                    <Button size="sm" onClick={handleGenerateFeedback} isLoading={isGeneratingFeedback}>Tạo lại feedback</Button>
                  </div>
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
                      {feedback.strengthFeedback.slice(0, FEEDBACK_LIST_LIMIT).map((item) => <li key={item}>- {item}</li>)}
                      {feedback.strengthFeedback.length > FEEDBACK_LIST_LIMIT && <li className="text-slate-500">+{feedback.strengthFeedback.length - FEEDBACK_LIST_LIMIT} mục khác</li>}
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
                      {feedback.weaknessFeedback.slice(0, FEEDBACK_LIST_LIMIT).map((item) => <li key={item}>- {item}</li>)}
                      {feedback.weaknessFeedback.length > FEEDBACK_LIST_LIMIT && <li className="text-slate-500">+{feedback.weaknessFeedback.length - FEEDBACK_LIST_LIMIT} mục khác</li>}
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
                      {feedback.nextSteps.slice(0, FEEDBACK_LIST_LIMIT).map((item) => <li key={item}>- {item}</li>)}
                      {feedback.nextSteps.length > FEEDBACK_LIST_LIMIT && <li className="text-slate-500">+{feedback.nextSteps.length - FEEDBACK_LIST_LIMIT} bước khác</li>}
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
                      {feedback.recommendedTopics.slice(0, TOPIC_LIMIT).map((item) => <Badge key={item} variant="default">{item}</Badge>)}
                      {feedback.recommendedTopics.length > TOPIC_LIMIT && <Badge variant="default">+{feedback.recommendedTopics.length - TOPIC_LIMIT}</Badge>}
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
                    {feedback.riskNotes.slice(0, FEEDBACK_LIST_LIMIT).map((item) => <li key={item}>- {item}</li>)}
                    {feedback.riskNotes.length > FEEDBACK_LIST_LIMIT && <li className="text-slate-500">+{feedback.riskNotes.length - FEEDBACK_LIST_LIMIT} lưu ý khác</li>}
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

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Báo cáo dự án
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Nếu dự án này có nội dung không phù hợp hoặc thông tin bất thường, bạn có thể gửi báo cáo để quản trị viên xem xét.
          </p>

          {reportMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
              {reportMessage}
            </div>
          )}

          {reportError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {reportError}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Lý do báo cáo
              </label>
              <select
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
              >
                {reportReasons.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Mô tả chi tiết
              </label>
              <textarea
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
                placeholder="Ví dụ: Repository này có nội dung không phù hợp hoặc thông tin gây hiểu nhầm..."
                className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmitReport} isLoading={isSubmittingReport}>
              <Send className="mr-2 h-4 w-4" />
              Gửi báo cáo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
