import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CheckCircle2, Code2, FolderGit2, Github, MessageSquare, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { dashboardApi, getApiErrorMessage } from '../../services/apis/core'
import { useAuthStore } from '../../stores/authStore'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatRelativeTime, getScoreColor } from '../../lib/utils'
import type { DashboardResponse } from '../../types'

export const DashboardPage = () => {
  const user = useAuthStore(state => state.user)
  const { analyses, fetchRepositories, fetchMyAnalyses } = useRepositoryStore()
  const [dashboardPayload, setDashboardPayload] = useState<DashboardResponse | null>(null)
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardApi.me()
      .then(setDashboardPayload)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsDashboardLoading(false))

    fetchRepositories().catch(() => undefined)
    fetchMyAnalyses().catch(() => undefined)
  }, [fetchMyAnalyses, fetchRepositories])

  const stats = useMemo(() => {
    return {
      totalRepositories: dashboardPayload?.totalRepositories ?? 0,
      analyzedRepositories: dashboardPayload?.analyzedRepositories ?? 0,
      githubConnected: dashboardPayload?.githubConnected ?? Boolean(user?.githubConnected),
      overallScore: dashboardPayload?.dev2vecStatus === 'current' ? dashboardPayload.overallScore ?? dashboardPayload.currentSnapshot?.overallScore ?? 0 : 0
    }
  }, [dashboardPayload, user?.githubConnected])
  const analysisOverview = dashboardPayload?.dev2vecStatus === 'current' ? {
    summary: dashboardPayload.message || 'Trạng thái Dev2Vec hiện tại do backend xác nhận.',
    repositoriesCount: dashboardPayload.analyzedRepositories ?? 0,
    averageOverallScore: dashboardPayload.overallScore ?? dashboardPayload.currentSnapshot?.overallScore ?? 0,
    averageTestingScore: dashboardPayload.modelVersion || '—',
    averageDeploymentScore: dashboardPayload.pipelineVersion || '—',
    topCareerDirections: (dashboardPayload.topRoles ?? []).map((role) => ({ label: role.roleName, count: role.matchScore ? Math.round(role.matchScore * 100) : 1 })),
    topLanguages: [] as Array<{ label: string; count: number }>,
    topFrameworks: [] as Array<{ label: string; count: number }>,
    missingSkills: [] as Array<{ label: string; count: number }>
  } : null

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Chào mừng, {user?.name || 'bạn'}!
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Tổng quan GitHub, kết quả phân tích và các bước tiếp theo cho lộ trình phát triển của bạn.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          Chưa tải được dữ liệu dashboard: {error}
        </div>
      )}

      {!isDashboardLoading && dashboardPayload?.dev2vecStatus === 'analysis_required' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <p>{dashboardPayload.message || 'Cần phân tích repository bằng pipeline hiện tại để cập nhật dashboard.'}</p>
          <Link to="/repositories"><Button className="mt-3" size="sm">Phân tích repository</Button></Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Repository</p>
                <p className="mt-2 text-3xl font-bold">{stats.totalRepositories}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
                <FolderGit2 className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Đã phân tích</p>
                <p className="mt-2 text-3xl font-bold">{stats.analyzedRepositories}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">GitHub</p>
                <div className="mt-2">
                  <Badge variant={stats.githubConnected ? 'success' : 'default'}>
                    {stats.githubConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                  </Badge>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950">
                <Github className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Điểm tổng quan</p>
                <p className={`mt-2 text-3xl font-bold ${getScoreColor(stats.overallScore)}`}>{stats.overallScore || '-'}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nhận xét tổng quan từ các repository</CardTitle>
          <CardDescription>
            Dữ liệu được tổng hợp từ các repository đã phân tích của bạn, không chỉ từ một dự án riêng lẻ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysisOverview ? (
            <div className="space-y-5">
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
                {analysisOverview.summary}
              </p>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{analysisOverview.repositoriesCount}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">repo đã phân tích</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{analysisOverview.averageOverallScore}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">điểm trung bình</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{analysisOverview.averageTestingScore}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">model hiện tại</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{analysisOverview.averageDeploymentScore}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">pipeline hiện tại</p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Hướng nghề nghiệp nổi bật</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisOverview.topCareerDirections.length ? analysisOverview.topCareerDirections.map((item) => (
                      <Badge key={item.label} variant="success">{item.label} · {item.count}</Badge>
                    )) : <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Công nghệ nổi bật</p>
                  <div className="flex flex-wrap gap-2">
                    {[...analysisOverview.topLanguages, ...analysisOverview.topFrameworks].slice(0, 6).map((item) => (
                      <Badge key={`${item.label}-${item.count}`} variant="info">{item.label} · {item.count}</Badge>
                    ))}
                    {!analysisOverview.topLanguages.length && !analysisOverview.topFrameworks.length && <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Kỹ năng nên bổ sung</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisOverview.missingSkills.length ? analysisOverview.missingSkills.map((item) => (
                      <Badge key={item.label} variant="warning">{item.label}</Badge>
                    )) : <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
              Chưa có phân tích nào. Hãy đồng bộ repository và chạy phân tích để xem nhận xét tổng quan.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lịch sử phân tích</CardTitle>
                <CardDescription>Dữ liệu lịch sử để tham khảo; trạng thái hiện tại lấy từ dashboard backend.</CardDescription>
              </div>
              <Link to="/repositories">
                <Button variant="ghost" size="sm">Repository <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                Chưa có phân tích. Hãy đồng bộ repository và chạy phân tích.
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
            <CardDescription>Những bước chính để cập nhật dữ liệu và nhận tư vấn từ AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/github/connect">
              <Button variant="outline" className="w-full justify-start"><Github className="mr-2 h-4 w-4" />Kết nối GitHub</Button>
            </Link>
            <Link to="/repositories">
              <Button variant="outline" className="w-full justify-start"><Code2 className="mr-2 h-4 w-4" />Đồng bộ / phân tích repository</Button>
            </Link>
            <Link to="/roadmaps">
              <Button variant="outline" className="w-full justify-start"><TrendingUp className="mr-2 h-4 w-4" />Xem roadmap đề xuất</Button>
            </Link>
            <Link to="/chat">
              <Button variant="outline" className="w-full justify-start"><MessageSquare className="mr-2 h-4 w-4" />Hỏi AI Mentor</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
