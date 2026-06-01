import { Navigate, useParams, Link } from 'react-router'
import { ArrowLeft, Bookmark, CheckCircle2, Clock, Target, Users } from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../app/components/ui/tabs'
import { ContinueLearningCard } from '../components/ContinueLearningCard'
import { LearningTimeline } from '../components/LearningTimeline'
import { MilestoneTracker } from '../components/MilestoneTracker'
import { RoadmapTree } from '../components/RoadmapTree'
import { SkillRadarChart } from '../components/SkillRadarChart'
import { XPCard } from '../components/XPCard'
import { useRoadmapProgress } from '../hooks/useRoadmapProgress'
import { useRoadmapStore } from '../stores/roadmapStore'
import { formatRoadmapDifficulty, getDifficultyTone, getRoadmapNodes } from '../utils/roadmapUtils'

export const RoadmapDetailPage = () => {
  const { id } = useParams()
  const { getRoadmapById, updateNodeStatus, toggleBookmark, learningStats, skillProgress } = useRoadmapStore()
  const roadmap = id ? getRoadmapById(id) : undefined
  const { completion, hoursRemaining, nextNode } = useRoadmapProgress(roadmap)

  if (!roadmap) {
    return <Navigate to="/roadmaps" replace />
  }

  const nodes = getRoadmapNodes(roadmap)
  const completedNodes = nodes.filter((node) => node.status === 'completed').length

  return (
    <div className="max-w-7xl space-y-6">
      <Link to="/roadmaps">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại roadmap
        </Button>
      </Link>

      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />
        <CardContent className="p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="info">{roadmap.category}</Badge>
                <Badge variant={getDifficultyTone(roadmap.difficulty)}>{formatRoadmapDifficulty(roadmap.difficulty)}</Badge>
                {roadmap.isAIRecommended && <Badge variant="success">AI đề xuất</Badge>}
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
                  <p className="text-slate-500 dark:text-slate-400">{roadmap.estimatedHours} giờ tổng cộng</p>
                </div>
                <div>
                  <Users className="mb-2 h-4 w-4 text-cyan-500" />
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{roadmap.learners.toLocaleString()}</p>
                  <p className="text-slate-500 dark:text-slate-400">người đang học</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Hoàn thành</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{completion}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${completion}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {completedNodes}/{nodes.length} node đã hoàn thành - còn {hoursRemaining} giờ
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Tabs defaultValue="roadmap">
            <TabsList className="bg-white/90 dark:bg-slate-900/90">
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="objectives">Mục tiêu</TabsTrigger>
              <TabsTrigger value="resources">Tài nguyên</TabsTrigger>
            </TabsList>
            <TabsContent value="roadmap" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sơ đồ roadmap tương tác</CardTitle>
                  <CardDescription>Mở rộng node, tiếp tục bài học, lưu chủ đề và đánh dấu nhiệm vụ đã hoàn thành.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RoadmapTree
                    roadmap={roadmap}
                    onStatusChange={(nodeId, status) => updateNodeStatus(roadmap.id, nodeId, status)}
                    onBookmarkToggle={(nodeId) => toggleBookmark(roadmap.id, nodeId)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="objectives" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mục tiêu học tập</CardTitle>
                  <CardDescription>Mục tiêu theo kết quả cho hướng {roadmap.careerOutcome}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {roadmap.objectives.map((objective) => (
                    <div key={objective} className="flex gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                      <Target className="mt-0.5 h-5 w-5 text-indigo-500" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">{objective}</p>
                    </div>
                  ))}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Kỹ năng yêu cầu</p>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.requiredSkills.map((skill) => <Badge key={skill} variant="default">{skill}</Badge>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="resources" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bài tập, dự án và quiz</CardTitle>
                  <CardDescription>Toàn bộ phần thực hành được gom từ các node roadmap</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {nodes.map((node) => (
                    <div key={node.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{node.title}</p>
                        <Badge variant="info">{node.estimatedHours}h</Badge>
                      </div>
                      {node.project && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Dự án: {node.project}</p>}
                      {node.quiz && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Quiz: {node.quiz.questions} câu hỏi - đạt từ {node.quiz.passingScore}%
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6">
          <ContinueLearningCard roadmap={roadmap} />
          <XPCard stats={learningStats} />
          {nextNode && (
            <Card>
              <CardHeader>
                <CardTitle>Bước tiếp theo được đề xuất</CardTitle>
                <CardDescription>Gợi ý từ AI Mentor dựa trên tiến độ hiện tại</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950/40">
                  <p className="font-medium text-indigo-950 dark:text-indigo-100">{nextNode.title}</p>
                  <p className="mt-1 text-sm text-indigo-800 dark:text-indigo-300">{nextNode.description}</p>
                </div>
              </CardContent>
            </Card>
          )}
          <MilestoneTracker roadmap={roadmap} />
          <LearningTimeline roadmap={roadmap} />
          <SkillRadarChart skills={skillProgress} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-indigo-500" />
                Ghi chú và mục đã lưu
              </CardTitle>
              <CardDescription>Bài học đã lưu được đồng bộ với hồ sơ học tập của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {nodes.filter((node) => node.bookmarked).map((node) => (
                <div key={node.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{node.title}</p>
                  {node.notes && <p className="mt-1 text-slate-500 dark:text-slate-400">{node.notes}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
