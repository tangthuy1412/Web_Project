import { useParams, Link } from 'react-router'
import { ArrowLeft, Star, GitFork, Eye, ExternalLink, FileText, GitBranch, Users, Play } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatRelativeTime } from '../../lib/utils'

export const RepositoryDetailPage = () => {
  const { id } = useParams()
  const { repositories, analyzeRepository } = useRepositoryStore()
  const repository = repositories.find(r => r.id === id)

  if (!repository) {
    return (
      <div className="max-w-4xl">
        <p className="text-slate-500">Repository not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link to="/repositories" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Repositories
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {repository.name}
            </h1>
            {repository.description && (
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                {repository.description}
              </p>
            )}
          </div>
          {repository.analyzed && repository.analysisId ? (
            <Link to={`/analysis/${repository.analysisId}`}>
              <Button>
                <Eye className="mr-2 h-4 w-4" />
                View Analysis
              </Button>
            </Link>
          ) : (
            <Button onClick={() => analyzeRepository(repository.id)}>
              <Play className="mr-2 h-4 w-4" />
              Analyze Now
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Badge variant="info">{repository.language}</Badge>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Star className="h-4 w-4" />
          <span className="text-sm">{repository.stars} stars</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <GitFork className="h-4 w-4" />
          <span className="text-sm">{repository.forks} forks</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <span className="text-sm">Updated {formatRelativeTime(repository.updatedAt)}</span>
        </div>
        <a
          href={repository.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View on GitHub
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {repository.hasReadme ? 'Yes' : 'No'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">README</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">3</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Branches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">2</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Contributors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repository Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Full Name</span>
              <span className="font-medium">{repository.fullName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Visibility</span>
              <Badge variant={repository.private ? 'warning' : 'success'}>
                {repository.private ? 'Private' : 'Public'}
              </Badge>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Primary Language</span>
              <Badge variant="default">{repository.language}</Badge>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Analysis Status</span>
              <Badge variant={repository.analyzed ? 'success' : 'default'}>
                {repository.analyzed ? 'Analyzed' : 'Not Analyzed'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                AJ
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                  Pushed 3 commits to main
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                AJ
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                  Created branch feature/user-auth
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">1 day ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                AJ
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                  Updated README.md
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">3 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
