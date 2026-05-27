import { useEffect } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { BrainCircuit, Search, Sparkles, TrendingUp } from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import { Input } from '../../../app/components/ui/Input'
import { ContinueLearningCard } from '../components/ContinueLearningCard'
import { RoadmapCard } from '../components/RoadmapCard'
import { RoadmapSkeleton } from '../components/RoadmapSkeleton'
import { SkillRadarChart } from '../components/SkillRadarChart'
import { WeeklyGoalWidget } from '../components/WeeklyGoalWidget'
import { roadmapCategories } from '../mock/roadmapData'
import { useRoadmapStore } from '../stores/roadmapStore'
import type { RoadmapDifficulty } from '../types'
import { filterRoadmaps } from '../utils/roadmapUtils'

const difficulties: (RoadmapDifficulty | 'All')[] = ['All', 'Beginner', 'Intermediate', 'Advanced']
const durations = ['All', 'Short', 'Medium', 'Long'] as const

export const RoadmapsPage = () => {
  const { roadmaps, filters, isLoading, skillProgress, learningStats, fetchRoadmaps, setFilters } = useRoadmapStore()

  useEffect(() => {
    fetchRoadmaps()
  }, [fetchRoadmaps])

  const filteredRoadmaps = filterRoadmaps(roadmaps, filters)
  const featuredRoadmaps = filteredRoadmaps.filter((roadmap) => roadmap.isFeatured)
  const aiRoadmaps = filteredRoadmaps.filter((roadmap) => roadmap.isAIRecommended)
  const activeRoadmap = roadmaps.find((roadmap) => learningStats.activeRoadmapIds.includes(roadmap.id))
  const trendingSkills = ['GitHub Actions', 'PostgreSQL', 'Playwright', 'Docker', 'System Design', 'API Contracts']

  return (
    <div className="max-w-7xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="info">
              <Sparkles className="mr-1 h-3 w-3" />
              AI Learning Roadmap
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-slate-50">Roadmaps</h1>
          <p className="mt-1 max-w-2xl text-slate-500 dark:text-slate-400">
            Choose a learning path manually or generate one from your GitHub repository analysis.
          </p>
        </div>
        <Link to="/roadmaps/ai">
          <Button size="lg">
            <BrainCircuit className="mr-2 h-5 w-5" />
            Generate AI roadmap
          </Button>
        </Link>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_160px_170px_150px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    aria-label="Search roadmap"
                    placeholder="Search roadmap, skill, or stack"
                    className="pl-9"
                    value={filters.search}
                    onChange={(event) => setFilters({ search: event.target.value })}
                  />
                </div>
                <select
                  aria-label="Filter by category"
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={filters.category}
                  onChange={(event) => setFilters({ category: event.target.value as typeof filters.category })}
                >
                  {roadmapCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  aria-label="Filter by difficulty"
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={filters.difficulty}
                  onChange={(event) => setFilters({ difficulty: event.target.value as typeof filters.difficulty })}
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
                <select
                  aria-label="Filter by duration"
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={filters.duration}
                  onChange={(event) => setFilters({ duration: event.target.value as typeof filters.duration })}
                >
                  {durations.map((duration) => (
                    <option key={duration} value={duration}>{duration}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">Featured Roadmaps</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">High-signal paths for developer growth.</p>
              </div>
              <Badge variant="default">{featuredRoadmaps.length} paths</Badge>
            </div>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => <RoadmapSkeleton key={item} />)}
              </div>
            ) : featuredRoadmaps.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featuredRoadmaps.map((roadmap) => <RoadmapCard key={roadmap.id} roadmap={roadmap} />)}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="font-medium text-slate-900 dark:text-slate-100">No roadmaps match your filters</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try a broader category or clear the search.</p>
                </CardContent>
              </Card>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">AI Recommended Roadmaps</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Generated from missing skills, tech stack and project complexity.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {aiRoadmaps.map((roadmap) => <RoadmapCard key={roadmap.id} roadmap={roadmap} compact />)}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          {activeRoadmap && <ContinueLearningCard roadmap={activeRoadmap} />}
          <WeeklyGoalWidget stats={learningStats} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Trending Skills
              </CardTitle>
              <CardDescription>Skills rising across analyzed repositories</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {trendingSkills.map((skill) => <Badge key={skill} variant="default">{skill}</Badge>)}
            </CardContent>
          </Card>
          <SkillRadarChart skills={skillProgress} />
        </aside>
      </div>
    </div>
  )
}
