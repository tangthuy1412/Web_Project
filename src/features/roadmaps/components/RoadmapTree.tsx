import { motion } from 'motion/react'
import { LearningNode } from './LearningNode'
import type { LearningNodeStatus, Roadmap } from '../types'

interface RoadmapTreeProps {
  roadmap: Roadmap
  onStatusChange?: (nodeId: string, status: LearningNodeStatus) => void | Promise<void>
  onBookmarkToggle?: (nodeId: string) => void
}

export const RoadmapTree = ({ roadmap, onStatusChange, onBookmarkToggle }: RoadmapTreeProps) => (
  <div className="space-y-6">
    {roadmap.modules.map((module, moduleIndex) => {
      const completed = module.nodes.filter((node) => node.status === 'completed').length
      const inProgress = module.nodes.filter((node) => node.status === 'in-progress').length
      const total = module.nodes.length
      const progress = total ? Math.round((completed / total) * 100) : 0

      return (
        <motion.section
          key={module.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: moduleIndex * 0.08 }}
          className="relative"
        >
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 font-semibold text-white">
                {module.order}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{module.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{module.description}</p>
                  </div>
                  <div className="shrink-0 text-sm text-slate-500 dark:text-slate-400">
                    {completed}/{total} bài học
                    {inProgress > 0 && <span className="ml-2 text-indigo-600 dark:text-indigo-300">{inProgress} đang học</span>}
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-800">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="ml-5 border-l border-dashed border-slate-300 pl-5 dark:border-slate-700">
            <div className="space-y-3">
              {module.nodes.map((node) => (
                <LearningNode
                  key={node.id}
                  node={node}
                  roadmapId={roadmap.id}
                  onStatusChange={onStatusChange}
                  onBookmarkToggle={onBookmarkToggle}
                />
              ))}
            </div>
          </div>
        </motion.section>
      )
    })}
  </div>
)
