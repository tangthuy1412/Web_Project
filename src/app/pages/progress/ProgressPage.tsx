import { useEffect, useMemo } from 'react'
import { Award, BookOpen, Target, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { ProgressOverview } from '../../../features/roadmaps/components/ProgressOverview'
import { SkillRadarChart } from '../../../features/roadmaps/components/SkillRadarChart'
import { XPCard } from '../../../features/roadmaps/components/XPCard'
import { useRoadmapStore } from '../../../features/roadmaps/stores/roadmapStore'

export const ProgressPage = () => {
  const { fetchRoadmaps, learningStats, skillProgress, roadmaps, isLoading } = useRoadmapStore()

  useEffect(() => {
    fetchRoadmaps({ status: 'active' }).catch(() => undefined)
  }, [fetchRoadmaps])

  const completedRate = learningStats.totalNodes
    ? Math.round((learningStats.completedNodes / learningStats.totalNodes) * 100)
    : 0

  const skillChartData = useMemo(() => {
    return skillProgress.map((skill) => ({
      skill: skill.skill,
      current: skill.current,
      target: skill.target
    }))
  }, [skillProgress])

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Tiến độ học tập
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Theo dõi tiến độ từ các roadmap thật đang lưu trong tài khoản của bạn.
        </p>
      </div>

      <ProgressOverview stats={learningStats} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Roadmap đang học</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{roadmaps.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nhiệm vụ hoàn thành</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {learningStats.completedNodes}/{learningStats.totalNodes}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
                <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Tỷ lệ hoàn thành {completedRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nhóm kỹ năng</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{skillProgress.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">XP hiện tại</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{learningStats.totalXp}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950">
                <BookOpen className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <XPCard stats={learningStats} />
        <SkillRadarChart skills={skillProgress} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mức độ kỹ năng hiện tại</CardTitle>
          <CardDescription>Dữ liệu được suy ra từ các roadmap thật đang tải từ backend.</CardDescription>
        </CardHeader>
        <CardContent>
          {skillChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={skillChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="current" name="Hiện tại" fill="#6366f1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" name="Mục tiêu" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
              {isLoading
                ? 'Đang tải dữ liệu tiến độ...'
                : 'Chưa có dữ liệu tiến độ. Hãy tạo hoặc mở một roadmap từ API backend để bắt đầu theo dõi.'}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cột mốc gần đây</CardTitle>
          <CardDescription>Các trạng thái được tính từ nhiệm vụ trong roadmap hiện tại.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-100">Tiến độ nhiệm vụ</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Bạn đã hoàn thành {learningStats.completedNodes} trên {learningStats.totalNodes} nhiệm vụ.
                </p>
                <Badge variant={completedRate > 0 ? 'success' : 'default'} className="mt-2">
                  {completedRate}% hoàn thành
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
