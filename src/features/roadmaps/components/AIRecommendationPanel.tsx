import { Link } from 'react-router'
import { BrainCircuit, GitBranch, Sparkles } from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import type { AIRecommendation } from '../types'

interface AIRecommendationPanelProps {
  recommendation: AIRecommendation
  isGenerating?: boolean
  onRegenerate?: () => void
}

export const AIRecommendationPanel = ({ recommendation, isGenerating, onRegenerate }: AIRecommendationPanelProps) => (
  <Card className="overflow-hidden">
    <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-indigo-500" />
            AI Learning Recommendation
          </CardTitle>
          <CardDescription className="mt-2 max-w-3xl">{recommendation.summary}</CardDescription>
        </div>
        <Badge variant="success">{recommendation.confidence}% confidence</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Source repositories</p>
          <div className="mt-3 space-y-2">
            {recommendation.sourceRepositories.map((repo) => (
              <div key={repo} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <GitBranch className="h-4 w-4 text-slate-400" />
                {repo}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">Strengths</p>
          <ul className="mt-3 space-y-2 text-sm text-emerald-800 dark:text-emerald-300">
            {recommendation.strengths.slice(0, 3).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Weaknesses</p>
          <ul className="mt-3 space-y-2 text-sm text-amber-800 dark:text-amber-300">
            {recommendation.weaknesses.slice(0, 3).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/70">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-indigo-500" />
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{recommendation.careerSuggestion}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{recommendation.commitPatternInsight}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to={`/roadmaps/${recommendation.roadmap.slug}`}>
          <Button>Open recommended roadmap</Button>
        </Link>
        <Button variant="outline" isLoading={isGenerating} onClick={onRegenerate}>
          Regenerate from GitHub
        </Button>
      </div>
    </CardContent>
  </Card>
)
