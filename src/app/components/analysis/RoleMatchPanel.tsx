import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, CircleCheck, Database, Target } from 'lucide-react'
import type { RepositoryRoleMatches, RoleCatalogItem, RoleMatch, RoleOption } from '../../types'
import { getApiErrorMessage } from '../../services/apis/core'
import { roleMatchApi } from '../../services/apis/analysis'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type RoleMatchPanelProps = {
  repositoryId: string
  selectedRoleId?: string
  onSelectRole?: (option: RoleOption) => void
}

const getTone = (level?: string) => {
  if (level === 'high') return { badge: 'success' as const, text: 'text-emerald-700 dark:text-emerald-300' }
  if (level === 'medium') return { badge: 'info' as const, text: 'text-cyan-700 dark:text-cyan-300' }
  if (level === 'low') return { badge: 'warning' as const, text: 'text-amber-700 dark:text-amber-300' }
  return { badge: 'danger' as const, text: 'text-red-700 dark:text-red-300' }
}

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score || 0)))

const RoleOptionCard = ({
  option,
  catalog,
  primary = false,
  selected = false,
  onSelect
}: {
  option: RoleOption
  catalog?: RoleCatalogItem
  primary?: boolean
  selected?: boolean
  onSelect?: (option: RoleOption) => void
}) => {
  const tone = getTone(option.matchLevel)
  const sourceLabel = option.sourceRepositoryName || (
    option.selectionType === 'portfolio_suggestion'
      ? 'Gợi ý từ portfolio'
      : option.selectionType === 'portfolio_repository_primary'
        ? 'Vai trò chính từ repository khác'
        : ''
  )

  return (
    <article className={`rounded-lg border p-4 ${selected ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900' : primary ? 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{option.roleName}</h4>
            {option.matchLevelLabel && <Badge variant={tone.badge}>{option.matchLevelLabel}</Badge>}
            {selected && <Badge variant="info">Đã chọn</Badge>}
          </div>
          {catalog?.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{catalog.description}</p>}
          {!primary && sourceLabel && (
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-500"><Database className="h-3.5 w-3.5" />Nguồn: {sourceLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <p className={`text-2xl font-bold ${tone.text}`}>{clampScore(option.matchScore)}%</p>
          {onSelect && <Button size="sm" variant={selected ? 'outline' : 'default'} onClick={() => onSelect(option)}>Chọn vai trò</Button>}
        </div>
      </div>
      {(option.matchedSkillNames?.length || option.recommendedNextSkills?.length) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {option.matchedSkillNames?.slice(0, 4).map((skill) => <Badge key={`matched:${skill}`} variant="success">{skill}</Badge>)}
          {option.recommendedNextSkills?.slice(0, 3).map((skill) => <Badge key={`next:${skill}`} variant="warning">{skill}</Badge>)}
        </div>
      ) : null}
    </article>
  )
}

const LegacyRoleCard = ({ match, catalog }: { match: RoleMatch; catalog?: RoleCatalogItem }) => (
  <article className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{match.roleName}</h4>
        {catalog?.description && <p className="mt-1 text-sm text-slate-500">{catalog.description}</p>}
      </div>
      <p className={`text-xl font-bold ${getTone(match.matchLevel).text}`}>{clampScore(match.matchScore)}%</p>
    </div>
    {match.recommendedNextSkills?.length ? (
      <div className="mt-3 flex flex-wrap gap-2">
        {match.recommendedNextSkills.slice(0, 4).map((skill) => <Badge key={skill} variant="warning">{skill}</Badge>)}
      </div>
    ) : null}
  </article>
)

export const RoleMatchPanel = ({ repositoryId, selectedRoleId, onSelectRole }: RoleMatchPanelProps) => {
  const [data, setData] = useState<RepositoryRoleMatches | null>(null)
  const [roles, setRoles] = useState<RoleCatalogItem[]>([])
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
        const catalog = await roleMatchApi.getRoleCatalog().catch(() => ({ total: 0, items: [] }))
        if (!isCurrent) return
        setData(matches)
        setRoles(catalog.items)
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
  const primaryRole = data?.primaryRole ?? data?.roleSelection?.primaryRole
  const additionalRoleOptions = (data?.additionalRoleOptions ?? data?.roleSelection?.additionalRoleOptions ?? [])
    .filter((option) => option.roleId !== primaryRole?.roleId)
    .slice(0, 2)
  // A legacy matches[] item has no repository provenance. Keep it visible for
  // compatibility, but never relabel it as a portfolio option.
  const legacyMatches = (data?.matches ?? []).filter((match) => match.roleId !== primaryRole?.roleId)
  const visibleLegacyMatches = isExpanded ? legacyMatches : legacyMatches.slice(0, 2)
  const hasLegacyFallback = additionalRoleOptions.length === 0 && legacyMatches.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />Vai trò phù hợp</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" aria-label="Đang tải mức độ phù hợp">
            <div className="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="h-32 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>Không thể tải vai trò phù hợp: {error}</p>
          </div>
        ) : !primaryRole ? (
          <p className="text-sm text-slate-500">Chưa có vai trò chính cho repository này. Hãy chạy phân tích lại.</p>
        ) : (
          <div className="space-y-6">
            <section className="space-y-2">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100"><CircleCheck className="h-4 w-4 text-indigo-600" />Vai trò phù hợp nhất với repository hiện tại</h3>
              <RoleOptionCard option={primaryRole} catalog={roleMap.get(primaryRole.roleId)} primary selected={selectedRoleId === primaryRole.roleId} onSelect={onSelectRole} />
            </section>

            {additionalRoleOptions.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Các vai trò khác từ repository đã phân tích</h3>
                  <p className="mt-1 text-sm text-slate-500">Mỗi lựa chọn là vai trò chính của một repository cụ thể trong portfolio.</p>
                </div>
                {additionalRoleOptions.map((option) => (
                  <RoleOptionCard key={`${option.roleId}:${option.sourceRepositoryId ?? ''}`} option={option} catalog={roleMap.get(option.roleId)} selected={selectedRoleId === option.roleId} onSelect={onSelectRole} />
                ))}
              </section>
            )}

            {hasLegacyFallback && (
              <section className="space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Dự đoán từ response tương thích cũ</h3>
                  <p className="mt-1 text-sm text-slate-500">Các vai trò dưới đây không được coi là lựa chọn portfolio vì response cũ không có provenance.</p>
                </div>
                {visibleLegacyMatches.map((match) => <LegacyRoleCard key={match.roleId} match={match} catalog={roleMap.get(match.roleId)} />)}
                {legacyMatches.length > 2 && (
                  <Button variant="ghost" className="w-full" onClick={() => setIsExpanded((value) => !value)}>
                    {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    {isExpanded ? 'Thu gọn vai trò' : `Xem thêm ${legacyMatches.length - 2} vai trò`}
                  </Button>
                )}
              </section>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
