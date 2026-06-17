import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import {
  adminApi,
  type AdminAdminEntityRef,
  type AdminAiFeedback
} from '../../services/apis/adminApi'

const formatDate = (value?: string) => {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

const asRef = (value?: AdminAdminEntityRef | string) => value && typeof value !== 'string' ? value : null
const ownerName = (item?: AdminAiFeedback) => asRef(item?.userId)?.fullName || asRef(item?.userId)?.name || asRef(item?.userId)?.email || 'Người dùng'
const ownerEmail = (item?: AdminAiFeedback) => asRef(item?.userId)?.email || 'Chưa có email'
const repoName = (item?: AdminAiFeedback) => item?.fullName || asRef(item?.repositoryId)?.fullName || item?.repoName || 'Repository'

const TextList = ({ title, items, variant = 'default' }: { title: string; items?: string[]; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {(items ?? []).length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có nội dung.</p>
      ) : items?.map((item) => (
        <div key={item} className="rounded-lg border border-slate-200 p-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:text-slate-300">
          <Badge variant={variant} className="mb-2">Gợi ý</Badge>
          <p>{item}</p>
        </div>
      ))}
    </CardContent>
  </Card>
)

export const AdminAiFeedbackDetailPage = () => {
  const { feedbackId } = useParams()
  const [feedback, setFeedback] = useState<AdminAiFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchFeedback = async () => {
    if (!feedbackId) {
      setError('Không tìm thấy mã phản hồi AI.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const payload = await adminApi.getAiFeedback(feedbackId)
      setFeedback(payload)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [feedbackId])

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/admin/ai-feedback" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách phản hồi AI
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{repoName(feedback ?? undefined)}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Xem chi tiết phản hồi AI đã tạo cho repository này.
          </p>
        </div>
        <Button variant="outline" onClick={fetchFeedback} isLoading={isLoading}>
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
        <Card><CardContent className="p-10 text-center text-slate-500">Đang tải chi tiết phản hồi AI...</CardContent></Card>
      ) : !feedback ? (
        <Card><CardContent className="p-10 text-center text-slate-500">Không tìm thấy phản hồi phù hợp.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>Tổng quan phản hồi</CardTitle>
                  <CardDescription>{feedback.summary || 'Chưa có tóm tắt.'}</CardDescription>
                </div>
                <Badge variant="info">{feedback.careerDirection || 'Chưa xác định'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">Người dùng</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{ownerName(feedback)}</p>
                <p className="text-xs text-slate-500">{ownerEmail(feedback)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Repository</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{repoName(feedback)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Loại dự án</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{feedback.projectType || 'Chưa rõ'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Ngày tạo</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{formatDate(feedback.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <TextList title="Điểm mạnh" items={feedback.strengthFeedback} variant="success" />
            <TextList title="Điểm cần cải thiện" items={feedback.weaknessFeedback} variant="warning" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TextList title="Bước tiếp theo" items={feedback.nextSteps} variant="info" />
            <TextList title="Chủ đề nên học" items={feedback.recommendedTopics} variant="default" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lời khuyên học tập</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{feedback.learningAdvice || 'Chưa có lời khuyên học tập.'}</p>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Gợi ý nghề nghiệp</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{feedback.careerSuggestion || 'Chưa có gợi ý nghề nghiệp.'}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Gợi ý portfolio</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{feedback.portfolioAdvice || 'Chưa có gợi ý portfolio.'}</p></CardContent>
            </Card>
          </div>

          <TextList title="Rủi ro cần lưu ý" items={feedback.riskNotes} variant="danger" />
        </>
      )}
    </div>
  )
}
