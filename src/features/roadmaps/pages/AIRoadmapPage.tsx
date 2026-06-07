import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, BrainCircuit, Clock, GitBranch, Route, Sparkles } from 'lucide-react'
import { AIRecommendationPanel } from '../components/AIRecommendationPanel'
import { LearningTimeline } from '../components/LearningTimeline'
import { RoadmapTree } from '../components/RoadmapTree'
import { SkillGapChart } from '../components/SkillGapChart'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import { useRepositoryStore } from '../../../app/stores/repositoryStore'
import { roadmapTargetRoles } from '../constants/roadmapTargetRoles'
import { useRoadmapStore } from '../stores/roadmapStore'
import { recommendJobReadinessRoadmaps, recommendRoadmapRole, type RoadmapRoleRecommendation } from '../utils/roadmapRecommendation'
import { formatRoadmapDifficulty, formatSkillGapPriority } from '../utils/roadmapUtils'

export const AIRoadmapPage = () => {
  const { aiRecommendation, isGenerating, error, generateAIRoadmap, updateNodeStatus, toggleBookmark } = useRoadmapStore()
  const { analyses, fetchMyAnalyses } = useRepositoryStore()
  const [targetRole, setTargetRole] = useState(aiRecommendation?.roadmap.careerOutcome ?? 'Backend Developer')
  const recommendedRoadmap = recommendRoadmapRole(analyses)
  const jobReadinessRoadmaps = recommendJobReadinessRoadmaps(analyses)

  useEffect(() => {
    fetchMyAnalyses()
  }, [fetchMyAnalyses])

  const handleGenerate = async (forceRegenerate = false) => {
    await generateAIRoadmap(targetRole, forceRegenerate)
  }

  const handleUseRecommendation = async () => {
    if (!recommendedRoadmap) return
    setTargetRole(recommendedRoadmap.role)
    await generateAIRoadmap(recommendedRoadmap.role, false)
  }

  const handleUseJobSuggestion = async (suggestion: RoadmapRoleRecommendation) => {
    setTargetRole(suggestion.role)
    await generateAIRoadmap(suggestion.role, false)
  }

  if (!aiRecommendation) {
    return (
      <div className="max-w-4xl space-y-6">
        <Link to="/roadmaps">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại roadmap
          </Button>
        </Link>

        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-indigo-500" />
              Tạo roadmap bằng AI
            </CardTitle>
            <CardDescription>
              Chọn vai trò mục tiêu để tạo lộ trình học cá nhân hóa từ phân tích GitHub hiện có.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedRoadmap && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
                <p className="font-medium text-indigo-950 dark:text-indigo-100">AI đề xuất: {recommendedRoadmap.role}</p>
                <p className="mt-1 text-sm text-indigo-800 dark:text-indigo-300">{recommendedRoadmap.reason}</p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <select
                aria-label="Vai trò mục tiêu"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                {roadmapTargetRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <Button isLoading={isGenerating} onClick={() => handleGenerate(false)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Tạo roadmap
              </Button>
            </div>
            <Button variant="outline" isLoading={isGenerating} disabled={!recommendedRoadmap} onClick={handleUseRecommendation}>
              Dùng đề xuất AI
            </Button>
            {jobReadinessRoadmaps.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {jobReadinessRoadmaps.map((suggestion) => (
                  <div key={suggestion.role} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                    <Badge variant="warning">Phụ trợ xin việc</Badge>
                    <p className="mt-2 font-semibold text-slate-950 dark:text-slate-50">{suggestion.title}</p>
                    <p className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-300">{suggestion.role}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{suggestion.reason}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Trọng tâm: {suggestion.focus}</p>
                    <Button className="mt-3" size="sm" variant="outline" isLoading={isGenerating} onClick={() => handleUseJobSuggestion(suggestion)}>
                      Tạo lộ trình này
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </p>
            )}
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

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto]">
          <select
            aria-label="Vai trò mục tiêu"
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {roadmapTargetRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <Button variant="outline" isLoading={isGenerating} onClick={() => handleGenerate(false)}>
            Mở roadmap hiện có
          </Button>
          <Button isLoading={isGenerating} onClick={() => handleGenerate(true)}>
            Tạo lại roadmap
          </Button>
          <Button variant="outline" isLoading={isGenerating} disabled={!recommendedRoadmap} onClick={handleUseRecommendation}>
            Dùng đề xuất AI
          </Button>
        </CardContent>
      </Card>

      {jobReadinessRoadmaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Đề xuất phụ để tăng khả năng xin việc</CardTitle>
            <CardDescription>Các lộ trình phụ tập trung vào tín hiệu portfolio, triển khai, kiểm thử và chất lượng code.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {jobReadinessRoadmaps.map((suggestion) => (
              <div key={suggestion.role} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <Badge variant="warning">Phụ trợ xin việc</Badge>
                <p className="mt-2 font-semibold text-slate-950 dark:text-slate-50">{suggestion.title}</p>
                <p className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-300">{suggestion.role}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{suggestion.reason}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Trọng tâm: {suggestion.focus}</p>
                <Button className="mt-3" size="sm" variant="outline" isLoading={isGenerating} onClick={() => handleUseJobSuggestion(suggestion)}>
                  Tạo lộ trình này
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-600 via-slate-900 to-cyan-700 p-6 text-white shadow-xl shadow-indigo-500/15 dark:border-indigo-900"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{roadmap.category}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{formatRoadmapDifficulty(roadmap.difficulty)}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{roadmap.careerOutcome}</span>
            </div>
            <h1 className="text-3xl font-bold">{roadmap.title}</h1>
            <p className="mt-2 max-w-3xl text-white/80">{roadmap.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white/10 p-4">
              <Clock className="mb-2 h-5 w-5 text-cyan-200" />
              <p className="text-2xl font-bold">{aiRecommendation.estimatedCompletionWeeks}</p>
              <p className="text-xs text-white/70">Tuần dự kiến</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <Route className="mb-2 h-5 w-5 text-emerald-200" />
              <p className="text-2xl font-bold">{roadmap.progress}%</p>
              <p className="text-xs text-white/70">Tiến độ</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <GitBranch className="mb-2 h-5 w-5 text-indigo-200" />
              <p className="text-2xl font-bold">{roadmap.sourceRepositoriesCount ?? 0}</p>
              <p className="text-xs text-white/70">Repository</p>
            </div>
          </div>
        </div>
      </motion.div>

      <AIRecommendationPanel
        recommendation={aiRecommendation}
        isGenerating={isGenerating}
        onRegenerate={() => handleGenerate(true)}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lộ trình học đề xuất</CardTitle>
              <CardDescription>Các giai đoạn và nhiệm vụ được cá nhân hóa theo dữ liệu phân tích của bạn.</CardDescription>
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
              <CardTitle>Kỹ năng cần bổ sung</CardTitle>
              <CardDescription>Những kỹ năng nên ưu tiên để tiến gần hơn tới vai trò mục tiêu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiRecommendation.skillGaps.length > 0 ? aiRecommendation.skillGaps.map((gap) => (
                <div key={gap.skill} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{gap.skill}</p>
                    <Badge variant={gap.priority === 'Critical' ? 'danger' : gap.priority === 'High' ? 'warning' : 'default'}>
                      {formatSkillGapPriority(gap.priority)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{gap.evidence}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có kỹ năng thiếu rõ ràng trong roadmap hiện tại.</p>
              )}
            </CardContent>
          </Card>
          {roadmap.supportingPaths && roadmap.supportingPaths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hướng bổ trợ</CardTitle>
                <CardDescription>Các lựa chọn mở rộng nếu bạn muốn tăng độ sẵn sàng cho portfolio hoặc ứng tuyển.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {roadmap.supportingPaths.map((path) => (
                  <div key={path.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{path.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{path.reason}</p>
                    {path.suggestedTasks.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        {path.suggestedTasks.slice(0, 3).map((task) => (
                          <li key={task}>• {task}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
