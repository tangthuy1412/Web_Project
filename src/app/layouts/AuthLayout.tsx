import { Outlet } from 'react-router'
import { BarChart3, Github, MessageSquare, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'

const highlights = [
  {
    title: 'AI-powered analysis',
    description: 'Score architecture, documentation, conventions, commits, and portfolio readiness.',
    icon: Sparkles
  },
  {
    title: 'Career guidance',
    description: 'Convert repository gaps into a focused skill roadmap for your next role.',
    icon: TrendingUp
  },
  {
    title: 'Secure GitHub flow',
    description: 'Connect repositories for analysis while keeping project ownership clear.',
    icon: ShieldCheck
  }
]

export const AuthLayout = () => {
  return (
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_24rem),linear-gradient(135deg,#f8fafc,#eef2ff)] dark:bg-[linear-gradient(135deg,#020617,#0f172a)] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="hidden overflow-hidden bg-[linear-gradient(135deg,#020617,#111827_55%,#172554)] text-white shadow-2xl shadow-slate-950/30 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="animate-rise max-w-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500">
              <Github className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">GitAnalyzer AI</h1>
              <p className="text-sm text-slate-400">Developer analytics dashboard</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-cyan-300">Portfolio intelligence</p>
            <h2 className="mt-3 max-w-lg text-4xl font-bold leading-tight">
              Understand your repositories before recruiters do.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Review technical quality, missing skills, and concrete improvements with the same visual system used across the app.
            </p>
          </div>

          <div className="grid gap-3">
            {highlights.map((item) => (
              <div key={item.title} className="hover-lift flex gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-rise-delay grid grid-cols-3 gap-3">
          <div className="hover-lift rounded-lg border border-white/10 bg-white/5 p-4">
            <BarChart3 className="mb-3 h-5 w-5 text-cyan-300" />
            <p className="text-2xl font-bold">82</p>
            <p className="text-xs text-slate-400">Sample score</p>
          </div>
          <div className="hover-lift rounded-lg border border-white/10 bg-white/5 p-4">
            <Github className="mb-3 h-5 w-5 text-cyan-300" />
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-slate-400">Repositories</p>
          </div>
          <div className="hover-lift rounded-lg border border-white/10 bg-white/5 p-4">
            <MessageSquare className="mb-3 h-5 w-5 text-cyan-300" />
            <p className="text-2xl font-bold">AI</p>
            <p className="text-xs text-slate-400">Mentor chat</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="animate-rise w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
