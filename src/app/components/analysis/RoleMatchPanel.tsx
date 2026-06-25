import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, CircleCheck, Lightbulb, Target } from 'lucide-react'
import type { RepositoryRoleMatches, RoleCatalogItem, RoleMatch, SkillCatalogItem } from '../../types'
import { getApiErrorMessage } from '../../services/apis/core'
import { roleMatchApi } from '../../services/apis/analysis'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type RoleMatchPanelProps = {
  repositoryId: string
}

const getTone = (level: string) => {
  if (level === 'high') return { badge: 'success' as const, bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' }
  if (level === 'medium') return { badge: 'info' as const, bar: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-300' }
  if (level === 'low') return { badge: 'warning' as const, bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' }
  return { badge: 'danger' as const, bar: 'bg-red-500', text: 'text-red-700 dark:text-red-300' }
}

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score || 0)))

const RoleRow = ({ match, skillMap, catalog }: { match: RoleMatch; skillMap: Map<string, SkillCatalogItem>; catalog?: RoleCatalogItem }) => {
  const tone = getTone(match.matchLevel)
  const nextSkills = match.recommendedNextSkills.slice(0, 5)

  return (
    <article className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{match.roleName}</h3>
            <Badge variant={tone.badge}>{match.matchLevelLabel}</Badge>
            {catalog && <span className="text-xs text-slate-500 dark:text-slate-400">{catalog.requiredSkillCount} kỹ năng cốt lõi</span>}
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{match.description}</p>
        </div>
        <div className="min-w-20 text-left sm:text-right">
          <p className={`text-2xl font-bold ${tone.text}`}>{clampScore(match.matchScore)}%</p>
          <p className="text-xs text-slate-500">mức độ phù hợp</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${clampScore(match.matchScore)}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-md border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        <div className="px-3 py-2">
          <p className="text-xs text-slate-500">Bao phủ yêu cầu</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{clampScore(match.coverageScore)}%</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs text-slate-500">Kỹ năng khớp</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{match.matchedSkillCount}</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs text-slate-500">Còn thiếu cốt lõi</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{match.missingRequiredSkillCount}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">{match.summary}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-slate-500">Kỹ năng đã thể hiện</p>
          <div className="flex flex-wrap gap-2">
            {match.topMatchedSkills.length
              ? match.topMatchedSkills.slice(0, 5).map((skill) => <Badge key={skill} variant="success">{skill}</Badge>)
              : <span className="text-sm text-slate-500">Chưa phát hiện kỹ năng nổi bật.</span>}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-slate-500">Nên bổ sung tiếp</p>
          <div className="flex flex-wrap gap-2">
            {nextSkills.length
              ? nextSkills.map((skill) => (
                <Badge key={skill} variant="warning" title={skillMap.get(skill)?.category ? `Nhóm: ${skillMap.get(skill)?.category}` : undefined}>
                  {skill}
                </Badge>
              ))
              : <span className="text-sm text-slate-500">Chưa có đề xuất kỹ năng.</span>}
          </div>
        </div>
      </div>
    </article>
  )
}

export const RoleMatchPanel = ({ repositoryId }: RoleMatchPanelProps) => {
  const [data, setData] = useState<RepositoryRoleMatches | null>(null)
  const [roles, setRoles] = useState<RoleCatalogItem[]>([])
  const [skills, setSkills] = useState<SkillCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    let isCurrent = true

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const matches = await roleMatchApi.getRepositoryRoleMatches(repositoryId)
        const [roleCatalog, skillCatalog] = await Promise.allSettled([
          roleMatchApi.getRoleCatalog(),
          roleMatchApi.getSkillCatalog()
        ])

        if (!isCurrent) return
        setData(matches)
        setRoles(roleCatalog.status === 'fulfilled' ? roleCatalog.value.items : [])
        setSkills(skillCatalog.status === 'fulfilled' ? skillCatalog.value.items : [])
      } catch (requestError) {
        if (isCurrent) setError(getApiErrorMessage(requestError))
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void load()
    return () => { isCurrent = false }
  }, [repositoryId])

  const roleMap = useMemo(() => new Map(roles.map((role) => [role.roleId, role])), [roles])
  const skillMap = useMemo(() => new Map(skills.map((skill) => [skill.name, skill])), [skills])
  const matches = data?.matches ?? []
  const visibleMatches = isExpanded ? matches : matches.slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Mức độ phù hợp với vai trò
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" aria-label="Đang tải mức độ phù hợp">
            <div className="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>Không thể tải mức độ phù hợp của repository: {error}</p>
          </div>
        ) : !data || !data.topRole ? (
          <p className="text-sm text-slate-500">Chưa có dữ liệu role match cho repository này. Hãy chạy phân tích lại.</p>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <CircleCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Vai trò gần nhất với repository này</p>
                    <h3 className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-slate-100">{data.topRole.roleName}</h3>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{clampScore(data.topRole.matchScore)}%</p>
                  <Badge variant={getTone(data.topRole.matchLevel).badge}>{data.topRole.matchLevelLabel}</Badge>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Dựa trên tín hiệu kỹ năng và mức độ bao phủ yêu cầu của vai trò.</p>
            </div>

            {matches.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <Lightbulb className="h-4 w-4" />
                  <p className="font-medium">Ưu tiên tiếp theo</p>
                </div>
                <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
                  Bổ sung {matches[0].recommendedNextSkills.slice(0, 3).join(', ') || 'các kỹ năng còn thiếu'} để cải thiện độ sẵn sàng cho {data.topRole.roleName}.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {visibleMatches.map((match) => (
                <RoleRow key={match.roleId} match={match} skillMap={skillMap} catalog={roleMap.get(match.roleId)} />
              ))}
            </div>

            {matches.length > 3 && (
              <Button variant="ghost" className="w-full" onClick={() => setIsExpanded((value) => !value)}>
                {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                {isExpanded ? 'Thu gọn vai trò' : `Xem thêm ${matches.length - 3} vai trò`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
