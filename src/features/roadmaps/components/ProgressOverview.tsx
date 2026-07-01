import { Award, BookOpenCheck, Flame, Target } from 'lucide-react'
import { Card, CardContent } from '../../../app/components/ui/Card'
import type { UserLearningStats } from '../types'

interface ProgressOverviewProps {
  stats: UserLearningStats
}

export const ProgressOverview = ({ stats }: ProgressOverviewProps) => {
  const completion = stats.totalNodes ? Math.round((stats.completedNodes / stats.totalNodes) * 100) : 0
  const items = [
    { label: 'Hoàn thành lộ trình', value: `${completion}%`, detail: `${stats.completedNodes}/${stats.totalNodes} nhiệm vụ`, icon: BookOpenCheck, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' },
    { label: 'Chuỗi học tập', value: `${stats.currentStreak} ngày`, detail: `Kỷ lục ${stats.longestStreak} ngày`, icon: Flame, color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
    { label: 'Mục tiêu tuần', value: `${stats.weeklyHoursCompleted}/${stats.weeklyGoalHours} giờ`, detail: 'Đang hoạt động tuần này', icon: Target, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400' },
    { label: 'Thành tựu', value: String(stats.achievements.filter((item) => item.unlockedAt).length), detail: `${stats.achievements.length} mục đang theo dõi`, icon: Award, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
