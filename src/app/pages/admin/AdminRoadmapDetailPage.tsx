import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Archive, ArrowLeft, RefreshCw, RotateCcw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import {
  adminApi,
  type AdminRoadmap,
  type AdminRoadmapOwner,
  type AdminRoadmapStatus
} from '../../services/apis/adminApi'

const statusLabels: Record<string, string> = {
  active: 'Đang hiển thị',
  archived: 'Đã lưu trữ'
}

const taskStatusLabels: Record<string, string> = {
  not_started: 'Chưa bắt đầu',
  in_progress: 'Đang học',
  completed: 'Đã hoàn thành'
}

const formatDate = (value?: string) => {
  if (!value) return 'Chưa có'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

const roadmapOwner = (roadmap?: AdminRoadmap): AdminRoadmapOwner | null => {
  if (!roadmap?.userId || typeof roadmap.userId === 'string') return null
  return roadmap.userId
}

const ownerName = (roadmap?: AdminRoadmap) => {
  const owner = roadmapOwner(roadmap)
  return owner?.fullName || owner?.name || owner?.email || 'Người dùng'
}

const ownerEmail = (roadmap?: AdminRoadmap) => roadmapOwner(roadmap)?.email || 'Chưa có email'
const roadmapTitle = (roadmap?: AdminRoadmap) => roadmap?.mainPath?.title || roadmap?.targetRole || 'Chi tiết roadmap'
const phasesOf = (roadmap?: AdminRoadmap) => roadmap?.mainPath?.phases ?? []
const taskCountOf = (roadmap?: AdminRoadmap) => phasesOf(roadmap).reduce((total, phase) => total + (phase.tasks?.length ?? 0), 0)
const hourCountOf = (roadmap?: AdminRoadmap) => phasesOf(roadmap).reduce(
  (total, phase) => total + (phase.tasks ?? []).reduce((sum, task) => sum + (task.estimatedHours ?? 0), 0),
  0
)

export const AdminRoadmapDetailPage = () => {
  const { roadmapId } = useParams()
  const [roadmap, setRoadmap] = useState<AdminRoadmap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')

  const summaryCards = useMemo(() => [
    { label: 'Giai đoạn', value: phasesOf(roadmap).length },
    { label: 'Việc học', value: taskCountOf(roadmap) },
    { label: 'Giờ ước tính', value: hourCountOf(roadmap) },
    { label: 'Repository tham chiếu', value: roadmap?.sourceContextSummary?.repositoriesCount ?? 0 }
  ], [roadmap])

  const fetchRoadmap = async () => {
    if (!roadmapId) {
      setError('Không tìm thấy mã roadmap.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const payload = await adminApi.getRoadmap(roadmapId)
      setRoadmap(payload)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRoadmap()
  }, [roadmapId])

  const handleToggleStatus = async () => {
    if (!roadmapId || !roadmap) return

    const nextStatus: AdminRoadmapStatus = roadmap.status === 'active' ? 'archived' : 'active'
    setIsUpdating(true)
    setError('')

    try {
      const updated = await adminApi.updateRoadmapStatus(roadmapId, nextStatus)
      setRoadmap({ ...roadmap, status: nextStatus, ...updated })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/admin/roadmaps" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách roadmap
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{roadmapTitle(roadmap ?? undefined)}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Xem đầy đủ nội dung lộ trình học, người tạo và dữ liệu GitHub được dùng để đề xuất roadmap.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchRoadmap} isLoading={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          {roadmap && (
            <Button
              variant={roadmap.status === 'active' ? 'outline' : 'default'}
              onClick={handleToggleStatus}
              isLoading={isUpdating}
            >
              {roadmap.status === 'active' ? (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Lưu trữ roadmap
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Khôi phục roadmap
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-10 text-center text-slate-500">Đang tải chi tiết roadmap...</CardContent>
        </Card>
      ) : !roadmap ? (
        <Card>
          <CardContent className="p-10 text-center text-slate-500">Không tìm thấy roadmap phù hợp.</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => (
              <Card key={item.label}>
                <CardContent className="p-5">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>Tổng quan roadmap</CardTitle>
                  <CardDescription>{roadmap.summary || 'Roadmap này chưa có phần tóm tắt.'}</CardDescription>
                </div>
                <Badge variant={roadmap.status === 'active' ? 'success' : 'warning'}>
                  {statusLabels[roadmap.status ?? ''] ?? roadmap.status ?? 'Chưa rõ'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">Người tạo</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{ownerName(roadmap)}</p>
                <p className="text-xs text-slate-500">{ownerEmail(roadmap)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mục tiêu nghề nghiệp</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{roadmap.targetRole || 'Chưa xác định'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Ngày tạo</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{formatDate(roadmap.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Cập nhật gần nhất</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{formatDate(roadmap.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {roadmap.currentGithubDirection && (
            <Card>
              <CardHeader>
                <CardTitle>Nhận định từ GitHub</CardTitle>
                <CardDescription>Phần này cho biết hệ thống đã nhìn thấy định hướng hiện tại của người dùng qua repository.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{roadmap.currentGithubDirection}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kỹ năng đã phát hiện</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(roadmap.sourceContextSummary?.detectedSkills ?? []).map((skill) => (
                    <Badge key={skill} variant="info">{skill}</Badge>
                  ))}
                  {(roadmap.sourceContextSummary?.detectedSkills ?? []).length === 0 && (
                    <span className="text-sm text-slate-500">Chưa có dữ liệu kỹ năng.</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kỹ năng cần bổ sung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(roadmap.sourceContextSummary?.missingSkills ?? []).map((skill) => (
                    <Badge key={skill} variant="warning">{skill}</Badge>
                  ))}
                  {(roadmap.sourceContextSummary?.missingSkills ?? []).length === 0 && (
                    <span className="text-sm text-slate-500">Chưa có kỹ năng thiếu nổi bật.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{roadmap.mainPath?.title || 'Lộ trình chính'}</CardTitle>
              <CardDescription>{roadmap.mainPath?.reason || 'Các giai đoạn học chính trong roadmap.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {phasesOf(roadmap).length === 0 ? (
                <p className="text-sm text-slate-500">Roadmap này chưa có giai đoạn học.</p>
              ) : phasesOf(roadmap).map((phase, index) => (
                <div key={phase._id || phase.title || index} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-950 dark:text-slate-50">{phase.title || `Giai đoạn ${index + 1}`}</h3>
                      {phase.goal && <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{phase.goal}</p>}
                    </div>
                    <Badge variant="default">{phase.tasks?.length ?? 0} việc học</Badge>
                  </div>

                  {(phase.skills?.length ?? 0) > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {phase.skills?.map((skill) => (
                        <Badge key={skill} variant="info">{skill}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    {(phase.tasks ?? []).map((task) => (
                      <div key={task._id || task.title} className="rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-950/50">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <p className="font-medium text-slate-950 dark:text-slate-50">{task.title || 'Việc học chưa đặt tên'}</p>
                          <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'default'}>
                            {taskStatusLabels[task.status ?? ''] ?? task.status ?? 'Chưa bắt đầu'}
                          </Badge>
                        </div>
                        {task.description && <p className="mt-2 leading-6 text-slate-600 dark:text-slate-300">{task.description}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {task.estimatedHours ? <Badge variant="warning">{task.estimatedHours} giờ</Badge> : null}
                          {(task.skillTags ?? []).map((skill) => (
                            <Badge key={skill} variant="default">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {(roadmap.supportingPaths?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hướng phát triển phụ</CardTitle>
                <CardDescription>Các hướng bổ sung giúp người dùng tăng khả năng sẵn sàng cho công việc.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                {roadmap.supportingPaths?.map((path) => (
                  <div key={path._id || path.title} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-950 dark:text-slate-50">{path.title || 'Hướng phát triển'}</h3>
                    {path.reason && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{path.reason}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(path.skills ?? []).map((skill) => (
                        <Badge key={skill} variant="default">{skill}</Badge>
                      ))}
                    </div>
                    {(path.suggestedTasks?.length ?? 0) > 0 && (
                      <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        {path.suggestedTasks?.map((task) => (
                          <li key={task} className="rounded-md bg-slate-50 p-3 dark:bg-slate-950/50">{task}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
