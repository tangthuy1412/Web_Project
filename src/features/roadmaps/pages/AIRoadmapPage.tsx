import { useEffect } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, BrainCircuit, Clock, Route, Sparkles } from 'lucide-react'
import { AIRecommendationPanel } from '../components/AIRecommendationPanel'
import { LearningTimeline } from '../components/LearningTimeline'
import { RoadmapTree } from '../components/RoadmapTree'
import { SkillGapChart } from '../components/SkillGapChart'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import { useRoadmapStore } from '../stores/roadmapStore'
import { formatRoadmapDifficulty, formatSkillGapPriority } from '../utils/roadmapUtils'

export const AIRoadmapPage = () => {
  const { aiRecommendation, isGenerating, generateAIRoadmap, updateNodeStatus, toggleBookmark } = useRoadmapStore()

  useEffect(() => {
    if (!aiRecommendation) {
      generateAIRoadmap()
    }
  }, [aiRecommendation, generateAIRoadmap])

  if (!aiRecommendation) {
    return (
      <div className="max-w-7xl">
        <Card>
          <CardContent className="p-10 text-center">
            <BrainCircuit className="mx-auto h-10 w-10 animate-pulse text-indigo-500" />
            <p className="mt-4 font-medium text-slate-900 dark:text-slate-100">Đang tạo roadmap AI của bạn</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const roadmap = aiRecommendation.roadmap

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/roadmaps">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại roadmap
          </Button>
        </Link>
        <Badge variant="info">
          <Sparkles className="mr-1 h-3 w-3" />
          Được tạo từ phân tích GitHub
        </Badge>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-600 via-slate-900 to-cyan-700 p-6 text-white shadow-xl shadow-indigo-500/15 dark:border-indigo-900"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{roadmap.category}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{formatRoadmapDifficulty(roadmap.difficulty)}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{roadmap.careerOutcome}</span>
            </div>
            <h1 className="text-3xl font-bold">{roadmap.title}</h1>
            <p className="mt-2 max-w-3xl text-white/80">{roadmap.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/10 p-4">
              <Clock className="mb-2 h-5 w-5 text-cyan-200" />
              <p className="text-2xl font-bold">{aiRecommendation.estimatedCompletionWeeks} tuần</p>
              <p className="text-xs text-white/70">Thời gian dự kiến</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <Route className="mb-2 h-5 w-5 text-emerald-200" />
              <p className="text-2xl font-bold">{roadmap.progress}%</p>
              <p className="text-xs text-white/70">Tiến độ hiện tại</p>
            </div>
          </div>
        </div>
      </motion.div>

      <AIRecommendationPanel
        recommendation={aiRecommendation}
        isGenerating={isGenerating}
        onRegenerate={generateAIRoadmap}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lộ trình học đề xuất</CardTitle>
              <CardDescription>Các node có thể mở rộng gồm điều kiện tiên quyết, tài nguyên, mini project, ghi chú và thao tác tiến độ.</CardDescription>
            </CardHeader>
            <CardContent>
              <RoadmapTree
                roadmap={roadmap}
                onStatusChange={(nodeId, status) => updateNodeStatus(roadmap.id, nodeId, status)}
                onBookmarkToggle={(nodeId) => toggleBookmark(roadmap.id, nodeId)}
              />
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-6">
          <SkillGapChart gaps={aiRecommendation.skillGaps} />
          <LearningTimeline roadmap={roadmap} />
          <Card>
            <CardHeader>
              <CardTitle>Kỹ năng còn thiếu</CardTitle>
              <CardDescription>Được ưu tiên từ điểm yếu repository và điểm phân tích</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiRecommendation.skillGaps.map((gap) => (
                <div key={gap.skill} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{gap.skill}</p>
                    <Badge variant={gap.priority === 'Critical' ? 'danger' : gap.priority === 'High' ? 'warning' : 'default'}>
                      {formatSkillGapPriority(gap.priority)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{gap.evidence}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
