import { Link } from 'react-router'
import { motion } from 'motion/react'
import {
  ArrowRight,
  Clock,
  GitBranch,
  GitCommitHorizontal,
  ListChecks,
  Target,
  UserRound
} from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent } from '../../../app/components/ui/Card'
import { cn } from '../../../app/lib/utils'
import type { Roadmap } from '../types'
import { formatRoadmapDifficulty, formatUserLevel, getDifficultyTone, getRoadmapSourceRepositoryCount } from '../utils/roadmapUtils'

interface RoadmapCardProps {
  roadmap: Roadmap
  compact?: boolean
}

export const RoadmapCard = ({ roadmap, compact = false }: RoadmapCardProps) => {
  const nodes = roadmap.modules.flatMap((module) => module.nodes)
  const totalNodes = roadmap.progressSummary?.totalItems ?? nodes.length
  const completedNodes = roadmap.progressSummary?.completedItems ?? nodes.filter((node) => node.status === 'completed').length
  const isArchived = roadmap.status === 'archived'
  const source = roadmap.roadmapSource && typeof roadmap.roadmapSource === 'object' ? roadmap.roadmapSource : undefined
  const sourceRepositories = source?.repositories ?? []
  const sourceRepositoryCount = getRoadmapSourceRepositoryCount(roadmap)
  const userCommits = source?.totalUserCommits ?? source?.userCommits ?? sourceRepositories.reduce((sum, repo) => sum + (repo.userCommits ?? 0), 0)
  const activeDays = source?.activeDays ?? sourceRepositories.reduce((sum, repo) => sum + (repo.activeDays ?? 0), 0)
  const effectiveLevel = (roadmap.effectiveLevel ?? source?.userLevel) ? formatUserLevel(roadmap.effectiveLevel ?? source?.userLevel) : undefined
  const roleMatchScore = roadmap.roleMatch?.matchScore
  const roleMatchLabel = roadmap.roleMatch?.matchLevelLabel
  const prioritySkills = [
    ...(roadmap.skillGapSummary?.prioritySkills ?? []),
    ...(roadmap.skillGapSummary?.recommendedNextSkills ?? [])
  ].filter((skill, index, list) => skill && list.indexOf(skill) === index)
  const sourceLabel = sourceRepositoryCount > 1
    ? `${sourceRepositoryCount} dự án`
    : source?.fullName ?? source?.repoName ?? sourceRepositories[0]?.fullName ?? sourceRepositories[0]?.repoName ?? `${sourceRepositoryCount || 0} dự án`
  const progress = Math.max(0, Math.min(100, Math.round(roadmap.progressSummary?.overallProgress ?? roadmap.progress)))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22 }}
    >
      <Card className={cn(
        'group h-full overflow-hidden hover:shadow-xl',
        isArchived
          ? 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:shadow-slate-500/10 dark:border-slate-800 dark:bg-slate-950/40'
          : 'hover:border-indigo-300 hover:shadow-indigo-500/10 dark:hover:border-indigo-700'
      )}>
        <div className={cn('h-1.5 bg-gradient-to-r', isArchived ? 'from-slate-400 via-slate-500 to-slate-600' : 'from-indigo-500 via-cyan-500 to-emerald-500')} />
        <CardContent className={cn('p-5', compact && 'p-4')}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{roadmap.category}</Badge>
                <Badge variant={getDifficultyTone(roadmap.difficulty)}>{formatRoadmapDifficulty(roadmap.difficulty)}</Badge>
                <Badge variant={isArchived ? 'default' : 'success'}>
                  {isArchived ? 'Đã lưu trữ' : 'Đang học'}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{roadmap.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{roadmap.subtitle}</p>
              </div>
            </div>
          </div>

          {isArchived && (
            <p className="mb-4 rounded-lg bg-white px-3 py-2 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              Lộ trình này đã được cất khỏi kế hoạch học chính. Bạn vẫn có thể mở lại để xem nội dung.
            </p>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            {roadmap.tags.slice(0, compact ? 3 : 5).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cn('h-full rounded-full transition-all', isArchived ? 'bg-slate-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-500')}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {roadmap.estimatedWeeks} tuần
            </div>
            <div className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              {completedNodes}/{totalNodes} nhiệm vụ
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{sourceLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GitCommitHorizontal className="h-3.5 w-3.5" />
              {userCommits} đóng góp của bạn
            </div>
          </div>

          {effectiveLevel && (
            <div className="mb-4 text-xs">
              {effectiveLevel && (
                <div className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-2 dark:border-indigo-900 dark:bg-indigo-950/30">
                  <span className="text-slate-500 dark:text-slate-400">Trình độ</span>
                  <span className="ml-1 font-semibold text-indigo-700 dark:text-indigo-300">{effectiveLevel}</span>
                </div>
              )}
            </div>
          )}

          {(typeof roleMatchScore === 'number' || activeDays > 0 || prioritySkills.length > 0) && (
            <div className="mb-5 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/60">
              <div className="grid gap-2 sm:grid-cols-2">
                {typeof roleMatchScore === 'number' && (
                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{Math.round(roleMatchScore)}% phù hợp{roleMatchLabel ? ` · ${roleMatchLabel}` : ''}</span>
                  </div>
                )}
                {activeDays > 0 && (
                  <div className="flex items-center gap-2">
                    <UserRound className="h-3.5 w-3.5 text-cyan-500" />
                    <span>{activeDays} ngày hoạt động</span>
                  </div>
                )}
              </div>
              {prioritySkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {prioritySkills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="warning">{skill}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{isArchived ? 'Tiến độ đã lưu' : 'Hoàn thành'}</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{progress}%</p>
            </div>
            <Link to={`/roadmaps/${roadmap.slug}`}>
              <Button size="sm" variant="outline" aria-label={`Mở ${roadmap.title}`}>
                {isArchived ? 'Xem lại' : 'Tiếp tục'}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
