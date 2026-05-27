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
    title: 'Repository scoring',
    description: 'Review architecture, completeness, documentation, conventions, and commit quality in one place.',
    icon: BarChart3
  },
  {
    title: 'Career roadmap',
    description: 'Turn repository gaps into a practical skill plan for internships, junior roles, and portfolio reviews.',
    icon: TrendingUp
  },
  {
    title: 'AI mentor chat',
    description: 'Ask follow-up questions about a project and get concrete next steps for improving the codebase.',
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
              AI Developer Analytics
            </Badge>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 dark:text-white lg:text-5xl">
              GitAnalyzer AI
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Analyze GitHub repositories, understand your engineering strengths, and build a portfolio that is easier to evaluate.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/github/connect">
                <Button size="lg">
                  <Github className="mr-2 h-5 w-5" />
                  Connect GitHub
                </Button>
              </Link>
              <Link to="/repositories">
                <Button variant="outline" size="lg">
                  View repositories
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Latest analysis</p>
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Repositories</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{mockDashboardStats.totalRepositories}</p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Analyzed</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{mockDashboardStats.analyzedRepositories}</p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">GitHub status</p>
            <div className="mt-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <Badge variant="success">Connected</Badge>
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
              <h2 className="text-xl font-semibold">Ready to improve the next project?</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Start with a repository scan, then use the dashboard and AI chat to prioritize fixes.
            </p>
          </div>
          <Link to="/dashboard">
            <Button>
              Open dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
