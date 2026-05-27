import { CheckCircle2, CircleDot } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import type { Roadmap } from '../types'

interface LearningTimelineProps {
  roadmap: Roadmap
}

export const LearningTimeline = ({ roadmap }: LearningTimelineProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Learning Timeline</CardTitle>
      <CardDescription>Milestones synced to roadmap progress</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {roadmap.modules.flatMap((module) => module.milestones).map((milestone) => (
          <div key={milestone.id} className="flex gap-3">
            <div className="mt-1">
              {milestone.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <CircleDot className="h-5 w-5 text-indigo-500" />
              )}
            </div>
            <div className="flex-1 border-b border-slate-200 pb-4 last:border-0 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">{milestone.title}</h4>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Week {milestone.targetWeek} · {milestone.rewardXp} XP
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{milestone.description}</p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)
