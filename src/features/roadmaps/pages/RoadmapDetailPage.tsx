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
import { getDifficultyTone, getRoadmapNodes } from '../utils/roadmapUtils'

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
          Back to roadmaps
        </Button>
      </Link>

      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />
        <CardContent className="p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="info">{roadmap.category}</Badge>
                <Badge variant={getDifficultyTone(roadmap.difficulty)}>{roadmap.difficulty}</Badge>
                {roadmap.isAIRecommended && <Badge variant="success">AI recommended</Badge>}
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
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{roadmap.estimatedWeeks} weeks</p>
                  <p className="text-slate-500 dark:text-slate-400">{roadmap.estimatedHours} total hours</p>
                </div>
                <div>
                  <Users className="mb-2 h-4 w-4 text-cyan-500" />
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{roadmap.learners.toLocaleString()}</p>
                  <p className="text-slate-500 dark:text-slate-400">active learners</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Completion</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{completion}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${completion}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {completedNodes}/{nodes.length} nodes completed · {hoursRemaining}h remaining
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
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            <TabsContent value="roadmap" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interactive Roadmap Graph</CardTitle>
                  <CardDescription>Expand nodes, resume lessons, bookmark topics and mark learning tasks complete.</CardDescription>
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
                  <CardTitle>Learning Objectives</CardTitle>
                  <CardDescription>Outcome-driven goals for {roadmap.careerOutcome}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {roadmap.objectives.map((objective) => (
                    <div key={objective} className="flex gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                      <Target className="mt-0.5 h-5 w-5 text-indigo-500" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">{objective}</p>
                    </div>
                  ))}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Required skills</p>
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
                  <CardTitle>Exercises, Projects and Quizzes</CardTitle>
                  <CardDescription>All practical work grouped from roadmap nodes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {nodes.map((node) => (
                    <div key={node.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{node.title}</p>
                        <Badge variant="info">{node.estimatedHours}h</Badge>
                      </div>
                      {node.project && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Project: {node.project}</p>}
                      {node.quiz && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Quiz: {node.quiz.questions} questions · pass at {node.quiz.passingScore}%
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
                <CardTitle>Recommended Next Step</CardTitle>
                <CardDescription>AI mentor suggestion based on current progress</CardDescription>
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
                Notes and Bookmarks
              </CardTitle>
              <CardDescription>Saved lessons stay synced with your learning profile</CardDescription>
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
