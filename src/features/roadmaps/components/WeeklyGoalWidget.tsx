import { Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import type { UserLearningStats } from '../types'

interface WeeklyGoalWidgetProps {
  stats: UserLearningStats
}

export const WeeklyGoalWidget = ({ stats }: WeeklyGoalWidgetProps) => {
  const progress = Math.min(100, Math.round((stats.weeklyHoursCompleted / stats.weeklyGoalHours) * 100))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-cyan-500" />
          Weekly Goal
        </CardTitle>
        <CardDescription>Daily goal: {stats.dailyGoalMinutes} minutes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-slate-950 dark:text-slate-50">{stats.weeklyHoursCompleted}h</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">of {stats.weeklyGoalHours}h completed</p>
          </div>
          <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
            {progress}%
          </span>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-cyan-500" style={{ width: `${progress}%` }} />
        </div>
      </CardContent>
    </Card>
  )
}
