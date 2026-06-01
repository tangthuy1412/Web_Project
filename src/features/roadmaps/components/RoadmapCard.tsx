import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Clock, Star, Users } from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent } from '../../../app/components/ui/Card'
import { cn } from '../../../app/lib/utils'
import type { Roadmap } from '../types'
import { formatRoadmapDifficulty, getDifficultyTone } from '../utils/roadmapUtils'

interface RoadmapCardProps {
  roadmap: Roadmap
  compact?: boolean
}

export const RoadmapCard = ({ roadmap, compact = false }: RoadmapCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    transition={{ duration: 0.22 }}
  >
    <Card className="group h-full overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-500/10">
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />
      <CardContent className={cn('p-5', compact && 'p-4')}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{roadmap.category}</Badge>
              <Badge variant={getDifficultyTone(roadmap.difficulty)}>{formatRoadmapDifficulty(roadmap.difficulty)}</Badge>
              {roadmap.isAIRecommended && <Badge variant="success">AI phù hợp</Badge>}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{roadmap.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{roadmap.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {roadmap.tags.slice(0, compact ? 3 : 5).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all"
            style={{ width: `${roadmap.progress}%` }}
          />
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {roadmap.estimatedWeeks} tuần
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {roadmap.learners.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {roadmap.rating}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hoàn thành</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{roadmap.progress}%</p>
          </div>
          <Link to={`/roadmaps/${roadmap.slug}`}>
            <Button size="sm" variant="outline" aria-label={`Mở ${roadmap.title}`}>
              Mở
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)
