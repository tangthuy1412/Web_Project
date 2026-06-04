import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CheckCircle2, Code2, FolderGit2, Github, MessageSquare, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { dashboardApi } from '../../services/apis/dashboardApi'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import { useAuthStore } from '../../stores/authStore'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatRelativeTime, getScoreColor } from '../../lib/utils'

export const DashboardPage = () => {
  const user = useAuthStore(state => state.user)
  const { repositories, analyses, fetchRepositories, fetchMyAnalyses } = useRepositoryStore()
  const [dashboardPayload, setDashboardPayload] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardApi.me()
      .then((payload) => setDashboardPayload(payload as Record<string, unknown>))
      .catch((err) => setError(getApiErrorMessage(err)))

    fetchRepositories().catch(() => undefined)
    fetchMyAnalyses().catch(() => undefined)
  }, [fetchMyAnalyses, fetchRepositories])

  const stats = useMemo(() => {
    const payload = dashboardPayload ?? {}

    return {
      totalRepositories: Number(payload.totalRepositories ?? payload.repositoryCount ?? repositories.length),
      analyzedRepositories: Number(payload.analyzedRepositories ?? payload.analysisCount ?? analyses.length),
      githubConnected: Boolean(payload.githubConnected ?? user?.githubConnected),
      overallScore: Number(payload.overallScore ?? analyses[0]?.scores.overall ?? 0)
    }
  }, [analyses, dashboardPayload, repositories.length, user?.githubConnected])

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Chào mừng, {user?.name || 'bạn'}!
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Tổng quan GitHub, kết quả phân tích và các bước tiếp theo.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          Dashboard API chưa sẵn sàng hoặc chưa có payload: {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500">Repositories</p><p className="mt-2 text-3xl font-bold">{stats.totalRepositories}</p></div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950"><FolderGit2 className="h-6 w-6 text-indigo-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500">Đã phân tích</p><p className="mt-2 text-3xl font-bold">{stats.analyzedRepositories}</p></div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500">GitHub</p><div className="mt-2"><Badge variant={stats.githubConnected ? 'success' : 'default'}>{stats.githubConnected ? 'Đã kết nối' : 'Chưa kết nối'}</Badge></div></div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950"><Github className="h-6 w-6 text-cyan-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500">Điểm tổng quan</p><p className={`mt-2 text-3xl font-bold ${getScoreColor(stats.overallScore)}`}>{stats.overallScore || '-'}</p></div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950"><TrendingUp className="h-6 w-6 text-purple-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Phân tích gần đây</CardTitle>
                <CardDescription>Kết quả mới nhất của người dùng hiện tại.</CardDescription>
              </div>
              <Link to="/repositories"><Button variant="ghost" size="sm">Repositories <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                Chưa có phân tích. Hãy đồng bộ repositories và chạy Phân tích.
              </div>
            ) : (
              <div className="space-y-3">
                {analyses.slice(0, 4).map((analysis) => (
                  <Link key={analysis.id || analysis.repositoryId} to={`/repositories/${analysis.repositoryId}/analysis`} className="block rounded-lg border border-slate-200 p-4 transition-colors hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-700">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{analysis.repositoryName}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatRelativeTime(analysis.createdAt)}</p>
                      </div>
                      <p className={`text-2xl font-bold ${getScoreColor(analysis.scores.overall)}`}>{analysis.scores.overall}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Đi theo flow end-to-end của backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/github/connect"><Button variant="outline" className="w-full justify-start"><Github className="mr-2 h-4 w-4" />Kết nối GitHub</Button></Link>
            <Link to="/repositories"><Button variant="outline" className="w-full justify-start"><Code2 className="mr-2 h-4 w-4" />Đồng bộ / phân tích repository</Button></Link>
            <Link to="/chat"><Button variant="outline" className="w-full justify-start"><MessageSquare className="mr-2 h-4 w-4" />Hỏi AI Mentor</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
