import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Archive, ArrowLeft, Clock, GitBranch, Target } from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../app/components/ui/tabs'
import { RoadmapTree } from '../components/RoadmapTree'
import { useRoadmapProgress } from '../hooks/useRoadmapProgress'
import { useRoadmapStore } from '../stores/roadmapStore'
import { formatRoadmapDifficulty, getDifficultyTone, getRoadmapNodes } from '../utils/roadmapUtils'

export const RoadmapDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    getRoadmapById,
    fetchRoadmapDetail,
    archiveRoadmap,
    updateNodeStatus,
    toggleBookmark,
    isLoading,
    error
  } = useRoadmapStore()
  const [isArchiving, setIsArchiving] = useState(false)
  const roadmap = id ? getRoadmapById(id) : undefined
  const { completion, hoursRemaining } = useRoadmapProgress(roadmap)

  useEffect(() => {
    if (id && !roadmap) {
      fetchRoadmapDetail(id)
    }
  }, [fetchRoadmapDetail, id, roadmap])

  const handleArchive = async () => {
    if (!roadmap) return

    setIsArchiving(true)
    await archiveRoadmap(roadmap.id)
    setIsArchiving(false)
    navigate('/roadmaps')
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
  const nodes = getRoadmapNodes(roadmap)
  const completedNodes = nodes.filter((node) => node.status === 'completed').length

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/roadmaps">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại roadmap
          </Button>
        </Link>
        {!isArchived && (
          <Button variant="outline" isLoading={isArchiving} onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Lưu trữ roadmap
          </Button>
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
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{roadmap.estimatedWeeks} tuần</p>
                  <p className="text-slate-500 dark:text-slate-400">{roadmap.estimatedHours} giờ dự kiến</p>
                </div>
                <div>
                  <GitBranch className="mb-2 h-4 w-4 text-cyan-500" />
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{roadmap.sourceRepositoriesCount ?? 0}</p>
                  <p className="text-slate-500 dark:text-slate-400">repository nguồn</p>
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
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {completedNodes}/{nodes.length} nhiệm vụ đã hoàn thành - còn {hoursRemaining} giờ
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                roadmap={roadmap}
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
  )
}
