import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { getApiErrorMessage } from '../../services/apis/core'
import {
  adminApi,
  type AdminAdminEntityRef,
  type AdminAnalysis
} from '../../services/apis/admin'

const DETAIL_LIST_LIMIT = 6
const DETAIL_BADGE_LIMIT = 10

const formatDate = (value?: string) => {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

const asRef = (value?: AdminAdminEntityRef | string) => value && typeof value !== 'string' ? value : null
const ownerName = (item?: AdminAnalysis) => asRef(item?.userId)?.fullName || asRef(item?.userId)?.name || asRef(item?.userId)?.email || 'Người dùng'
const ownerEmail = (item?: AdminAnalysis) => asRef(item?.userId)?.email || 'Chưa có email'
const repoName = (item?: AdminAnalysis) => item?.fullName || asRef(item?.repositoryId)?.fullName || item?.repoName || 'Repository'

const scoreLabel: Record<string, string> = {
  techStackScore: 'Công nghệ',
  documentationScore: 'Tài liệu',
  commitQualityScore: 'Commit',
  deploymentScore: 'Triển khai',
  testingScore: 'Kiểm thử',
  portfolioReadinessScore: 'Portfolio',
  overallScore: 'Tổng thể'
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

const TextList = ({ title, items, variant = 'default' }: { title: string; items?: string[]; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) => (
  <Card>
    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
    <CardContent className="space-y-2">
      {(items ?? []).length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có nội dung.</p>
      ) : <>
        {items?.slice(0, DETAIL_LIST_LIMIT).map((item) => (
        <div key={item} className="rounded-lg border border-slate-200 p-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:text-slate-300">
          <Badge variant={variant} className="mb-2">Mục</Badge>
          <p>{item}</p>
        </div>
        ))}
        {(items ?? []).length > DETAIL_LIST_LIMIT && <p className="text-sm text-slate-500">+{(items ?? []).length - DETAIL_LIST_LIMIT} mục khác</p>}
      </>}
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
      const payload = await adminApi.getAnalysis(analysisId)
      setAnalysis(payload)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [analysisId])

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/admin/analysis" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách phân tích
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{repoName(analysis ?? undefined)}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Xem chi tiết kết quả phân tích repository.
          </p>
        </div>
        <Button variant="outline" onClick={fetchAnalysis} isLoading={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card><CardContent className="p-10 text-center text-slate-500">Đang tải chi tiết phân tích...</CardContent></Card>
      ) : !analysis ? (
        <Card><CardContent className="p-10 text-center text-slate-500">Không tìm thấy phân tích phù hợp.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>Tổng quan phân tích</CardTitle>
                  <CardDescription>{analysis.projectType || 'Chưa rõ loại dự án'}</CardDescription>
                </div>
                <Badge variant={(analysis.scores?.overallScore ?? 0) >= 70 ? 'success' : (analysis.scores?.overallScore ?? 0) >= 40 ? 'warning' : 'danger'}>
                  Tổng thể {analysis.scores?.overallScore ?? 0}/100
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">Người dùng</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{ownerName(analysis)}</p>
                <p className="text-xs text-slate-500">{ownerEmail(analysis)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Repository</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{repoName(analysis)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Định hướng</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{analysis.careerDirection || 'Chưa xác định'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Ngày phân tích</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{formatDate(analysis.analyzedAt || analysis.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Điểm số</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(analysis.scores ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm text-slate-500">{scoreLabel[key] ?? key}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">{value ?? 0}/100</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Công nghệ phát hiện</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Ngôn ngữ</p>
                  <div className="flex flex-wrap gap-2">{(analysis.languages ?? []).slice(0, DETAIL_BADGE_LIMIT).map((item) => <Badge key={item} variant="info">{item}</Badge>)}{(analysis.languages ?? []).length > DETAIL_BADGE_LIMIT && <Badge variant="info">+{(analysis.languages ?? []).length - DETAIL_BADGE_LIMIT}</Badge>}</div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Framework</p>
                  <div className="flex flex-wrap gap-2">{(analysis.frameworks ?? []).slice(0, DETAIL_BADGE_LIMIT).map((item) => <Badge key={item} variant="default">{item}</Badge>)}{(analysis.frameworks ?? []).length > DETAIL_BADGE_LIMIT && <Badge variant="default">+{(analysis.frameworks ?? []).length - DETAIL_BADGE_LIMIT}</Badge>}</div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Package nổi bật</p>
                  <div className="flex flex-wrap gap-2">{(analysis.packages ?? []).slice(0, DETAIL_BADGE_LIMIT).map((item) => <Badge key={item} variant="default">{item}</Badge>)}{(analysis.packages ?? []).length > DETAIL_BADGE_LIMIT && <Badge variant="default">+{(analysis.packages ?? []).length - DETAIL_BADGE_LIMIT}</Badge>}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Checklist repository</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {Object.entries(analysis.checklist ?? {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{checklistLabel[key] ?? key}</span>
                    <Badge variant={value ? 'success' : 'warning'}>{value ? 'Có' : 'Thiếu'}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Hoạt động commit</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div><p className="text-sm text-slate-500">Tổng commit</p><p className="font-medium">{analysis.commitSummary?.totalCommits ?? 0}</p></div>
              <div><p className="text-sm text-slate-500">Số ngày hoạt động</p><p className="font-medium">{analysis.commitSummary?.activeDays ?? 0}</p></div>
              <div><p className="text-sm text-slate-500">Commit mơ hồ</p><p className="font-medium">{Math.round((analysis.commitSummary?.vagueCommitRatio ?? 0) * 100)}%</p></div>
              <div><p className="text-sm text-slate-500">Conventional commit</p><p className="font-medium">{Math.round((analysis.commitSummary?.conventionalCommitRatio ?? 0) * 100)}%</p></div>
              <div><p className="text-sm text-slate-500">Commit đầu</p><p className="font-medium">{formatDate(analysis.commitSummary?.firstCommitDate)}</p></div>
              <div><p className="text-sm text-slate-500">Commit gần nhất</p><p className="font-medium">{formatDate(analysis.commitSummary?.lastCommitDate)}</p></div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <TextList title="Điểm mạnh" items={analysis.strengths} variant="success" />
            <TextList title="Điểm yếu" items={analysis.weaknesses} variant="warning" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <TextList title="Kỹ năng còn thiếu" items={analysis.missingSkills} variant="danger" />
            <TextList title="Khuyến nghị" items={analysis.recommendations} variant="info" />
          </div>
          <TextList title="Tín hiệu kỹ năng" items={analysis.skillSignals} variant="default" />
        </>
      )}
    </div>
  )
}
