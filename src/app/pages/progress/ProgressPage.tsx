import { TrendingUp, Award, Target, BookOpen } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { mockProgressData, mockDashboardStats } from '../../mock/data'
import { ProgressOverview } from '../../../features/roadmaps/components/ProgressOverview'
import { SkillRadarChart } from '../../../features/roadmaps/components/SkillRadarChart'
import { XPCard } from '../../../features/roadmaps/components/XPCard'
import { useRoadmapStore } from '../../../features/roadmaps/stores/roadmapStore'

export const ProgressPage = () => {
  const { learningStats, skillProgress } = useRoadmapStore()
  const skillTrends = [
    { month: 'Jan', Frontend: 75, Backend: 68, DevOps: 35, Testing: 55 },
    { month: 'Feb', Frontend: 78, Backend: 70, DevOps: 38, Testing: 58 },
    { month: 'Mar', Frontend: 80, Backend: 73, DevOps: 40, Testing: 60 },
    { month: 'Apr', Frontend: 83, Backend: 76, DevOps: 43, Testing: 63 },
    { month: 'May', Frontend: 85, Backend: 78, DevOps: 45, Testing: 65 }
  ]

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Progress & Insights
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Track your development journey over time
        </p>
      </div>

      <ProgressOverview stats={learningStats} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Overall Growth
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  +27%
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Since last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Completed Goals
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  12/15
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              80% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Skills Improved
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  8
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              This quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Learning Hours
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  124
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <XPCard stats={learningStats} />
        <SkillRadarChart skills={skillProgress} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Score Trend</CardTitle>
          <CardDescription>Your improvement over the last 5 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockProgressData}>
              <defs>
                <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="scores.overall"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorOverall)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skill Development Trends</CardTitle>
          <CardDescription>Track your progress across different skill areas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={skillTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Frontend" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="Backend" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="DevOps" stroke="#ec4899" strokeWidth={2} />
              <Line type="monotone" dataKey="Testing" stroke="#14b8a6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Skill Levels</CardTitle>
            <CardDescription>Your proficiency across different areas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[mockDashboardStats.skillOverview].map(s => [
                { skill: 'Frontend', score: s.frontend },
                { skill: 'Backend', score: s.backend },
                { skill: 'DevOps', score: s.devops },
                { skill: 'Testing', score: s.testing }
              ])[0]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Milestones</CardTitle>
            <CardDescription>Your latest achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    Frontend Mastery
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Reached 85% proficiency in Frontend Development
                  </p>
                  <Badge variant="success" className="mt-2">Achieved</Badge>
                </div>
              </div>

              <div className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                  <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    First Project Analysis
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Completed your first repository analysis
                  </p>
                  <Badge variant="success" className="mt-2">Achieved</Badge>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    Consistent Improvement
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Improved scores for 3 consecutive months
                  </p>
                  <Badge variant="success" className="mt-2">Achieved</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
