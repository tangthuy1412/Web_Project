import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Loader2,
  MessageSquare,
  Package,
  Play,
  TrendingUp,
  Wrench
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatDate } from '../../lib/utils'

const renderTextList = (items: string[], emptyText: string) => {
  if (items.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>

  return (
    <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
      {items.map((item) => <li key={item}>- {item}</li>)}
    </ul>
  )
}

const formatRatio = (value: number) => {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.round(value <= 1 ? value * 100 : value)}%`
}

const clampScore = (value: number | undefined) => {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value ?? 0)))
}

const getScoreTone = (score: number) => {
  if (score >= 75) return {
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500',
    soft: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900',
    label: 'Tốt'
  }

  if (score >= 45) return {
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500',
    soft: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900',
    label: 'Cần cải thiện'
  }

  return {
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-500',
    soft: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900',
    label: 'Ưu tiên cải thiện'
  }
}

export const AnalysisResultPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const {
    getAnalysisById,
    fetchAnalysis,
    analyzeRepository,
    generateFeedback,
    isGeneratingFeedback,
    error
  } = useRepositoryStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const analysis = getAnalysisById(id)

  useEffect(() => {
    if (!analysis && id) {
      setIsLoading(true)
      fetchAnalysis(id).finally(() => setIsLoading(false))
    }
  }, [analysis, fetchAnalysis, id])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      await analyzeRepository(id)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerateFeedback = async () => {
    const repoId = analysis?.repositoryId || id
    await generateFeedback(repoId)
    navigate(`/repositories/${repoId}`)
  }

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải kết quả phân tích...</div>
  }

  if (!analysis) {
    return (
      <div className="max-w-6xl space-y-4">
        <Link to="/repositories" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          <ArrowLeft className="h-4 w-4" />
          Quay lại repositories
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Repository này chưa được phân tích
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Hãy chạy phân tích để xem kỹ năng, định hướng nghề nghiệp, commit summary và checklist của repo này.
            </p>
            <Button className="mt-5" onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {isAnalyzing ? 'Đang phân tích...' : 'Phân tích ngay'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const languages = analysis.languages?.length ? analysis.languages : analysis.techStack
  const frameworks = analysis.frameworks?.length ? analysis.frameworks : analysis.techStack
  const packages = analysis.packages ?? []
  const skillSignals = analysis.skillSignals ?? []
  const careerSignals = analysis.careerSignals ?? []
  const commitSummary = analysis.commitSummary ?? {
    totalCommits: 0,
    activeDays: 0,
    vagueCommitRatio: 0,
    conventionalCommitRatio: 0
  }
  const checklist = analysis.checklist ?? {
    hasReadme: false,
    hasEnvExample: false,
    hasDocker: false,
    hasDockerCompose: false,
    hasCICD: false,
    hasTesting: false,
    hasLinting: false,
    hasFormatter: false,
    hasPackageFile: false
  }
  const checklistItems = [
    ['README', checklist.hasReadme],
    ['.env.example', checklist.hasEnvExample],
    ['Docker', checklist.hasDocker],
    ['Docker Compose', checklist.hasDockerCompose],
    ['CI/CD', checklist.hasCICD],
    ['Testing', checklist.hasTesting],
    ['Linting', checklist.hasLinting],
    ['Formatter', checklist.hasFormatter],
    ['Package file', checklist.hasPackageFile]
  ] as const
  const overallScore = clampScore(analysis.scores.overallScore ?? analysis.scores.overall)
  const overallTone = getScoreTone(overallScore)
  const scoreItems = [
    ['Tech stack', clampScore(analysis.scores.techStackScore)],
    ['Tài liệu', clampScore(analysis.scores.documentationScore ?? analysis.scores.documentation)],
    ['Chất lượng commit', clampScore(analysis.scores.commitQualityScore ?? analysis.scores.commitQuality)],
    ['Triển khai', clampScore(analysis.scores.deploymentScore)],
    ['Testing', clampScore(analysis.scores.testingScore)],
    ['Độ sẵn sàng portfolio', clampScore(analysis.scores.portfolioReadinessScore)]
  ] as const

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <Link to="/repositories" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          <ArrowLeft className="h-4 w-4" />
          Quay lại repositories
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {analysis.repoName || analysis.repositoryName}
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              {analysis.fullName || 'Repository Analysis'} - {formatDate(analysis.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Badge variant="info">{analysis.projectType}</Badge>
            {languages.slice(0, 4).map((item) => <Badge key={item} variant="default">{item}</Badge>)}
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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Kết quả phân tích repository
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Bản phân tích tập trung vào điểm số tổng quan, tín hiệu kỹ năng, định hướng nghề nghiệp và checklist thực tế.
              </p>
            </div>
            <Link to={`/repositories/${analysis.repositoryId || id}`}>
              <Button variant="outline">Mở repository</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Điểm phân tích
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <div className={`rounded-lg border p-5 ${overallTone.soft}`}>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Điểm tổng quan</p>
              <div className={`mt-3 text-5xl font-bold ${overallTone.text}`}>{overallScore}</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{overallTone.label}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {scoreItems.map(([label, score]) => {
                const tone = getScoreTone(score)

                return (
                  <div key={label} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                      <span className={`text-sm font-semibold ${tone.text}`}>{score}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-2 rounded-full ${tone.bg}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Tổng quan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Loại dự án</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{analysis.projectType}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Định hướng nghề nghiệp</p>
              <p className="mt-1 font-semibold text-indigo-600 dark:text-indigo-400">{analysis.careerDirection.primary}</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-slate-500">Ngôn ngữ</p>
              <div className="flex flex-wrap gap-2">
                {languages.length ? languages.map((item) => <Badge key={item} variant="default">{item}</Badge>) : <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-slate-500">Frameworks</p>
              <div className="flex flex-wrap gap-2">
                {frameworks.length ? frameworks.map((item) => <Badge key={item} variant="info">{item}</Badge>) : <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Packages</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {packages.length ? packages.map((item) => <Badge key={item} variant="default">{item}</Badge>) : <span className="text-sm text-slate-500">Chưa phát hiện package/config nổi bật.</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Code2 className="h-5 w-5" />Kỹ năng phát hiện</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <h3 className="mb-2 font-medium text-slate-900 dark:text-slate-100">Tín hiệu kỹ năng</h3>
              {renderTextList(skillSignals, 'Chưa có tín hiệu kỹ năng trong payload.')}
            </div>
            <div>
              <h3 className="mb-2 font-medium text-slate-900 dark:text-slate-100">Tín hiệu nghề nghiệp</h3>
              {renderTextList(careerSignals, 'Chưa có tín hiệu nghề nghiệp trong payload.')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" />Điểm mạnh</CardTitle></CardHeader>
          <CardContent>
            {renderTextList(analysis.strengths, 'Chưa có dữ liệu điểm mạnh.')}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-600" />Cần cải thiện</CardTitle></CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium text-slate-900 dark:text-slate-100">Điểm yếu</h3>
            {renderTextList(analysis.weaknesses, 'Chưa có dữ liệu điểm cần cải thiện.')}
          </div>
          <div>
            <h3 className="mb-2 font-medium text-slate-900 dark:text-slate-100">Kỹ năng còn thiếu</h3>
            {analysis.missingSkills.length ? (
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {analysis.missingSkills.map((item) => <li key={item.id}>- {item.name}</li>)}
              </ul>
            ) : <p className="text-sm text-slate-500">Chưa có missingSkills trong payload.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Gợi ý cải thiện</CardTitle></CardHeader>
        <CardContent>
          {analysis.recommendations.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có recommendations trong payload.</p>
          ) : (
            <div className="space-y-3">
              {analysis.recommendations.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
                  {item.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Hoạt động commit</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">Tổng số commit</p>
              <p className="mt-1 text-lg font-semibold">{commitSummary.totalCommits}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">Số ngày hoạt động</p>
              <p className="mt-1 text-lg font-semibold">{commitSummary.activeDays}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">Tỷ lệ commit mơ hồ</p>
              <p className="mt-1 text-lg font-semibold">{formatRatio(commitSummary.vagueCommitRatio)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">Tỷ lệ conventional commit</p>
              <p className="mt-1 text-lg font-semibold">{formatRatio(commitSummary.conventionalCommitRatio)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">Commit đầu tiên</p>
              <p className="mt-1 text-sm font-medium">{commitSummary.firstCommitDate ? formatDate(commitSummary.firstCommitDate) : 'N/A'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">Commit gần nhất</p>
              <p className="mt-1 text-sm font-medium">{commitSummary.lastCommitDate ? formatDate(commitSummary.lastCommitDate) : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" />Checklist</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {checklistItems.map(([label, completed]) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                  <span>{label}</span>
                  <Badge variant={completed ? 'success' : 'default'}>{completed ? 'Có' : 'Chưa'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/chat" className="flex-1">
          <Button className="w-full">
            <MessageSquare className="mr-2 h-4 w-4" />
            Hỏi AI Mentor
          </Button>
        </Link>
        <Button variant="outline" onClick={handleGenerateFeedback} isLoading={isGeneratingFeedback}>
          <Bot className="mr-2 h-4 w-4" />
          Tạo AI feedback cho {analysis.repoName || analysis.repositoryName}
        </Button>
      </div>
    </div>
  )
}
