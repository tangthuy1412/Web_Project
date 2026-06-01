import { Link } from 'react-router'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Github,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { mockAnalysisResults, mockDashboardStats } from '../../mock/data'
import { getScoreColor } from '../../lib/utils'

const features = [
  {
    title: 'Chấm điểm repository',
    description: 'Đánh giá kiến trúc, độ hoàn thiện, tài liệu, quy ước và chất lượng commit trong một nơi.',
    icon: BarChart3
  },
  {
    title: 'Roadmap nghề nghiệp',
    description: 'Biến khoảng trống trong repository thành kế hoạch kỹ năng thực tế cho thực tập, junior role và portfolio.',
    icon: TrendingUp
  },
  {
    title: 'Chat AI Mentor',
    description: 'Hỏi tiếp về dự án và nhận bước cải thiện cụ thể cho codebase.',
    icon: MessageSquare
  }
]

export const HomePage = () => {
  const bestAnalysis = mockAnalysisResults[0]

  return (
    <div className="max-w-7xl space-y-6">
      <section className="animate-rise overflow-hidden rounded-lg border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/70 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/95 dark:shadow-black/20">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div className="flex flex-col justify-center">
            <Badge variant="info" className="mb-4 w-fit">
              Phân tích developer bằng AI
            </Badge>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 dark:text-white lg:text-5xl">
              GitAnalyzer AI
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Phân tích repository GitHub, hiểu điểm mạnh kỹ thuật và xây dựng portfolio dễ đánh giá hơn.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/github/connect">
                <Button size="lg">
                  <Github className="mr-2 h-5 w-5" />
                  Kết nối GitHub
                </Button>
              </Link>
              <Link to="/repositories">
                <Button variant="outline" size="lg">
                  Xem repository
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Phân tích gần nhất</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {bestAnalysis.repositoryName}
                </h2>
              </div>
              <div className={`soft-pulse rounded-lg px-3 py-1 text-4xl font-bold ${getScoreColor(bestAnalysis.scores.overall)}`}>
                {bestAnalysis.scores.overall}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(bestAnalysis.scores).slice(0, 4).map(([label, score]) => (
                <div key={label} className="hover-lift rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{label.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{score}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {bestAnalysis.strengths.slice(0, 3).map((item) => (
                <div key={item} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="animate-rise-delay grid gap-4 md:grid-cols-3">
        <Card className="hover-lift">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Repository</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{mockDashboardStats.totalRepositories}</p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Đã phân tích</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{mockDashboardStats.analyzedRepositories}</p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Trạng thái GitHub</p>
            <div className="mt-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <Badge variant="success">Đã kết nối</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="hover-lift">
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <feature.icon className="h-5 w-5" />
              </div>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="hover-lift">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <h2 className="text-xl font-semibold">Sẵn sàng cải thiện dự án tiếp theo?</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Bắt đầu bằng phân tích repository, sau đó dùng dashboard và AI chat để ưu tiên việc cần sửa.
            </p>
          </div>
          <Link to="/dashboard">
            <Button>
              Mở bảng điều khiển
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
