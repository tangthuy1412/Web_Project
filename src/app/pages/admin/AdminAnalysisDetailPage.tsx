import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Activity, AlertTriangle, ArrowLeft, BrainCircuit, ExternalLink, GitCommit, RefreshCw, Target } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { getApiErrorMessage } from '../../services/apis/core'
import { adminApi, type AdminAdminEntityRef, type AdminAnalysis } from '../../services/apis/admin'

const DETAIL_LIST_LIMIT = 6
const DETAIL_BADGE_LIMIT = 10

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có dữ liệu'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const formatScore = (value?: number) => typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value * 10) / 10}` : '—'
const toPercent = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return Math.max(0, Math.min(100, value <= 1 ? value * 100 : value))
}
const formatPercent = (value?: number) => {
  const percent = toPercent(value)
  return percent === undefined ? '—' : `${Math.round(percent * 10) / 10}%`
}
const formatRatio = (value?: number) => formatPercent(value)
const asRef = (value?: AdminAdminEntityRef | string) => value && typeof value !== 'string' ? value : null
const asObject = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {}
const ownerName = (item?: AdminAnalysis) => asRef(item?.userId)?.fullName || asRef(item?.userId)?.name || asRef(item?.userId)?.email || 'Người dùng'
const ownerEmail = (item?: AdminAnalysis) => asRef(item?.userId)?.email || 'Chưa có email'
const repoName = (item?: AdminAnalysis) => item?.fullName || asRef(item?.repositoryId)?.fullName || item?.repoName || 'Repository'
const repoUrl = (item?: AdminAnalysis) => asRef(item?.repositoryId)?.htmlUrl

const formatLevel = (value?: string) => {
  const normalized = value?.toLowerCase()
  if (!normalized) return 'Chưa xác định'
  if (['beginner', 'novice', 'starter'].includes(normalized)) return 'Mới bắt đầu'
  if (['intermediate', 'middle', 'mid'].includes(normalized)) return 'Trung cấp'
  if (['advanced', 'senior'].includes(normalized)) return 'Nâng cao'
  if (['expert', 'master'].includes(normalized)) return 'Chuyên sâu'
  return value
}

const formatScope = (value?: string) => {
  if (value === 'user_contribution') return 'Đóng góp của người dùng'
  if (value === 'repository') return 'Toàn bộ repository'
  return value || 'Chưa xác định'
}

const formatDocumentationStatus = (value: unknown) => {
  const labels: Record<string, string> = {
    root_readme_only: 'Chỉ có README gốc',
    docs_directory: 'Có thư mục tài liệu',
    no_documentation: 'Chưa có tài liệu'
  }
  return typeof value === 'string' ? labels[value] || value : '—'
}

const scoreLabel: Record<string, string> = {
  techStackScore: 'Công nghệ',
  documentationScore: 'Tài liệu',
  commitQualityScore: 'Chất lượng commit',
  deploymentScore: 'Triển khai',
  testingScore: 'Kiểm thử',
  portfolioReadinessScore: 'Mức sẵn sàng portfolio',
  overallScore: 'Tổng thể'
}

const breakdownLabel: Record<string, string> = {
  skillScore: 'Kỹ năng',
  contributionScore: 'Đóng góp',
  commitQualityScore: 'Chất lượng commit',
  projectCompletenessScore: 'Mức hoàn thiện',
  missingCriticalPenalty: 'Điểm trừ kỹ năng cốt lõi'
}

const checklistLabel: Record<string, string> = {
  hasReadme: 'README',
  hasEnvExample: '.env.example',
  hasDocker: 'Dockerfile',
  hasDockerCompose: 'Docker Compose',
  hasCICD: 'CI/CD',
  hasTesting: 'Kiểm thử',
  hasLinting: 'Linting',
  hasFormatter: 'Formatter',
  hasPackageFile: 'Package file'
}

const skillLevelLabel: Record<string, string> = {
  strong: 'Mạnh',
  developing: 'Đang phát triển',
  weak: 'Cần củng cố',
  missing: 'Thiếu'
}

const getScoreVariant = (value?: number): 'success' | 'warning' | 'danger' | 'default' => {
  const score = toPercent(value)
  if (score === undefined) return 'default'
  if (score >= 70) return 'success'
  if (score >= 40) return 'warning'
  return 'danger'
}

const TextList = ({ title, items, variant = 'default' }: { title: string; items?: string[]; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) => (
  <Card>
    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
    <CardContent>
      {(items ?? []).length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có nội dung trong kết quả phân tích.</p>
      ) : (
        <div className="space-y-2">
          {items?.slice(0, DETAIL_LIST_LIMIT).map((item, index) => (
            <div key={`${item}-${index}`} className="flex gap-3 rounded-lg border border-slate-200 p-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:text-slate-300">
              <Badge variant={variant} className="mt-0.5 h-fit shrink-0">{index + 1}</Badge>
              <p>{item}</p>
            </div>
          ))}
          {(items ?? []).length > DETAIL_LIST_LIMIT && <p className="text-sm text-slate-500">Còn {(items ?? []).length - DETAIL_LIST_LIMIT} mục khác.</p>}
        </div>
      )}
    </CardContent>
  </Card>
)

export const AdminAnalysisDetailPage = () => {
  const { analysisId } = useParams()
  const [analysis, setAnalysis] = useState<AdminAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAnalysis = async () => {
    if (!analysisId) {
      setError('Không tìm thấy mã phân tích.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      setAnalysis(await adminApi.getAnalysis(analysisId))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchAnalysis()
  }, [analysisId])

  const derived = useMemo(() => {
    if (!analysis) return null
    const summary = analysis.summary
    const scope = analysis.analysisScope
    const breakdown = analysis.scoreBreakdown
    const dev2vec = analysis.dev2vec
    const rolePredictions = dev2vec?.rolePredictions ?? []
    const topRole = rolePredictions[0]
    const topRoleGap = topRole?.roleId ? dev2vec?.skillGaps?.[topRole.roleId] : undefined
    const missingSkills = analysis.missingSkills?.length ? analysis.missingSkills : topRoleGap?.missingSkillNames ?? []
    const sourceStats = breakdown?.sourceStats ?? dev2vec?.sourceStats ?? {}
    const vectorSources = breakdown?.vectorSources ?? dev2vec?.vectorSources ?? {}
    const detectedFeatures = Object.entries(breakdown?.repoFeatureEvidence ?? {})
      .filter(([, feature]) => feature.detected)
      .map(([name]) => name)
    const pipelineMetadata = asObject(asObject(analysis.rawAnalysis).pipelineMetadata)
    const overallScore = summary?.overallScore ?? analysis.scores?.overallScore
    const careerDirection = summary?.careerDirection || analysis.careerDirection
    const projectType = summary?.projectType || analysis.projectType
    const directionMismatch = Boolean(projectType && careerDirection && !careerDirection.toLowerCase().includes(projectType.toLowerCase()))

    return { summary, scope, breakdown, dev2vec, rolePredictions, missingSkills, sourceStats, vectorSources, detectedFeatures, pipelineMetadata, overallScore, careerDirection, projectType, directionMismatch }
  }, [analysis])

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/admin/analysis" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách phân tích
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{repoName(analysis ?? undefined)}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Theo dõi kết quả, phạm vi dữ liệu và tín hiệu Dev2Vec của repository.</p>
        </div>
        <Button variant="outline" onClick={fetchAnalysis} isLoading={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

      {isLoading ? (
        <Card><CardContent className="p-10 text-center text-slate-500">Đang tải chi tiết phân tích...</CardContent></Card>
      ) : !analysis || !derived ? (
        <Card><CardContent className="p-10 text-center text-slate-500">Không tìm thấy phân tích phù hợp.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Tổng quan phân tích</CardTitle>
                  <CardDescription>Phân tích lúc {formatDate(analysis.analyzedAt || analysis.createdAt)}</CardDescription>
                </div>
                {derived.overallScore !== undefined && <Badge variant={getScoreVariant(derived.overallScore)}>Tổng thể {formatScore(derived.overallScore)}/100</Badge>}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 xl:col-span-2">
                <p className="text-xs text-slate-500">Người dùng</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{ownerName(analysis)}</p>
                <p className="text-xs text-slate-500">{ownerEmail(analysis)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 xl:col-span-2">
                <p className="text-xs text-slate-500">Repository</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="min-w-0 truncate font-semibold text-slate-950 dark:text-slate-50">{repoName(analysis)}</p>
                  {repoUrl(analysis) && <a href={repoUrl(analysis)} target="_blank" rel="noreferrer" title="Mở repository trên GitHub" className="shrink-0 text-indigo-600"><ExternalLink className="h-4 w-4" /></a>}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-xs text-slate-500">Mức sẵn sàng</p>
                <p className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-50">{formatPercent(derived.summary?.userReadinessScore)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-xs text-slate-500">Trình độ</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{formatLevel(derived.summary?.userLevel)}</p>
              </div>
            </CardContent>
          </Card>

          {derived.directionMismatch && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Loại dự án được nhận diện là <strong>{derived.projectType}</strong>, nhưng định hướng hàng đầu là <strong>{derived.careerDirection}</strong>. Admin nên kiểm tra phạm vi đóng góp và bằng chứng nguồn trước khi đánh giá kết quả.</p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Phạm vi và độ phủ dữ liệu</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Phạm vi', formatScope(derived.scope?.type)],
                  ['GitHub user', derived.scope?.githubUsername || 'Chưa có dữ liệu'],
                  ['Commit của user / repo', `${derived.scope?.userCommits ?? '—'} / ${derived.scope?.totalRepoCommits ?? '—'}`],
                  ['Ngày hoạt động', derived.scope?.activeDays ?? '—'],
                  ['File nguồn', typeof derived.sourceStats.sourceFileCount === 'number' ? derived.sourceStats.sourceFileCount : '—'],
                  ['File từ đóng góp user', typeof derived.sourceStats.userContributionFileCount === 'number' ? derived.sourceStats.userContributionFileCount : '—'],
                  ['API/dependency token', typeof derived.sourceStats.apiTokenCount === 'number' ? derived.sourceStats.apiTokenCount : '—'],
                  ['Độ tin cậy', formatPercent(typeof derived.summary?.confidence === 'number' ? derived.summary.confidence : derived.breakdown?.confidence)],
                  ['Issue đã phân tích', typeof derived.sourceStats.issueCount === 'number' ? derived.sourceStats.issueCount : '—'],
                  ['File package', typeof derived.sourceStats.packageFileCount === 'number' ? derived.sourceStats.packageFileCount : '—'],
                  ['Tài liệu', formatDocumentationStatus(derived.sourceStats.documentationStatus)],
                  ['Dùng dữ liệu cache', typeof derived.sourceStats.sourceUsageFromCache === 'boolean' ? derived.sourceStats.sourceUsageFromCache ? 'Có' : 'Không' : '—']
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{value}</p>
                  </div>
                ))}
                <div className="sm:col-span-2 xl:col-span-4">
                  <p className="mb-2 text-xs text-slate-500">Nguồn bằng chứng</p>
                  <div className="flex flex-wrap gap-2">
                    {derived.scope?.source && <Badge variant="info">Nguồn: {derived.scope.source}</Badge>}
                    {Object.entries(derived.vectorSources).map(([source, available]) => <Badge key={source} variant={available ? 'success' : 'default'}>{source}: {available ? 'Có' : 'Không có'}</Badge>)}
                    {Object.keys(derived.vectorSources).length === 0 && <span className="text-sm text-slate-500">Chưa có thông tin nguồn bằng chứng.</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Dự đoán vai trò</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {derived.rolePredictions.length ? derived.rolePredictions.slice(0, 5).map((prediction, index) => {
                  const probability = toPercent(prediction.probability) ?? 0
                  return (
                    <div key={prediction.roleId || prediction.roleName || index} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <div><p className="font-semibold text-slate-950 dark:text-slate-50">#{prediction.rank ?? index + 1} {prediction.roleName || prediction.modelLabel}</p><p className="text-xs text-slate-500">Nhãn mô hình: {prediction.modelLabel || 'Chưa có'}</p></div>
                        <Badge variant={index === 0 ? 'info' : 'default'}>{formatPercent(prediction.probability)}</Badge>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${probability}%` }} /></div>
                    </div>
                  )
                }) : <p className="text-sm text-slate-500">Response chưa có dự đoán vai trò.</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5" />Vector kỹ năng Dev2Vec</CardTitle>
              <CardDescription>Điểm tương đồng và trạng thái kỹ năng do mô hình trả về; không thay thế bằng dữ liệu suy đoán từ FE.</CardDescription>
            </CardHeader>
            <CardContent>
              {(analysis.skillVector ?? []).length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {analysis.skillVector?.map((skill, index) => {
                    const score = toPercent(skill.score) ?? toPercent(skill.similarity) ?? 0
                    return (
                      <div key={skill.canonicalSkillName || skill.skill || index} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="font-semibold text-slate-950 dark:text-slate-50">{skill.canonicalSkillName || skill.skill}</p><p className="text-xs text-slate-500">{skill.category || 'Chưa phân nhóm'}</p></div>
                          <Badge variant={getScoreVariant(score)}>{skillLevelLabel[skill.level || ''] || skill.level || 'Chưa rõ'}</Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Điểm kỹ năng</span><span className="font-semibold">{formatPercent(skill.score ?? skill.similarity)}</span></div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${score}%` }} /></div>
                        {skill.reason && <p className="mt-3 text-xs leading-5 text-slate-500">{skill.reason}</p>}
                      </div>
                    )
                  })}
                </div>
              ) : <p className="text-sm text-slate-500">Response chưa có vector kỹ năng.</p>}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Điểm phân tích</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {Object.entries(analysis.scores ?? {}).filter(([, value]) => typeof value === 'number').map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3"><p className="text-sm text-slate-500">{scoreLabel[key] ?? key}</p><Badge variant={getScoreVariant(value)}>{formatScore(value)}/100</Badge></div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Thành phần điểm sẵn sàng</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {Object.entries(breakdownLabel).map(([key, label]) => {
                  const value = derived.breakdown?.[key as keyof typeof derived.breakdown]
                  return typeof value === 'number' ? <div key={key} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-lg font-bold">{formatScore(value)}</p></div> : null
                })}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Công nghệ phát hiện</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  ['Ngôn ngữ', analysis.languages, 'info' as const],
                  ['Framework', analysis.frameworks, 'default' as const],
                  ['Package nổi bật', analysis.packages, 'default' as const],
                  ['Tín hiệu kỹ năng', analysis.skillSignals, 'warning' as const],
                  ['Tính năng có bằng chứng', derived.detectedFeatures, 'success' as const]
                ].map(([label, values, variant]) => (
                  <div key={label as string}><p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p><div className="flex flex-wrap gap-2">{(values as string[] ?? []).slice(0, DETAIL_BADGE_LIMIT).map((item) => <Badge key={item} variant={variant}>{item}</Badge>)}{!(values as string[] ?? []).length && <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}</div></div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Checklist repository</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {Object.entries(analysis.checklist ?? {}).map(([key, value]) => <div key={key} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{checklistLabel[key] ?? key}</span><Badge variant={value ? 'success' : 'warning'}>{value ? 'Có' : 'Thiếu'}</Badge></div>)}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><GitCommit className="h-5 w-5" />Hoạt động commit</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Commit của người dùng', derived.scope?.userCommits ?? analysis.commitSummary?.totalCommits ?? '—'],
                ['Tổng commit repository', derived.scope?.totalRepoCommits ?? '—'],
                ['Số ngày hoạt động', derived.scope?.activeDays ?? analysis.commitSummary?.activeDays ?? '—'],
                ['Commit mơ hồ', formatRatio(analysis.commitSummary?.vagueCommitRatio)],
                ['Conventional commit', formatRatio(analysis.commitSummary?.conventionalCommitRatio)],
                ['Commit đầu tiên', formatDate(derived.scope?.firstCommitDate || analysis.commitSummary?.firstCommitDate)],
                ['Commit gần nhất', formatDate(derived.scope?.lastCommitDate || analysis.commitSummary?.lastCommitDate)]
              ].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2"><TextList title="Điểm mạnh" items={analysis.strengths} variant="success" /><TextList title="Điểm cần cải thiện" items={analysis.weaknesses} variant="warning" /></div>
          <div className="grid gap-6 lg:grid-cols-2"><TextList title="Kỹ năng còn thiếu" items={derived.missingSkills} variant="danger" /><TextList title="Khuyến nghị" items={analysis.recommendations} variant="info" /></div>

          <Card>
            <CardHeader><CardTitle>Thông tin mô hình và truy vết</CardTitle><CardDescription>Dữ liệu phục vụ kiểm tra vận hành; không hiển thị các vector số thô.</CardDescription></CardHeader>
            <CardContent>
              <details>
                <summary className="cursor-pointer text-sm font-semibold text-indigo-600">Xem thông tin kỹ thuật</summary>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Phương pháp chấm điểm', derived.breakdown?.scoringMethod || derived.dev2vec?.scoringMethod || 'Chưa có'],
                    ['Phiên bản mô hình', derived.breakdown?.modelVersion || derived.dev2vec?.modelVersion || 'Chưa có'],
                    ['Phiên bản pipeline', String(derived.pipelineMetadata.analysisPipelineVersion || 'Chưa có')],
                    ['Phân tích gia tăng', analysis.analysisProvenance?.incremental ? 'Có' : 'Không'],
                    ['Lý do', analysis.analysisProvenance?.incrementalReason || 'Chưa có'],
                    ['Commit HEAD', analysis.analysisProvenance?.analyzedHeadSha?.slice(0, 12) || 'Chưa có'],
                    ['Bằng chứng mới', analysis.analysisProvenance?.newEvidenceCount ?? '—'],
                    ['Bằng chứng tái sử dụng', analysis.analysisProvenance?.reusedEvidenceCount ?? '—']
                  ].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words font-semibold">{value}</p></div>)}
                </div>
              </details>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
