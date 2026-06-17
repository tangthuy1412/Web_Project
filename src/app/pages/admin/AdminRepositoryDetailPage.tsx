import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import {
  adminApi,
  type AdminRepository,
  type AdminRepositoryOwner
} from '../../services/apis/adminApi'

const formatDate = (value?: string) => {
  if (!value) return 'Chưa có'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

const repositoryOwner = (repository?: AdminRepository): AdminRepositoryOwner | null => {
  if (!repository?.userId || typeof repository.userId === 'string') return null
  return repository.userId
}

const ownerName = (repository?: AdminRepository) => {
  const owner = repositoryOwner(repository)
  return owner?.fullName || owner?.name || owner?.email || 'Người dùng'
}

const ownerEmail = (repository?: AdminRepository) => repositoryOwner(repository)?.email || 'Chưa có email'
const repositoryTitle = (repository?: AdminRepository) => repository?.fullName || repository?.name || 'Chi tiết repository'

const rawString = (repository: AdminRepository | null, key: string) => {
  const value = repository?.rawData?.[key]
  return typeof value === 'string' && value ? value : ''
}

const rawBoolean = (repository: AdminRepository | null, key: string) => {
  const value = repository?.rawData?.[key]
  return typeof value === 'boolean' ? value : undefined
}

export const AdminRepositoryDetailPage = () => {
  const { repositoryId } = useParams()
  const [repository, setRepository] = useState<AdminRepository | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const summaryCards = useMemo(() => [
    { label: 'Sao', value: repository?.stargazersCount ?? 0 },
    { label: 'Fork', value: repository?.forksCount ?? 0 },
    { label: 'Issue đang mở', value: repository?.openIssuesCount ?? 0 },
    { label: 'Dung lượng', value: `${repository?.size ?? 0} KB` }
  ], [repository])

  const fetchRepository = async () => {
    if (!repositoryId) {
      setError('Không tìm thấy mã repository.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const payload = await adminApi.getRepository(repositoryId)
      setRepository(payload)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRepository()
  }, [repositoryId])

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/admin/repositories" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách repository
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{repositoryTitle(repository ?? undefined)}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Xem dữ liệu GitHub đã đồng bộ, người sở hữu và các thông tin kỹ thuật quan trọng của repository.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchRepository} isLoading={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          {(repository?.htmlUrl || rawString(repository, 'html_url')) && (
            <a href={repository?.htmlUrl || rawString(repository, 'html_url')} target="_blank" rel="noreferrer">
              <Button>
                <ExternalLink className="mr-2 h-4 w-4" />
                Mở GitHub
              </Button>
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-10 text-center text-slate-500">Đang tải chi tiết repository...</CardContent>
        </Card>
      ) : !repository ? (
        <Card>
          <CardContent className="p-10 text-center text-slate-500">Không tìm thấy repository phù hợp.</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => (
              <Card key={item.label}>
                <CardContent className="p-5">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>Tổng quan repository</CardTitle>
                  <CardDescription>{repository.description || 'Repository này chưa có mô tả.'}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={repository.private ? 'warning' : 'success'}>{repository.private ? 'Riêng tư' : 'Công khai'}</Badge>
                  {repository.fork && <Badge variant="default">Fork</Badge>}
                  {rawBoolean(repository, 'archived') && <Badge variant="warning">Đã lưu trữ trên GitHub</Badge>}
                  {rawBoolean(repository, 'disabled') && <Badge variant="danger">Đã bị vô hiệu hóa</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">Người sở hữu</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{ownerName(repository)}</p>
                <p className="text-xs text-slate-500">{ownerEmail(repository)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Ngôn ngữ chính</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{repository.language || 'Chưa rõ'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Nhánh chính</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{repository.defaultBranch || 'Chưa rõ'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">GitHub Repo ID</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{repository.githubRepoId ?? 'Chưa có'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Ngày đồng bộ gần nhất</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{formatDate(repository.lastSyncedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Cập nhật trên GitHub</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{formatDate(repository.updatedAtGithub || repository.pushedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Ngày tạo bản ghi</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{formatDate(repository.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Ngày cập nhật bản ghi</p>
                <p className="font-medium text-slate-950 dark:text-slate-50">{formatDate(repository.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Liên kết</CardTitle>
                <CardDescription>Các đường dẫn hữu ích từ dữ liệu GitHub.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Trang GitHub</p>
                  <p className="break-all font-medium text-slate-950 dark:text-slate-50">{repository.htmlUrl || rawString(repository, 'html_url') || 'Chưa có'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Clone HTTPS</p>
                  <p className="break-all font-medium text-slate-950 dark:text-slate-50">{rawString(repository, 'clone_url') || 'Chưa có'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Homepage</p>
                  <p className="break-all font-medium text-slate-950 dark:text-slate-50">{rawString(repository, 'homepage') || 'Chưa có'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chủ đề</CardTitle>
                <CardDescription>Topics được đồng bộ từ GitHub nếu repository có khai báo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(repository.topics ?? []).map((topic) => (
                    <Badge key={topic} variant="info">{topic}</Badge>
                  ))}
                  {(repository.topics ?? []).length === 0 && (
                    <span className="text-sm text-slate-500">Repository này chưa có topic.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin kỹ thuật từ GitHub</CardTitle>
              <CardDescription>Các cờ trạng thái giúp admin hiểu nhanh repository đang bật tính năng gì.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[
                ['Issues', rawBoolean(repository, 'has_issues')],
                ['Projects', rawBoolean(repository, 'has_projects')],
                ['Wiki', rawBoolean(repository, 'has_wiki')],
                ['Pages', rawBoolean(repository, 'has_pages')],
                ['Discussions', rawBoolean(repository, 'has_discussions')],
                ['Cho phép fork', rawBoolean(repository, 'allow_forking')],
                ['Template', rawBoolean(repository, 'is_template')],
                ['Pull request', rawBoolean(repository, 'has_pull_requests')]
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  <Badge variant={value ? 'success' : 'default'}>{value ? 'Có' : 'Không'}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
