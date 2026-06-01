import { Link } from 'react-router'
import { FolderGit2, CheckCircle2, Code2, TrendingUp, ArrowRight, Sparkles, Route, Target } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { mockDashboardStats, mockAnalysisResults } from '../../mock/data'
import { formatRelativeTime, getScoreColor } from '../../lib/utils'
import { ContinueLearningCard } from '../../../features/roadmaps/components/ContinueLearningCard'
import { WeeklyGoalWidget } from '../../../features/roadmaps/components/WeeklyGoalWidget'
import { useRoadmapStore } from '../../../features/roadmaps/stores/roadmapStore'

export const DashboardPage = () => {
  const stats = mockDashboardStats
  const { roadmaps, learningStats } = useRoadmapStore()
  const activeRoadmap = roadmaps.find((roadmap) => learningStats.activeRoadmapIds.includes(roadmap.id))

  const skillData = [
    { skill: 'Frontend', value: stats.skillOverview.frontend },
    { skill: 'Backend', value: stats.skillOverview.backend },
    { skill: 'DevOps', value: stats.skillOverview.devops },
    { skill: 'Testing', value: stats.skillOverview.testing }
  ]

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Chào mừng trở lại, Nguyễn Minh!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Đây là tổng quan phân tích repository GitHub của bạn
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Tổng repository
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {stats.totalRepositories}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <FolderGit2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Đã phân tích
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {stats.analyzedRepositories}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Trạng thái GitHub
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="success">Đã kết nối</Badge>
                </div>
              </div>
              <div className="h-12 w-12 rounded-lg bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center">
                <Code2 className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Điểm tổng quan
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  82/100
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Phân bố ngôn ngữ</CardTitle>
            <CardDescription>Ngôn ngữ lập trình trong repository của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="40%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.languageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {stats.languageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.languageDistribution.map((lang, index) => (
                  <div key={lang.language} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{lang.language}</span>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {lang.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tổng quan kỹ năng</CardTitle>
            <CardDescription>Đánh giá kỹ năng phát triển phần mềm của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={skillData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar
                  name="Kỹ năng"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_320px]">
        {activeRoadmap && <ContinueLearningCard roadmap={activeRoadmap} />}
        <WeeklyGoalWidget stats={learningStats} />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Mục tiêu hằng ngày</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{learningStats.dailyGoalMinutes} phút</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Chuỗi học {learningStats.currentStreak} ngày</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center">
                <Target className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
            <Link to="/roadmaps" className="mt-4 block">
              <Button variant="outline" className="w-full">
                <Route className="mr-2 h-4 w-4" />
                Mở lộ trình học
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Phân tích gần đây</CardTitle>
              <CardDescription>Kết quả phân tích repository mới nhất</CardDescription>
            </div>
            <Link to="/repositories">
              <Button variant="ghost" size="sm">
                Xem tất cả <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalysisResults.slice(0, 3).map((analysis) => (
              <Link
                key={analysis.id}
                to={`/analysis/${analysis.id}`}
                className="block p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {analysis.repositoryName}
                      </h3>
                      <Badge variant="info">{analysis.projectType}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {analysis.techStack.slice(0, 5).map((tech) => (
                        <Badge key={tech} variant="default">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Đã phân tích {formatRelativeTime(analysis.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(analysis.scores.overall)}`}>
                      {analysis.scores.overall}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Điểm tổng quan</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <Sparkles className="h-8 w-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">Định hướng nghề nghiệp bằng AI</h3>
            <p className="text-white/90 mb-4">
              Dựa trên phân tích hiện tại, bạn đang phù hợp với hướng Full-Stack Engineer.
              Hãy tập trung vào kỹ năng DevOps để tăng tốc phát triển.
            </p>
            <Link to="/chat">
              <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                Chat với AI Mentor
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Bắt đầu với các bước tiếp theo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/repositories">
              <Button variant="outline" className="w-full justify-start">
                <FolderGit2 className="mr-2 h-4 w-4" />
                Phân tích repository
              </Button>
            </Link>
            <Link to="/progress">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Xem báo cáo tiến độ
              </Button>
            </Link>
            <Link to="/github/connect">
              <Button variant="outline" className="w-full justify-start">
                <Code2 className="mr-2 h-4 w-4" />
                Quản lý kết nối GitHub
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
