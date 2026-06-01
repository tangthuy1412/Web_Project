import { Award, Lock } from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import type { Roadmap } from '../types'

interface MilestoneTrackerProps {
  roadmap: Roadmap
}

export const MilestoneTracker = ({ roadmap }: MilestoneTrackerProps) => {
  const milestones = roadmap.modules.flatMap((module) => module.milestones)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theo dõi cột mốc</CardTitle>
        <CardDescription>Các checkpoint portfolio cho roadmap này</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${milestone.completed ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
              {milestone.completed ? <Award className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900 dark:text-slate-100">{milestone.title}</p>
                <Badge variant={milestone.completed ? 'success' : 'default'}>
                  {milestone.completed ? 'Đã mở khóa' : `Tuần ${milestone.targetWeek}`}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{milestone.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
