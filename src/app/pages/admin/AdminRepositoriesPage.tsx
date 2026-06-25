import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Eye, ExternalLink, RefreshCw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { getApiErrorMessage } from '../../services/apis/core'
import {
  adminApi,
  type AdminPagination,
  type AdminRepository,
  type AdminRepositoryOwner
} from '../../services/apis/admin'

const defaultPagination: AdminPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
}

const formatDate = (value?: string) => {
  if (!value) return 'Chưa có'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

const repositoryId = (repository: AdminRepository) => repository._id || repository.id || ''
const repositoryOwner = (repository: AdminRepository): AdminRepositoryOwner | null => {
  if (!repository.userId || typeof repository.userId === 'string') return null
  return repository.userId
}

const ownerName = (repository: AdminRepository) => {
  const owner = repositoryOwner(repository)
  return owner?.fullName || owner?.name || owner?.email || 'Người dùng'
}

const ownerEmail = (repository: AdminRepository) => repositoryOwner(repository)?.email || 'Chưa có email'
const containsText = (value: string | undefined | null, search: string) => value?.toLowerCase().includes(search) ?? false

export const AdminRepositoriesPage = () => {
  const navigate = useNavigate()
  const [repositories, setRepositories] = useState<AdminRepository[]>([])
  const [pagination, setPagination] = useState(defaultPagination)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredRepositories = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return repositories

    return repositories.filter((repository) => (
      containsText(repository.name, keyword) ||
      containsText(repository.fullName, keyword) ||
      containsText(repository.language, keyword) ||
      containsText(ownerName(repository), keyword) ||
      containsText(ownerEmail(repository), keyword)
    ))
  }, [repositories, search])

  const fetchRepositories = async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await adminApi.getRepositories({
        page,
        limit: defaultPagination.limit
      })
      setRepositories(payload.items ?? [])
      setPagination(payload.pagination ?? defaultPagination)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRepositories()
  }, [page])

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Quản lý repository</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Xem các repository đã đồng bộ từ GitHub và kiểm tra dữ liệu chi tiết của từng người dùng.
          </p>
        </div>
        <Button variant="outline" onClick={fetchRepositories} isLoading={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danh sách repository</CardTitle>
          <CardDescription>
            Danh sách này lấy từ API quản trị GitHub repository của hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Tìm theo tên repo, chủ sở hữu, email hoặc ngôn ngữ..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Repository</th>
                    <th className="px-4 py-3">Người sở hữu</th>
                    <th className="px-4 py-3">Công nghệ</th>
                    <th className="px-4 py-3">Thông số</th>
                    <th className="px-4 py-3">Đồng bộ</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Đang tải repository...</td>
                    </tr>
                  ) : filteredRepositories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Chưa có repository phù hợp.</td>
                    </tr>
                  ) : filteredRepositories.map((repository) => {
                    const id = repositoryId(repository)

                    return (
                      <tr key={id} className="bg-white align-top dark:bg-slate-950/40">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-950 dark:text-slate-50">{repository.fullName || repository.name || 'Repository chưa đặt tên'}</p>
                          <p className="mt-1 max-w-sm text-xs text-slate-500">{repository.description || 'Chưa có mô tả'}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant={repository.private ? 'warning' : 'success'}>
                              {repository.private ? 'Riêng tư' : 'Công khai'}
                            </Badge>
                            {repository.fork && <Badge variant="default">Fork</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{ownerName(repository)}</p>
                          <p className="text-xs text-slate-500">{ownerEmail(repository)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="info">{repository.language || 'Chưa rõ'}</Badge>
                          <p className="mt-2 text-xs text-slate-500">Nhánh chính: {repository.defaultBranch || 'Chưa rõ'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="default">{repository.stargazersCount ?? 0} sao</Badge>
                            <Badge variant="default">{repository.forksCount ?? 0} fork</Badge>
                            <Badge variant="default">{repository.openIssuesCount ?? 0} issue</Badge>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Dung lượng: {repository.size ?? 0} KB</p>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <p>{formatDate(repository.lastSyncedAt)}</p>
                          <p className="mt-1 text-xs">GitHub: {formatDate(repository.updatedAtGithub || repository.pushedAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {repository.htmlUrl && (
                              <a href={repository.htmlUrl} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  GitHub
                                </Button>
                              </a>
                            )}
                            <Button variant="ghost" size="sm" disabled={!id} onClick={() => navigate(`/admin/repositories/${id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Chi tiết
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.total > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Trang {pagination.page} / {Math.max(pagination.totalPages, 1)} - tổng {pagination.total} repository
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trước</Button>
                <Button variant="outline" size="sm" disabled={pagination.totalPages === 0 || page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
