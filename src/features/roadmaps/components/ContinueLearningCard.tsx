import { Link } from 'react-router'
import { ArrowRight, BookOpenCheck } from 'lucide-react'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent } from '../../../app/components/ui/Card'
import type { Roadmap } from '../types'
import { getNextLearningNode, getRoadmapHoursRemaining } from '../utils/roadmapUtils'

interface ContinueLearningCardProps {
  roadmap: Roadmap
}

export const ContinueLearningCard = ({ roadmap }: ContinueLearningCardProps) => {
  const nextNode = getNextLearningNode(roadmap)

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">Continue learning</p>
            <h3 className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{roadmap.title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Next: {nextNode?.title ?? 'Review completed roadmap'} · {getRoadmapHoursRemaining(roadmap)}h remaining
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${roadmap.progress}%` }} />
            </div>
          </div>
        </div>
        <Link to={`/roadmaps/${roadmap.slug}`} className="mt-4 block">
          <Button variant="outline" className="w-full">
            Resume
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
