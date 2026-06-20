import { motion } from 'motion/react'
import { LearningNode } from './LearningNode'
import type { LearningNodeStatus, Roadmap } from '../types'

interface RoadmapTreeProps {
  roadmap: Roadmap
  onStatusChange?: (nodeId: string, status: LearningNodeStatus) => void
  onBookmarkToggle?: (nodeId: string) => void
}

export const RoadmapTree = ({ roadmap, onStatusChange, onBookmarkToggle }: RoadmapTreeProps) => (
  <div className="space-y-6">
    {roadmap.modules.map((module, moduleIndex) => (
      <motion.section
        key={module.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: moduleIndex * 0.08 }}
        className="relative"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 font-semibold text-white">
            {module.order}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{module.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{module.description}</p>
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
    ))}
  </div>
)
