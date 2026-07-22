import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { Archive, ArrowLeft, Clock, GitBranch, MessageSquare, RotateCcw, Sparkles, Target, Trash2 } from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import { ConfirmDialog } from '../../../app/components/common/ConfirmDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../app/components/ui/tabs'
import { RoadmapTree } from '../components/RoadmapTree'
import { CourseraRecommendationSection } from '../components/CourseraRecommendationSection'
import { useRoadmapProgress } from '../hooks/useRoadmapProgress'
import { useLearningStore } from '../stores/learningStore'
import { useRoadmapStore } from '../stores/roadmapStore'
import { useChatStore } from '../../../app/stores/chatStore'
import { formatRoadmapDifficulty, formatUserLevel, getDifficultyTone, getRoadmapNodes } from '../utils/roadmapUtils'

export const RoadmapDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    getRoadmapById,
    fetchRoadmapDetail,
    archiveRoadmap,
    deleteRoadmap,
    resetRoadmapProgress,
    updateNodeStatus,
    toggleBookmark,
    isLoading,
    error
  } = useRoadmapStore()
  const [isArchiving, setIsArchiving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const createSession = useChatStore(state => state.createSession)
  const restoredReturnPositionRef = useRef<string | null>(null)
  const { roadmapLearning, fetchRoadmapLearning } = useLearningStore()
  const roadmap = id ? getRoadmapById(id) : undefined
  const { completion, hoursRemaining } = useRoadmapProgress(roadmap)

  useEffect(() => {
    if (id && !roadmap) {
      fetchRoadmapDetail(id)
    }
  }, [fetchRoadmapDetail, id, roadmap])

  useEffect(() => {
    if (roadmap?.id) {
      fetchRoadmapLearning(roadmap.id).catch(() => undefined)
    }
  }, [fetchRoadmapLearning, roadmap?.id])

  useEffect(() => {
    if (!roadmap?.id || !roadmap.modules.length || typeof window === 'undefined') return

    const storageKey = `roadmap:return:${roadmap.id}`
    if (restoredReturnPositionRef.current === storageKey) return

    const storedValue = sessionStorage.getItem(storageKey)
    const locationState = location.state as { restoreItemId?: string; restoreScrollY?: number } | null
    let restoreData: { itemId?: string; scrollY?: number; ts?: number } | null = null

    if (storedValue) {
      try {
        restoreData = JSON.parse(storedValue) as { itemId?: string; scrollY?: number; ts?: number }
      } catch {
        sessionStorage.removeItem(storageKey)
      }
    }

    if (!restoreData && locationState?.restoreItemId) {
      restoreData = {
        itemId: locationState.restoreItemId,
        scrollY: locationState.restoreScrollY,
        ts: Date.now()
      }
    }

    if (!restoreData?.itemId && typeof restoreData?.scrollY !== 'number') return
    if (restoreData.ts && Date.now() - restoreData.ts > 10 * 60 * 1000) {
      sessionStorage.removeItem(storageKey)
      return
    }

    restoredReturnPositionRef.current = storageKey

    let timeoutId: number | undefined

    const restoreScroll = (attempt = 0) => {
      const taskElement = restoreData?.itemId
        ? Array.from(document.querySelectorAll<HTMLElement>('[data-roadmap-item-id]'))
          .find((element) => element.getAttribute('data-roadmap-item-id') === restoreData?.itemId)
        : null

      if (taskElement) {
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        sessionStorage.removeItem(storageKey)
        navigate(location.pathname, { replace: true, state: null })
        return
      }

      if (attempt < 3) {
        timeoutId = window.setTimeout(() => restoreScroll(attempt + 1), 150)
        return
      }

      if (typeof restoreData?.scrollY === 'number') {
        window.scrollTo({ top: restoreData.scrollY, behavior: 'smooth' })
      }

      sessionStorage.removeItem(storageKey)
      navigate(location.pathname, { replace: true, state: null })
    }

    const frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => restoreScroll(), 120)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [location.pathname, location.state, navigate, roadmap?.id, roadmap?.modules.length])

  const handleArchive = async () => {
    if (!roadmap) return

    setIsArchiving(true)
    await archiveRoadmap(roadmap.id)
    setIsArchiving(false)
    navigate('/roadmaps')
  }

  const confirmDelete = async () => {
    if (!roadmap) return

    setIsDeleting(true)
    try {
      await deleteRoadmap(roadmap.id)
      setIsDeleteDialogOpen(false)
      navigate('/roadmaps')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAskAi = async () => {
    if (!roadmap) return

    setIsCreatingChat(true)
    try {
      await createSession({
        title: `Tư vấn roadmap ${roadmap.careerOutcome || roadmap.title}`,
        roadmapId: roadmap.id
      })
      navigate('/chat')
    } finally {
      setIsCreatingChat(false)
    }
  }

  const handleResetProgress = async () => {
    if (!roadmap) return

    setIsResetting(true)
    await resetRoadmapProgress(roadmap.id)
    setIsResetting(false)
  }

  if (!roadmap) {
    return (
      <div className="max-w-4xl space-y-6">
        <Link to="/roadmaps">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại roadmap
          </Button>
        </Link>
        <Card>
          <CardContent className="p-10 text-center">
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {isLoading ? 'Đang tải chi tiết roadmap...' : 'Không tìm thấy roadmap'}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {error ?? 'Roadmap có thể đã được lưu trữ hoặc không thuộc tài khoản hiện tại.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isArchived = roadmap.status === 'archived'
  const learningStatusByItemId = new Map(
    (roadmapLearning?.roadmapId === roadmap.id ? roadmapLearning.items : [])
      .map((item) => [item.itemId, item.learningStatus] as const)
  )
  const roadmapWithLearningStatus = {
    ...roadmap,
    modules: roadmap.modules.map((module) => ({
      ...module,
      nodes: module.nodes.map((node) => ({
        ...node,
        learningStatus: node.itemId && learningStatusByItemId.has(node.itemId)
          ? learningStatusByItemId.get(node.itemId)
          : node.learningStatus
      }))
    }))
  }
  const nodes = getRoadmapNodes(roadmapWithLearningStatus)
  const phaseCount = roadmapWithLearningStatus.modules.length
  const renderedTaskCount = nodes.length
  const completedNodes = nodes.filter((node) => node.status === 'completed').length
  const roleMatch = roadmap.roleMatch
  const skillGapSummary = roadmap.skillGapSummary
  const prioritySkills = [
    ...(skillGapSummary?.prioritySkills ?? []),
    ...(skillGapSummary?.recommendedNextSkills ?? [])
  ].filter((skill, index, list) => skill && list.indexOf(skill) === index).slice(0, 6)
  const completedTaskCount = roadmap.progressSummary?.completedItems ?? completedNodes
  const totalTaskCount = roadmap.progressSummary?.totalItems ?? nodes.length
  const roadmapSource = roadmap.roadmapSource && typeof roadmap.roadmapSource === 'object' ? roadmap.roadmapSource : undefined
  const selectedRoleLabel = roadmap.roleMatch?.roleName || roadmapSource?.selectedRoleId || roadmap.careerOutcome
  const sourceRepositoryLabel = roadmapSource?.sourceRepositoryName || roadmapSource?.fullName || roadmapSource?.repoName
  const selectionTypeLabel = roadmapSource?.roleSelectionType === 'current_repository_primary'
    ? 'Vai trò chính'
    : roadmapSource?.roleSelectionType === 'portfolio_repository_primary' || roadmapSource?.roleSelectionType === 'portfolio_suggestion'
      ? 'Vai trò từ portfolio'
      : undefined
  const pipelineLabel = typeof roadmapSource?.pipelineVersion === 'string' ? roadmapSource.pipelineVersion : undefined
  const effectiveLevelText = roadmap.effectiveLevel ? formatUserLevel(roadmap.effectiveLevel) : undefined
  const requestedLevelText = roadmap.requestedLevel ? formatUserLevel(roadmap.requestedLevel) : undefined
  const hasDetailedProvenance = Boolean(roadmapSource?.selectedRoleId || sourceRepositoryLabel || selectionTypeLabel || pipelineLabel)

  return (
    <>
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/roadmaps">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại roadmap
          </Button>
        </Link>
        {!isArchived && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" isLoading={isResetting} onClick={handleResetProgress}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset tiến độ
            </Button>
            <Button variant="outline" isLoading={isCreatingChat} onClick={handleAskAi}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Hỏi AI về roadmap này
            </Button>
            <Button variant="outline" isLoading={isArchiving} onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Lưu trữ roadmap
            </Button>
            <Button variant="destructive" isLoading={isDeleting} onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa roadmap
            </Button>
          </div>
        )}
      </div>

      {isArchived && (
        <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
          <CardContent className="flex items-start gap-3 p-4">
            <Archive className="mt-0.5 h-5 w-5 text-slate-500" />
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Roadmap này đang ở kho lưu trữ</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Roadmap lưu trữ không nằm trong lộ trình học chính. Bạn vẫn có thể xem lại nội dung, mục tiêu và các nhiệm vụ đã lưu.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className={`h-2 ${isArchived ? 'bg-slate-500' : 'bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500'}`} />
        <CardContent className="p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="info">{roadmap.category}</Badge>
                <Badge variant={getDifficultyTone(roadmap.difficulty)}>{formatRoadmapDifficulty(roadmap.difficulty)}</Badge>
                <Badge variant={isArchived ? 'default' : 'success'}>
                  {isArchived ? 'Đã lưu trữ' : 'Đang học'}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-slate-950 dark:text-slate-50">{roadmap.title}</h1>
              <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-400">{roadmap.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {roadmap.tags.map((tag) => <Badge key={tag} variant="default">{tag}</Badge>)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Clock className="mb-2 h-4 w-4 text-indigo-500" />
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{roadmap.estimatedWeeks} tuần dự kiến</p>
                  <p className="text-slate-500 dark:text-slate-400">{roadmap.estimatedHours} giờ dự kiến</p>
                </div>
                <div>
                  <GitBranch className="mb-2 h-4 w-4 text-cyan-500" />
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{phaseCount} giai đoạn</p>
                  <p className="text-slate-500 dark:text-slate-400">{renderedTaskCount} nhiệm vụ</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{isArchived ? 'Tiến độ đã lưu' : 'Hoàn thành'}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{completion}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${isArchived ? 'bg-slate-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-500'}`} style={{ width: `${completion}%` }} />
                </div>
                {totalTaskCount > 0 ? (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {completedTaskCount}/{totalTaskCount} bài học hoàn thành
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {completedNodes}/{nodes.length} nhiệm vụ đã hoàn thành - còn {hoursRemaining} giờ
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(roadmapSource || roadmap.effectiveLevel || roadmap.requestedLevel) && (
        <Card>
          <CardHeader>
            <CardTitle>Cơ sở cá nhân hóa roadmap</CardTitle>
            <CardDescription>{hasDetailedProvenance ? 'Thông tin nguồn do backend trả về khi tạo roadmap.' : 'Roadmap cũ không có thông tin nguồn chi tiết.'}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">Roadmap theo vai trò</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{selectedRoleLabel}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">Nguồn vai trò</p>
              <p className="mt-1 truncate font-semibold text-slate-900 dark:text-slate-100">{sourceRepositoryLabel || 'Không có thông tin nguồn chi tiết'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">Loại lựa chọn</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{selectionTypeLabel || 'Không có thông tin'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">Trình độ yêu cầu / thực tế</p>
              <p className="mt-1 font-semibold text-indigo-700 dark:text-indigo-300">
                {requestedLevelText || '—'} / {effectiveLevelText || '—'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">Pipeline</p>
              <p className="mt-1 break-all font-semibold text-slate-900 dark:text-slate-100">{pipelineLabel || 'Không có thông tin'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {(roleMatch || skillGapSummary || prioritySkills.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Cá nhân hóa theo role match
            </CardTitle>
            <CardDescription>
              Roadmap này được ưu tiên theo mức phù hợp của repository và các khoảng trống kỹ năng quan trọng nhất.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm text-slate-500">Vai trò mục tiêu</p>
              <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{roleMatch?.roleName || roadmap.careerOutcome}</p>
              {typeof roleMatch?.matchScore === 'number' && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Mức phù hợp</span>
                    <span>{Math.round(roleMatch.matchScore)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(0, Math.min(100, roleMatch.matchScore))}%` }} />
                  </div>
                  {roleMatch.matchLevelLabel && <Badge className="mt-3" variant="info">{roleMatch.matchLevelLabel}</Badge>}
                </div>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-lg font-semibold">{skillGapSummary?.totalGaps ?? roadmap.missingSkills?.length ?? 0}</p>
                  <p className="text-xs text-slate-500">khoảng trống</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-lg font-semibold">{skillGapSummary?.missingRequiredCount ?? 0}</p>
                  <p className="text-xs text-slate-500">thiếu cốt lõi</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-lg font-semibold">{skillGapSummary?.weakSkillCount ?? 0}</p>
                  <p className="text-xs text-slate-500">cần củng cố</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Kỹ năng ưu tiên</p>
                {prioritySkills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {prioritySkills.map((skill) => <Badge key={skill} variant="warning">{skill}</Badge>)}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Chưa có danh sách kỹ năng ưu tiên trong dữ liệu roadmap.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CourseraRecommendationSection roadmapId={roadmap.id} />

      <Tabs defaultValue="roadmap">
        <TabsList className="bg-white/90 dark:bg-slate-900/90">
          <TabsTrigger value="roadmap">Lộ trình</TabsTrigger>
          <TabsTrigger value="objectives">Mục tiêu</TabsTrigger>
          <TabsTrigger value="support">Hướng bổ trợ</TabsTrigger>
        </TabsList>
        <TabsContent value="roadmap" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{isArchived ? 'Nội dung roadmap đã lưu' : 'Lộ trình học'}</CardTitle>
              <CardDescription>
                {isArchived
                  ? 'Roadmap này đang được lưu để xem lại, không còn là lộ trình học chính.'
                  : 'Mở từng nhiệm vụ để xem kỹ năng, thời lượng và đánh dấu tiến độ.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoadmapTree
                roadmap={roadmapWithLearningStatus}
                onStatusChange={isArchived ? undefined : (nodeId, status) => updateNodeStatus(roadmap.id, nodeId, status)}
                onBookmarkToggle={isArchived ? undefined : (nodeId) => toggleBookmark(roadmap.id, nodeId)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="objectives" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mục tiêu và kỹ năng</CardTitle>
              <CardDescription>Các mục tiêu chính cho hướng {roadmap.careerOutcome}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {roadmap.objectives.length > 0 ? roadmap.objectives.map((objective) => (
                <div key={objective} className="flex gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <Target className="mt-0.5 h-5 w-5 text-indigo-500" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">{objective}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Roadmap này chưa có mục tiêu chi tiết.</p>
              )}
              <div>
                <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Kỹ năng cần tập trung</p>
                <div className="flex flex-wrap gap-2">
                  {roadmap.requiredSkills.map((skill) => <Badge key={skill} variant="default">{skill}</Badge>)}
                </div>
              </div>
              {roadmap.missingSkills && roadmap.missingSkills.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Kỹ năng nên bổ sung</p>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.missingSkills.map((skill) => <Badge key={skill} variant="warning">{skill}</Badge>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="support" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Hướng bổ trợ</CardTitle>
              <CardDescription>Các gợi ý thêm để portfolio và hồ sơ ứng tuyển rõ tín hiệu hơn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {roadmap.supportingPaths && roadmap.supportingPaths.length > 0 ? roadmap.supportingPaths.map((path) => (
                <div key={path.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{path.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{path.reason}</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    {path.suggestedTasks.map((task) => <li key={task}>• {task}</li>)}
                  </ul>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có hướng bổ trợ cho roadmap này.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    <ConfirmDialog
      open={isDeleteDialogOpen}
      title="Xóa lộ trình?"
      description={`Bạn có chắc muốn xóa lộ trình "${roadmap.title}" không? Lộ trình sẽ được ẩn khỏi danh sách của bạn.`}
      note="Hành động này không xóa repository, phân tích, learning content hoặc chat liên quan."
      confirmText="Xóa lộ trình"
      cancelText="Hủy"
      variant="danger"
      loading={isDeleting}
      onConfirm={confirmDelete}
      onCancel={() => setIsDeleteDialogOpen(false)}
    />
    </>
  )
}
