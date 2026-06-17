import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Archive, Eye, RefreshCw, RotateCcw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import {
  adminApi,
  type AdminPagination,
  type AdminRoadmap,
  type AdminRoadmapOwner,
  type AdminRoadmapStatus
} from '../../services/apis/adminApi'

const defaultPagination: AdminPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
}

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

const roadmapId = (roadmap: AdminRoadmap) => roadmap._id || roadmap.id || ''
const roadmapOwner = (roadmap: AdminRoadmap): AdminRoadmapOwner | null => {
  if (!roadmap.userId || typeof roadmap.userId === 'string') return null
  return roadmap.userId
}

const ownerName = (roadmap: AdminRoadmap) => {
  const owner = roadmapOwner(roadmap)
  return owner?.fullName || owner?.name || owner?.email || 'Người dùng'
}

const ownerEmail = (roadmap: AdminRoadmap) => roadmapOwner(roadmap)?.email || 'Chưa có email'
const roadmapTitle = (roadmap: AdminRoadmap) => roadmap.mainPath?.title || roadmap.targetRole || 'Roadmap chưa đặt tên'
const phasesOf = (roadmap: AdminRoadmap) => roadmap.mainPath?.phases ?? []
const taskCountOf = (roadmap: AdminRoadmap) => phasesOf(roadmap).reduce((total, phase) => total + (phase.tasks?.length ?? 0), 0)
const hourCountOf = (roadmap: AdminRoadmap) => phasesOf(roadmap).reduce(
  (total, phase) => total + (phase.tasks ?? []).reduce((sum, task) => sum + (task.estimatedHours ?? 0), 0),
  0
)

const containsText = (value: string | undefined, search: string) => value?.toLowerCase().includes(search) ?? false

export const AdminRoadmapsPanel = () => {
  const navigate = useNavigate()
  const [roadmaps, setRoadmaps] = useState<AdminRoadmap[]>([])
  const [selectedRoadmap, setSelectedRoadmap] = useState<AdminRoadmap | null>(null)
  const [pagination, setPagination] = useState(defaultPagination)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [updatingRoadmapId, setUpdatingRoadmapId] = useState('')
  const [loadingDetailId, setLoadingDetailId] = useState('')
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')

  const filteredRoadmaps = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return roadmaps

    return roadmaps.filter((roadmap) => (
      containsText(roadmapTitle(roadmap), keyword) ||
      containsText(roadmap.targetRole, keyword) ||
      containsText(ownerName(roadmap), keyword) ||
      containsText(ownerEmail(roadmap), keyword)
    ))
  }, [roadmaps, search])

  const fetchRoadmaps = async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await adminApi.getRoadmaps({
        page,
        limit: 20,
        status: status || undefined
      })
      setRoadmaps(payload.items ?? [])
      setPagination(payload.pagination ?? defaultPagination)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRoadmaps()
  }, [page, status])

  const handleViewRoadmap = async (roadmap: AdminRoadmap) => {
    const id = roadmapId(roadmap)
    setSelectedRoadmap(roadmap)
    setDetailError('')

    if (!id) {
      setDetailError('Không tìm thấy mã roadmap để xem chi tiết.')
      return
    }

    setLoadingDetailId(id)
    try {
      const detail = await adminApi.getRoadmap(id)
      setSelectedRoadmap({ ...roadmap, ...(detail ?? {}) })
    } catch (err) {
      setDetailError(getApiErrorMessage(err))
      setSelectedRoadmap(roadmap)
    } finally {
      setLoadingDetailId('')
    }
  }

  const handleToggleStatus = async (roadmap: AdminRoadmap) => {
    const id = roadmapId(roadmap)
    if (!id) return

    const nextStatus: AdminRoadmapStatus = roadmap.status === 'active' ? 'archived' : 'active'
    setUpdatingRoadmapId(id)
    setError('')

    try {
      const updated = await adminApi.updateRoadmapStatus(id, nextStatus)
      const nextRoadmap = { ...roadmap, status: nextStatus, ...updated }

      setRoadmaps((current) => current.map((item) => roadmapId(item) === id ? nextRoadmap : item))
      setSelectedRoadmap((current) => current && roadmapId(current) === id ? { ...current, ...nextRoadmap } : current)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setUpdatingRoadmapId('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Roadmap người dùng</CardTitle>
            <CardDescription>
              Theo dõi các lộ trình học đã được tạo và ẩn những roadmap không còn phù hợp.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={fetchRoadmaps} isLoading={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-[1fr_190px]">
          <Input
            placeholder="Tìm theo tên roadmap, mục tiêu hoặc người tạo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hiển thị</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Roadmap</th>
                  <th className="px-4 py-3">Người tạo</th>
                  <th className="px-4 py-3">Nội dung</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Đang tải roadmap...</td>
                  </tr>
                ) : filteredRoadmaps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Chưa có roadmap phù hợp.</td>
                  </tr>
                ) : filteredRoadmaps.map((roadmap) => {
                  const id = roadmapId(roadmap)
                  const isUpdating = updatingRoadmapId === id
                  const isLoadingDetail = loadingDetailId === id

                  return (
                    <tr key={id} className="bg-white align-top dark:bg-slate-950/40">
                      <td className="px-4 py-3">
                        <p className="max-w-md font-medium text-slate-950 dark:text-slate-50">{roadmapTitle(roadmap)}</p>
                        <p className="mt-1 text-xs text-slate-500">Mục tiêu: {roadmap.targetRole || 'Chưa xác định'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{ownerName(roadmap)}</p>
                        <p className="text-xs text-slate-500">{ownerEmail(roadmap)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="info">{phasesOf(roadmap).length} giai đoạn</Badge>
                          <Badge variant="default">{taskCountOf(roadmap)} việc học</Badge>
                          <Badge variant="warning">{hourCountOf(roadmap)} giờ</Badge>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {roadmap.sourceContextSummary?.repositoriesCount ?? 0} repository được dùng làm ngữ cảnh
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roadmap.status === 'active' ? 'success' : 'warning'}>
                          {statusLabels[roadmap.status ?? ''] ?? roadmap.status ?? 'Chưa rõ'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(roadmap.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" disabled={!id} isLoading={isLoadingDetail} onClick={() => navigate(`/admin/roadmaps/${id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Chi tiết
                          </Button>
                          <Button
                            variant={roadmap.status === 'active' ? 'outline' : 'default'}
                            size="sm"
                            isLoading={isUpdating}
                            onClick={() => handleToggleStatus(roadmap)}
                          >
                            {roadmap.status === 'active' ? (
                              <>
                                <Archive className="mr-2 h-4 w-4" />
                                Lưu trữ
                              </>
                            ) : (
                              <>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Khôi phục
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {pagination.total > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Trang {pagination.page} / {Math.max(pagination.totalPages, 1)} - tổng {pagination.total} roadmap
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trước</Button>
              <Button variant="outline" size="sm" disabled={pagination.totalPages === 0 || page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button>
            </div>
          </div>
        )}

        {selectedRoadmap && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
            {detailError && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                Không tải được chi tiết mới nhất từ máy chủ: {detailError}
              </div>
            )}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Chi tiết roadmap</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{roadmapTitle(selectedRoadmap)}</h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {selectedRoadmap.summary || 'Roadmap này chưa có phần tóm tắt.'}
                </p>
              </div>
              <Badge variant={selectedRoadmap.status === 'active' ? 'success' : 'warning'}>
                {statusLabels[selectedRoadmap.status ?? ''] ?? selectedRoadmap.status ?? 'Chưa rõ'}
              </Badge>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Người tạo</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{ownerName(selectedRoadmap)}</p>
                <p className="text-xs text-slate-500">{ownerEmail(selectedRoadmap)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mục tiêu nghề nghiệp</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{selectedRoadmap.targetRole || 'Chưa xác định'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Ngữ cảnh GitHub</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">
                  {selectedRoadmap.sourceContextSummary?.repositoriesCount ?? 0} repository
                </p>
              </div>
            </div>

            {selectedRoadmap.currentGithubDirection && (
              <div className="mt-5 rounded-lg bg-white p-4 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <p className="mb-1 font-semibold text-slate-950 dark:text-slate-50">Nhận định từ GitHub</p>
                {selectedRoadmap.currentGithubDirection}
              </div>
            )}

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg bg-white p-4 dark:bg-slate-900">
                <p className="font-semibold text-slate-950 dark:text-slate-50">Kỹ năng đã phát hiện</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selectedRoadmap.sourceContextSummary?.detectedSkills ?? []).slice(0, 18).map((skill) => (
                    <Badge key={skill} variant="info">{skill}</Badge>
                  ))}
                  {(selectedRoadmap.sourceContextSummary?.detectedSkills ?? []).length === 0 && (
                    <span className="text-sm text-slate-500">Chưa có dữ liệu kỹ năng.</span>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-white p-4 dark:bg-slate-900">
                <p className="font-semibold text-slate-950 dark:text-slate-50">Kỹ năng cần bổ sung</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selectedRoadmap.sourceContextSummary?.missingSkills ?? []).map((skill) => (
                    <Badge key={skill} variant="warning">{skill}</Badge>
                  ))}
                  {(selectedRoadmap.sourceContextSummary?.missingSkills ?? []).length === 0 && (
                    <span className="text-sm text-slate-500">Chưa có kỹ năng thiếu nổi bật.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <p className="font-semibold text-slate-950 dark:text-slate-50">Các giai đoạn chính</p>
              {phasesOf(selectedRoadmap).length === 0 ? (
                <p className="text-sm text-slate-500">Roadmap này chưa có giai đoạn học.</p>
              ) : phasesOf(selectedRoadmap).map((phase, index) => (
                <div key={phase._id || phase.title || index} className="rounded-lg bg-white p-4 dark:bg-slate-900">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-950 dark:text-slate-50">{phase.title || `Giai đoạn ${index + 1}`}</p>
                      {phase.goal && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{phase.goal}</p>}
                    </div>
                    <Badge variant="default">{phase.tasks?.length ?? 0} việc học</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(phase.tasks ?? []).slice(0, 4).map((task) => (
                      <div key={task._id || task.title} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{task.title || 'Việc học chưa đặt tên'}</p>
                          <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'default'}>
                            {taskStatusLabels[task.status ?? ''] ?? task.status ?? 'Chưa bắt đầu'}
                          </Badge>
                        </div>
                        {task.description && <p className="mt-1 text-slate-600 dark:text-slate-300">{task.description}</p>}
                        {task.estimatedHours ? <p className="mt-2 text-xs text-slate-500">Ước tính {task.estimatedHours} giờ</p> : null}
                      </div>
                    ))}
                    {(phase.tasks?.length ?? 0) > 4 && (
                      <p className="text-xs text-slate-500">Còn {(phase.tasks?.length ?? 0) - 4} việc học khác trong giai đoạn này.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(selectedRoadmap.supportingPaths?.length ?? 0) > 0 && (
              <div className="mt-5 space-y-3">
                <p className="font-semibold text-slate-950 dark:text-slate-50">Hướng phát triển phụ</p>
                <div className="grid gap-3 lg:grid-cols-2">
                  {selectedRoadmap.supportingPaths?.map((path) => (
                    <div key={path._id || path.title} className="rounded-lg bg-white p-4 dark:bg-slate-900">
                      <p className="font-medium text-slate-950 dark:text-slate-50">{path.title || 'Hướng phát triển'}</p>
                      {path.reason && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{path.reason}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(path.skills ?? []).slice(0, 8).map((skill) => (
                          <Badge key={skill} variant="default">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
