import { Zap } from 'lucide-react'
import { Card, CardContent } from '../../../app/components/ui/Card'
import type { UserLearningStats } from '../types'

interface XPCardProps {
  stats: UserLearningStats
}

export const XPCard = ({ stats }: XPCardProps) => {
  const levelFloor = stats.level * 500
  const nextLevel = (stats.level + 1) * 500
  const progress = Math.round(((stats.totalXp - levelFloor) / (nextLevel - levelFloor)) * 100)

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 to-cyan-600 text-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/75">Learning level</p>
            <p className="mt-2 text-3xl font-bold">Level {stats.level}</p>
            <p className="mt-1 text-sm text-white/80">{stats.totalXp.toLocaleString()} XP earned</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
            <Zap className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-white/75">{Math.max(0, nextLevel - stats.totalXp)} XP to level {stats.level + 1}</p>
      </CardContent>
    </Card>
  )
}
