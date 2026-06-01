import { useState } from 'react'
import { motion } from 'motion/react'
import { Bookmark, CheckCircle2, ChevronDown, Circle, Clock, Lock, PlayCircle } from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { cn } from '../../../app/lib/utils'
import type { LearningNode as LearningNodeType, LearningNodeStatus } from '../types'
import { formatLearningStatus, formatRoadmapDifficulty, getDifficultyTone, getStatusTone } from '../utils/roadmapUtils'

interface LearningNodeProps {
  node: LearningNodeType
  onStatusChange?: (nodeId: string, status: LearningNodeStatus) => void
  onBookmarkToggle?: (nodeId: string) => void
}

const StatusIcon = ({ status }: { status: LearningNodeStatus }) => {
  if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  if (status === 'in-progress') return <PlayCircle className="h-5 w-5 text-indigo-500" />
  if (status === 'locked') return <Lock className="h-5 w-5 text-slate-400" />
  return <Circle className="h-5 w-5 text-cyan-500" />
}

export const LearningNode = ({ node, onStatusChange, onBookmarkToggle }: LearningNodeProps) => {
  const [expanded, setExpanded] = useState(node.status === 'in-progress')
  const isLocked = node.status === 'locked'

  return (
    <motion.div layout className={cn('relative rounded-lg border bg-white/80 p-4 dark:bg-slate-900/80', isLocked ? 'border-slate-200 opacity-70 dark:border-slate-800' : 'border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-700')}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <StatusIcon status={node.status} />
        </div>
        <button
          type="button"
          className="flex flex-1 items-start justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-slate-950 dark:text-slate-50">{node.title}</h4>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getStatusTone(node.status))}>
                {formatLearningStatus(node.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{node.description}</p>
          </div>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="ml-8 mt-4 space-y-4"
        >
          <div className="flex flex-wrap gap-2">
            <Badge variant={getDifficultyTone(node.difficulty)}>{formatRoadmapDifficulty(node.difficulty)}</Badge>
            <Badge variant="default">
              <Clock className="mr-1 h-3 w-3" />
              {node.estimatedHours}h
            </Badge>
            <Badge variant="info">{node.xp} XP</Badge>
            {node.skills.map((skill) => (
              <Badge key={skill} variant="default">{skill}</Badge>
            ))}
          </div>

          {node.dependencies.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Điều kiện tiên quyết: {node.dependencies.join(', ')}
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {node.resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                className="rounded-md border border-slate-200 p-3 text-sm hover:border-indigo-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:hover:border-indigo-700 dark:hover:bg-slate-800/60"
              >
                <div className="font-medium text-slate-900 dark:text-slate-100">{resource.title}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {resource.provider} - {resource.estimatedMinutes} phút - {resource.type}
                </div>
              </a>
            ))}
          </div>

          {node.project && (
            <div className="rounded-md bg-indigo-50 p-3 text-sm text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200">
              Mini project: {node.project}
            </div>
          )}

          {node.notes && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Ghi chú: {node.notes}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={isLocked}
              onClick={() => onStatusChange?.(node.id, node.status === 'completed' ? 'in-progress' : 'completed')}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {node.status === 'completed' ? 'Mở lại' : 'Đánh dấu hoàn thành'}
            </Button>
            <Button size="sm" variant="outline" disabled={isLocked}>
              Tiếp tục
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isLocked}
              onClick={() => onBookmarkToggle?.(node.id)}
              aria-label={node.bookmarked ? 'Bỏ lưu bài học' : 'Lưu bài học'}
            >
              <Bookmark className={cn('mr-2 h-4 w-4', node.bookmarked && 'fill-indigo-500 text-indigo-500')} />
              Lưu
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
