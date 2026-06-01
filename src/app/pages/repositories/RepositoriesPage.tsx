import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState
} from '@tanstack/react-table'
import { Search, ArrowUpDown, MoreHorizontal, Eye, Play, ExternalLink, Star, GitFork, CheckCircle2, XCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatRelativeTime } from '../../lib/utils'
import type { Repository } from '../../types'

export const RepositoriesPage = () => {
  const { repositories, analyzeRepository } = useRepositoryStore()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<Repository>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Repository
              <ArrowUpDown className="h-4 w-4" />
            </button>
          )
        },
        cell: ({ row }) => {
          const repo = row.original
          return (
            <div className="max-w-md">
              <Link
                to={`/repositories/${repo.id}`}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {repo.name}
              </Link>
              {repo.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {repo.description}
                </p>
              )}
            </div>
          )
        }
      },
      {
        accessorKey: 'language',
        header: 'Ngôn ngữ',
        cell: ({ row }) => (
          <Badge variant="default">{row.original.language}</Badge>
        )
      },
      {
        accessorKey: 'stars',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Sao
              <ArrowUpDown className="h-4 w-4" />
            </button>
          )
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Star className="h-4 w-4" />
            <span>{row.original.stars}</span>
          </div>
        )
      },
      {
        accessorKey: 'forks',
        header: 'Fork',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <GitFork className="h-4 w-4" />
            <span>{row.original.forks}</span>
          </div>
        )
      },
      {
        accessorKey: 'hasReadme',
        header: 'README',
        cell: ({ row }) => (
          row.original.hasReadme ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <XCircle className="h-5 w-5 text-slate-300 dark:text-slate-700" />
          )
        )
      },
      {
        accessorKey: 'analyzed',
        header: 'Trạng thái',
        cell: ({ row }) => (
          row.original.analyzed ? (
            <Badge variant="success">Đã phân tích</Badge>
          ) : (
            <Badge variant="default">Chưa phân tích</Badge>
          )
        )
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Cập nhật
              <ArrowUpDown className="h-4 w-4" />
            </button>
          )
        },
        cell: ({ row }) => formatRelativeTime(row.original.updatedAt)
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const repo = row.original
          return (
            <div className="flex items-center gap-2">
              {repo.analyzed && repo.analysisId ? (
                <Link to={`/analysis/${repo.analysisId}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => analyzeRepository(repo.id)}
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              <a href={repo.url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          )
        }
      }
    ],
    [analyzeRepository]
  )

  const table = useReactTable({
    data: repositories,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Kho mã nguồn
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Quản lý và phân tích repository GitHub của bạn
          </p>
        </div>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Phân tích tất cả
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm repository..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Tất cả ngôn ngữ</option>
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="go">Go</option>
            </select>
            <select className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Tất cả trạng thái</option>
              <option value="analyzed">Đã phân tích</option>
              <option value="not-analyzed">Chưa phân tích</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-slate-200 dark:border-slate-800">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-4 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} đến{' '}
            {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, repositories.length)} trong{' '}
            {repositories.length} repository
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Tiếp
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
