import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  GitCompareArrows,
  History,
  MinusCircle,
  RefreshCw,
  Target,
  UserRound
} from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { formatDate } from '../../lib/utils'
import { getApiErrorMessage } from '../../services/apis/core'
import { type AnalysisSnapshot, formatReadinessDelta, formatReadinessScore, normalizeSnapshotPair, selectDefaultSnapshotPair, snapshotApi, type RepositoryProgressComparisonState, type SkillComparisonItem, type SnapshotComparison, type SnapshotComparisonState } from '../../services/apis/progress'
import { useRepositoryStore } from '../../stores/repositoryStore'
import type { SkillVectorItem } from '../../types'

const MAX_SKILLS = 6
const MAX_SKILL_CHANGES = 10

const toScore = (value?: number) => Math.max(0, Math.min(100, Math.round(value ?? 0)))

const toPercent = (value?: number) => {
  if (value === undefined || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value <= 1 ? value * 100 : value)))
}

const signedPoint = (value: number) => `${value > 0 ? '+' : ''}${Math.round(value)} điểm`

const levelLabel = (level?: string) => {
  const normalized = level?.toLowerCase()
  if (normalized === 'beginner') return 'Cơ bản'
  if (normalized === 'intermediate') return 'Trung cấp'
  if (normalized === 'advanced') return 'Nâng cao'
  return level || 'Chưa xác định'
}

const confidenceLabel = (confidence?: string | number) => {
  if (typeof confidence === 'number') return `${Math.round(confidence * 100)}%`
  if (confidence === 'high') return 'Cao'
  if (confidence === 'medium') return 'Trung bình'
  if (confidence === 'low') return 'Thấp'
  return confidence || 'Chưa có'
}

const scopeLabel = (type?: string) => {
  if (type === 'user_contribution') return 'Đóng góp cá nhân'
  return 'Toàn bộ dự án'
}

const skillName = (skill: SkillComparisonItem) =>
  skill.skillName || skill.canonicalSkillName || skill.skill || 'Kỹ năng'

const trendLabel = (trend?: string) => {
  if (trend === 'improved') return 'Tăng'
  if (trend === 'weaker' || trend === 'regressed') return 'Giảm'
  if (trend === 'new') return 'Mới'
  return 'Ổn định'
}

const trendVariant = (trend?: string): 'success' | 'warning' | 'danger' | 'default' | 'info' => {
  if (trend === 'improved' || trend === 'new') return 'success'
  if (trend === 'weaker' || trend === 'regressed') return 'danger'
  return 'default'
}

const snapshotLabel = (snapshot: AnalysisSnapshot, index: number) =>
  `Mốc ${index + 1} - ${snapshot.createdAt ? formatDate(snapshot.createdAt) : snapshot.id}`

const sameSnapshotGeneration = (left?: AnalysisSnapshot, right?: AnalysisSnapshot) => {
  if (!left || !right) return true
  if (left.modelVersion && right.modelVersion && left.modelVersion !== right.modelVersion) return false
  if (left.pipelineVersion && right.pipelineVersion && left.pipelineVersion !== right.pipelineVersion) return false
  return true
}

const currentAssessment = (snapshot?: AnalysisSnapshot | null) => {
  const score = toScore(snapshot?.overallScore)
  if (score >= 80) return 'Hồ sơ năng lực đang mạnh, có thể dùng làm minh chứng học tập hoặc ứng tuyển.'
  if (score >= 65) return 'Nền tảng đang tốt. Nên bổ sung thêm kiểm thử, tài liệu hoặc triển khai để tăng độ thuyết phục.'
  if (score >= 45) return 'Dự án đã có tín hiệu kỹ năng, nhưng vẫn cần hoàn thiện các phần còn thiếu để thể hiện rõ năng lực.'
  return 'Cần thêm dữ liệu phân tích và cải thiện dự án trước khi dùng làm căn cứ đánh giá năng lực.'
}

const changeAssessment = (change: number) => {
  if (change > 0) return 'Mốc phân tích mới ghi nhận tiến bộ so với mốc trước.'
  if (change < 0) return 'Một số chỉ số đang giảm, nên xem lại các kỹ năng hoặc dữ liệu còn thiếu.'
  return 'Điểm tổng quan chưa đổi. Dự án có thể chưa có thay đổi đủ lớn giữa hai mốc.'
}

const getSkillGroups = (comparison?: SnapshotComparison | null) => {
  const skillChanges = comparison?.skillChanges ?? []
  return {
    improved: (comparison?.topImprovedSkills.length
      ? comparison.topImprovedSkills
      : skillChanges.filter((item) => item.trend === 'improved' || (item.delta ?? 0) > 0)
    ).slice(0, MAX_SKILLS),
    unchanged: skillChanges
      .filter((item) => item.trend === 'unchanged' || item.status === 'unchanged' || (item.delta ?? 0) === 0)
      .slice(0, MAX_SKILLS),
    weaker: (comparison?.topRegressedSkills.length
      ? comparison.topRegressedSkills
      : skillChanges.filter((item) => item.trend === 'weaker' || item.trend === 'regressed' || (item.delta ?? 0) < 0)
    ).slice(0, MAX_SKILLS)
  }
}

const SkillList = ({ items }: { items: SkillVectorItem[] }) => {
  if (!items.length) return <p className="text-sm text-slate-500">Chưa có kỹ năng nổi bật trong mốc phân tích này.</p>

  return (
    <div className="space-y-2">
      {items.slice(0, MAX_SKILLS).map((skill) => (
        <div key={skill.canonicalSkillName} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{skill.canonicalSkillName}</p>
            <p className="truncate text-xs text-slate-500">{skill.category || 'Kỹ năng'}</p>
          </div>
          <Badge variant={toPercent(skill.score) >= 70 ? 'success' : 'info'}>{toPercent(skill.score)}%</Badge>
        </div>
      ))}
    </div>
  )
}

const MissingSkillList = ({ items }: { items: string[] }) => {
  if (!items.length) return <p className="text-sm text-slate-500">Chưa phát hiện kỹ năng thiếu nổi bật.</p>

  return (
    <div className="space-y-2">
      {items.slice(0, MAX_SKILLS).map((skill) => (
        <div key={skill} className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {skill}
        </div>
      ))}
    </div>
  )
}

export const RepositoryProgressPage = () => {
  const { repositories, fetchRepositories, fetchMyAnalyses } = useRepositoryStore()
  const [repositoryId, setRepositoryId] = useState('')
  const [snapshots, setSnapshots] = useState<AnalysisSnapshot[]>([])
  const [snapshotTotal, setSnapshotTotal] = useState(0)
  const [baselineComparison, setBaselineComparison] = useState<RepositoryProgressComparisonState | null>(null)
  const [manualComparison, setManualComparison] = useState<SnapshotComparisonState | null>(null)
  const [firstId, setFirstId] = useState('')
  const [secondId, setSecondId] = useState('')
  const [selectedSnapshotDetail, setSelectedSnapshotDetail] = useState<AnalysisSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadRequestRef = useRef(0)
  const compareRequestRef = useRef(0)
  const comparisonResultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void Promise.all([
      fetchRepositories().catch(() => undefined),
      fetchMyAnalyses().catch(() => undefined)
    ])
  }, [fetchMyAnalyses, fetchRepositories])

  useEffect(() => {
    if (!repositoryId && repositories.length) setRepositoryId(repositories[0].id)
  }, [repositories, repositoryId])

  const loadSnapshots = async () => {
    if (!repositoryId) return
    const requestId = ++loadRequestRef.current

    setIsLoading(true)
    setError(null)
    setManualComparison(null)

    try {
      await fetchMyAnalyses().catch(() => undefined)
      const [history, comparison] = await Promise.all([
        snapshotApi.getSnapshots(repositoryId, { page: 1, limit: 50, view: 'summary' }),
        snapshotApi.getProgressComparison(repositoryId)
      ])
      const newestSnapshot = history.snapshots[0]
      const latestDetail = newestSnapshot
        ? await snapshotApi.getSnapshot(newestSnapshot.id, { view: 'detail', includeEvidence: true }).catch(() => null)
        : null
      const hydrated = latestDetail
        ? history.snapshots.map((snapshot) => snapshot.id === latestDetail.id ? latestDetail : snapshot)
        : history.snapshots
      if (requestId !== loadRequestRef.current) return
      const defaultPair = selectDefaultSnapshotPair(hydrated)

      setSnapshots(hydrated)
      setSnapshotTotal(history.pagination.total)
      setBaselineComparison(comparison)
      setFirstId(defaultPair.fromSnapshotId)
      setSecondId(defaultPair.toSnapshotId)
    } catch (requestError) {
      if (requestId !== loadRequestRef.current) return
      setSnapshots([])
      setSnapshotTotal(0)
      setBaselineComparison(null)
      setError(getApiErrorMessage(requestError))
    } finally {
      if (requestId === loadRequestRef.current) setIsLoading(false)
    }
  }

  useEffect(() => {
    setSnapshots([])
    setSnapshotTotal(0)
    setBaselineComparison(null)
    setManualComparison(null)
    setFirstId('')
    setSecondId('')
    void loadSnapshots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositoryId])

  const compareSnapshots = async () => {
    if (!firstId || !secondId || firstId === secondId) return
    const first = snapshots.find((snapshot) => snapshot.id === firstId)
    const second = snapshots.find((snapshot) => snapshot.id === secondId)
    if (!first || !second) return
    const pair = normalizeSnapshotPair(first, second)
    if (!pair) return
    const requestId = ++compareRequestRef.current

    setIsComparing(true)
    setError(null)
    setManualComparison(null)

    try {
      const comparison = await snapshotApi.compareSnapshots(pair.fromSnapshotId, pair.toSnapshotId)
      if (requestId !== compareRequestRef.current) return
      setManualComparison(comparison)
      if (comparison.comparisonStatus === 'incompatible_snapshot_versions') {
        setError('Hai mốc sử dụng phiên bản phân tích khác nhau nên không thể so sánh kỹ năng trực tiếp.')
      } else {
        requestAnimationFrame(() => {
          comparisonResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    } catch (requestError) {
      if (requestId !== compareRequestRef.current) return
      setError(getApiErrorMessage(requestError))
    } finally {
      if (requestId === compareRequestRef.current) setIsComparing(false)
    }
  }

  const openSnapshot = async (snapshotId: string) => {
    try {
      const detail = await snapshotApi.getSnapshot(snapshotId)
      setSnapshots((current) => current.map((snapshot) => snapshot.id === snapshotId ? detail : snapshot))
      setSelectedSnapshotDetail(detail)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    }
  }

  useEffect(() => {
    compareRequestRef.current += 1
    setIsComparing(false)
    setManualComparison(null)
    setError(null)
  }, [firstId, secondId])

  const activeComparison = manualComparison
    ? manualComparison.comparisonStatus === 'comparable' ? manualComparison : null
    : baselineComparison?.comparisonStatus === 'comparable'
      ? baselineComparison.data
      : null
  const insufficientComparison = baselineComparison?.comparisonStatus === 'insufficient_compatible_snapshots'
  const selectedRepository = repositories.find((repository) => repository.id === repositoryId)
  const firstSnapshot = activeComparison?.firstSnapshot ?? null
  const latestSnapshot = activeComparison?.latestSnapshot ?? snapshots[0] ?? null
  const contributionScope = latestSnapshot?.analysisScope
  const overallChange = activeComparison?.overallChange ?? 0
  const readinessDelta = activeComparison?.delta?.userReadinessScore ?? activeComparison?.overallChange
  const repoTitle = activeComparison?.fullName || latestSnapshot?.fullName || selectedRepository?.fullName || selectedRepository?.name || 'Dự án'
  const topSkills = latestSnapshot?.topSkills?.length ? latestSnapshot.topSkills : latestSnapshot?.skillVector ?? []
  const skillGroups = getSkillGroups(activeComparison)
  const selectedFirstSnapshot = snapshots.find((snapshot) => snapshot.id === firstId)
  const selectedSecondSnapshot = snapshots.find((snapshot) => snapshot.id === secondId)
  const pairIsComparable = Boolean(
    firstId && secondId && firstId !== secondId
  )
  const pairHint = !firstId || !secondId
    ? snapshots.length > 1 && selectedSecondSnapshot
      ? 'Snapshot mới đã được ghi nhận. Các snapshot trước đó khác phiên bản pipeline nên chưa thể dùng làm mốc gốc.'
      : 'Chọn đủ mốc gốc và mốc mới để bắt đầu.'
    : firstId === secondId
      ? 'Hai mốc phải khác nhau.'
    : 'Cặp mốc hợp lệ. Bấm “So sánh thay đổi” để xem kết quả.'
  const chartData = useMemo(() => [...snapshots].reverse().map((snapshot, index) => ({
    label: snapshot.analyzedAt || snapshot.createdAt ? formatDate(snapshot.analyzedAt || snapshot.createdAt) : `Mốc ${index + 1}`,
    score: toScore(snapshot.overallScore)
  })), [snapshots])
  const compatibleSnapshotCount = snapshots.filter((snapshot) =>
    snapshot.isComparableWithCurrent !== false
    && snapshot.isCompatible !== false
    && sameSnapshotGeneration(snapshot, selectedSecondSnapshot ?? snapshots.find((item) => item.isCurrentVersion))
  ).length
  const hasProvenNonSkillRegression = Boolean(
    activeComparison
    && readinessDelta !== undefined
    && readinessDelta < 0
    && activeComparison.skillComparisonSummary.improvedCount > 0
    && activeComparison.skillComparisonSummary.regressedCount === 0
    && activeComparison.scoreChanges.some((change) =>
      change.change < 0 && !change.key.toLowerCase().includes('skill')
    )
  )

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Theo dõi trình độ</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Quan sát điểm sẵn sàng, kỹ năng nổi bật và thay đổi giữa các mốc phân tích của dự án.
          </p>
        </div>
        <div className="flex w-full gap-2 lg:w-auto">
          <select
            value={repositoryId}
            onChange={(event) => setRepositoryId(event.target.value)}
            className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 lg:w-80"
          >
            {repositories.length === 0
              ? <option value="">Chưa có dự án</option>
              : repositories.map((repository) => (
                <option key={repository.id} value={repository.id}>{repository.fullName || repository.name}</option>
              ))}
          </select>
          <Button variant="outline" onClick={loadSnapshots} isLoading={isLoading} disabled={!repositoryId} title="Tải lại dữ liệu">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {!isLoading && snapshots.length === 0 && !error ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-slate-500">
            Dự án này chưa có mốc phân tích. Hãy phân tích dự án để bắt đầu theo dõi tiến độ.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="text-xl">{repoTitle}</CardTitle>
                  <CardDescription className="mt-1">{currentAssessment(latestSnapshot)}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">{scopeLabel(activeComparison?.analysisScopeType || contributionScope?.type)}</Badge>
                  {latestSnapshot?.projectType && <Badge>{latestSnapshot.projectType}</Badge>}
                  {latestSnapshot?.careerDirection && <Badge variant="success">{latestSnapshot.careerDirection}</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-200">Điểm sẵn sàng hiện tại</p>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <span className="text-5xl font-bold text-indigo-700 dark:text-indigo-200">{toScore(latestSnapshot?.overallScore)}</span>
                    <span className="pb-2 text-sm text-indigo-700 dark:text-indigo-200">/ 100</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="info">Trình độ: {levelLabel(latestSnapshot?.userLevel)}</Badge>
                    <Badge>Độ tin cậy: {confidenceLabel(latestSnapshot?.confidence)}</Badge>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Thay đổi điểm</p>
                    <div className="mt-2 flex items-center gap-2">
                      <p className={`text-2xl font-semibold ${overallChange > 0 ? 'text-emerald-600' : overallChange < 0 ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
                        {signedPoint(overallChange)}
                      </p>
                      {overallChange > 0 ? <ArrowUpRight className="h-5 w-5 text-emerald-600" /> : overallChange < 0 ? <ArrowDownRight className="h-5 w-5 text-red-600" /> : <MinusCircle className="h-5 w-5 text-slate-500" />}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{changeAssessment(overallChange)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Trình độ</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {levelLabel(activeComparison?.delta?.fromLevel || firstSnapshot?.userLevel)} {'->'} {levelLabel(activeComparison?.delta?.toLevel || latestSnapshot?.userLevel)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {activeComparison?.delta?.levelChanged ? 'Đã có thay đổi cấp độ.' : 'Cấp độ chưa thay đổi.'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Commit được ghi nhận</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {contributionScope?.userCommits ?? 0}/{contributionScope?.totalRepoCommits ?? 0}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">Thay đổi: {activeComparison?.delta ? signedPoint(activeComparison.delta.userCommitsDelta).replace(' điểm', '') : '0'}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Ngày hoạt động</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{contributionScope?.activeDays ?? 0}</p>
                    <p className="mt-2 text-xs text-slate-500">Thay đổi: {activeComparison?.delta ? signedPoint(activeComparison.delta.activeDaysDelta).replace(' điểm', '') : '0'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Diễn biến điểm</CardTitle>
                <CardDescription>Mỗi điểm là một mốc phân tích đã được lưu.</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" name="Điểm sẵn sàng" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Lịch sử mốc</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {snapshots.map((snapshot, index) => (
                    <div key={snapshot.id} className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Mốc {Math.max(1, snapshotTotal - index)}</p>
                          <p className="text-xs text-slate-500">{snapshot.analyzedAt || snapshot.createdAt ? formatDate(snapshot.analyzedAt || snapshot.createdAt) : 'Chưa có thời gian'}</p>
                        </div>
                        <Badge variant="info">{toScore(snapshot.overallScore)}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Trình độ: {levelLabel(snapshot.userLevel)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {snapshot.analysisScope?.userCommits ?? 0} commit · {snapshot.analysisScope?.activeDays ?? 0} ngày hoạt động
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {snapshot.pipelineVersion && <Badge variant="info" className="h-auto max-w-full whitespace-normal break-words">Pipeline {snapshot.pipelineVersion}</Badge>}
                        {snapshot.modelVersion && <Badge className="h-auto max-w-full whitespace-normal break-words">Model {snapshot.modelVersion}</Badge>}
                        {snapshot.scoringMethod && <Badge>{snapshot.scoringMethod}</Badge>}
                        {index === 0 ? <Badge variant="success">Mốc hiện tại</Badge> : <Badge>Phiên bản cũ</Badge>}
                        {snapshot.scoringMethod && latestSnapshot?.scoringMethod && snapshot.scoringMethod !== latestSnapshot.scoringMethod && <Badge variant="warning">Không thể so sánh kỹ năng</Badge>}
                        <Button size="sm" variant="ghost" onClick={() => openSnapshot(snapshot.id)}>Xem chi tiết</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedSnapshotDetail && (
            <Card className="border-indigo-200 dark:border-indigo-900">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Chi tiết snapshot</CardTitle>
                    <CardDescription>{selectedSnapshotDetail.analyzedAt || selectedSnapshotDetail.createdAt ? formatDate(selectedSnapshotDetail.analyzedAt || selectedSnapshotDetail.createdAt) : selectedSnapshotDetail.id}</CardDescription>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedSnapshotDetail(null)}>Đóng</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Điểm sẵn sàng', toScore(selectedSnapshotDetail.overallScore)],
                    ['Trình độ', levelLabel(selectedSnapshotDetail.userLevel)],
                    ['Commit', selectedSnapshotDetail.analysisScope?.userCommits ?? '—'],
                    ['Ngày hoạt động', selectedSnapshotDetail.analysisScope?.activeDays ?? '—'],
                    ['Pipeline', selectedSnapshotDetail.pipelineVersion ?? '—'],
                    ['Model', selectedSnapshotDetail.modelVersion ?? '—'],
                    ['Cách tính điểm', selectedSnapshotDetail.scoringMethod ?? '—'],
                    ['Hướng nghề nghiệp', selectedSnapshotDetail.careerDirection ?? '—']
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 break-words font-medium text-slate-900 dark:text-slate-100">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {[
                    ['Kỹ năng đã khớp', selectedSnapshotDetail.matchedSkillNames ?? []],
                    ['Kỹ năng yếu', selectedSnapshotDetail.weakSkillNames ?? []],
                    ['Kỹ năng còn thiếu', selectedSnapshotDetail.missingSkillNames?.length ? selectedSnapshotDetail.missingSkillNames : selectedSnapshotDetail.missingSkills],
                    ['Kỹ năng nên học tiếp', selectedSnapshotDetail.recommendedNextSkills ?? []]
                  ].map(([label, values]) => (
                    <div key={String(label)}>
                      <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {(values as string[]).length ? (values as string[]).map((value) => <Badge key={value}>{value}</Badge>) : <span className="text-sm text-slate-500">Chưa có dữ liệu.</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Kỹ năng nổi bật</CardTitle>
                <CardDescription>Các kỹ năng mạnh nhất trong mốc mới nhất.</CardDescription>
              </CardHeader>
              <CardContent>
                <SkillList items={topSkills} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kỹ năng cần bổ sung</CardTitle>
                <CardDescription>Những kỹ năng nên ưu tiên để cải thiện hồ sơ học tập.</CardDescription>
              </CardHeader>
              <CardContent>
                <MissingSkillList items={latestSnapshot?.missingSkills ?? []} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" />Dữ liệu đóng góp</CardTitle>
                <CardDescription>Thông tin hệ thống dùng để đánh giá phần đóng góp cá nhân.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
                  <p className="text-xs text-slate-500">Tài khoản GitHub</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{contributionScope?.githubUsername || 'Chưa xác định'}</p>
                </div>
                <div className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
                  <p className="text-xs text-slate-500">Khoảng thời gian ghi nhận</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {contributionScope?.firstCommitDate ? formatDate(contributionScope.firstCommitDate) : 'Chưa có'} {'->'} {contributionScope?.lastCommitDate ? formatDate(contributionScope.lastCommitDate) : 'Chưa có'}
                  </p>
                </div>
                <div className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
                  <p className="text-xs text-slate-500">Phân tích gần nhất</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {latestSnapshot?.analyzedAt || latestSnapshot?.createdAt ? formatDate(latestSnapshot.analyzedAt || latestSnapshot.createdAt) : 'Chưa có'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {snapshots.length > 1 ? (
            <Card className="overflow-hidden border-indigo-200 dark:border-indigo-900">
              <CardHeader className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><GitCompareArrows className="h-5 w-5 text-indigo-600" />So sánh hai mốc phân tích</CardTitle>
                    <CardDescription className="mt-1">Chọn mốc gốc, chọn mốc mới, rồi bấm so sánh. Kết quả sẽ xuất hiện ngay bên dưới.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">1</span>
                    Chọn mốc
                    <span className="h-px w-5 bg-slate-300 dark:bg-slate-700" />
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">2</span>
                    Xem thay đổi
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl bg-indigo-50/70 p-4 dark:bg-indigo-950/20">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mốc gốc</span>
                      <select
                        value={firstId}
                        onChange={(event) => setFirstId(event.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-900"
                      >
                        <option value="">Chọn mốc gốc</option>
                        {snapshots.map((snapshot, index) => (
                          <option key={snapshot.id} value={snapshot.id} disabled={snapshot.id === secondId}>
                            {snapshotLabel(snapshot, Math.max(0, snapshotTotal - index - 1))}{snapshot.pipelineVersion ? ` · Pipeline ${snapshot.pipelineVersion}` : ''}{index === 0 ? ' · Phiên bản hiện tại' : ' · Phiên bản cũ'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="hidden h-11 items-center text-slate-400 md:flex">→</div>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mốc mới</span>
                      <select
                        value={secondId}
                        onChange={(event) => setSecondId(event.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-900"
                      >
                        <option value="">Chọn mốc mới</option>
                        {snapshots.map((snapshot, index) => (
                          <option key={snapshot.id} value={snapshot.id} disabled={snapshot.id === firstId}>
                            {snapshotLabel(snapshot, Math.max(0, snapshotTotal - index - 1))}{snapshot.pipelineVersion ? ` · Pipeline ${snapshot.pipelineVersion}` : ''}{index === 0 ? ' · Phiên bản hiện tại' : ' · Phiên bản cũ'}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 border-t border-indigo-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-indigo-900/60">
                    <p className={`text-sm ${pairIsComparable ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                      {pairHint}
                    </p>
                    <Button className="min-w-48 shadow-sm" onClick={compareSnapshots} isLoading={isComparing} disabled={!pairIsComparable || isComparing}>
                      <GitCompareArrows className="mr-2 h-4 w-4" />So sánh thay đổi
                    </Button>
                  </div>
                </div>

                {activeComparison ? <>
                <div ref={comparisonResultRef} className="scroll-mt-24 border-t border-slate-200 pt-5 dark:border-slate-800">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Kết quả so sánh</p>
                      <p className="text-xs text-slate-500">Thay đổi được tính từ mốc gốc đến mốc mới.</p>
                    </div>
                    <Badge variant={manualComparison ? 'success' : 'info'}>{manualComparison ? 'Vừa cập nhật' : 'So sánh gần nhất'}</Badge>
                  </div>
                <div className={`grid gap-3 ${activeComparison.comparableSkillScores === false ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-5'}`}>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Điểm từ mốc gốc → mốc mới</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {formatReadinessScore(activeComparison.firstSnapshot?.overallScore)} → {formatReadinessScore(activeComparison.latestSnapshot?.overallScore)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {levelLabel(activeComparison.delta?.fromLevel || activeComparison.firstSnapshot?.userLevel)} → {levelLabel(activeComparison.delta?.toLevel || activeComparison.latestSnapshot?.userLevel)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Điểm thay đổi</p>
                    <p className={`mt-2 text-2xl font-semibold ${overallChange > 0 ? 'text-emerald-600' : overallChange < 0 ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
                      {formatReadinessDelta(readinessDelta)} điểm
                    </p>
                  </div>
                  {activeComparison.comparableSkillScores !== false && <>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Kỹ năng tăng</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-600">{activeComparison?.skillComparisonSummary.improvedCount ?? skillGroups.improved.length}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Kỹ năng ổn định</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">{activeComparison?.skillComparisonSummary.unchangedCount ?? skillGroups.unchanged.length}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Kỹ năng giảm</p>
                    <p className="mt-2 text-2xl font-semibold text-red-600">{activeComparison?.skillComparisonSummary.regressedCount ?? skillGroups.weaker.length}</p>
                  </div>
                  </>}
                </div>
                </div>

                {(activeComparison.comparisonMode === 'score_only' || activeComparison.warnings.length > 0) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="font-medium">Chỉ có thể so sánh điểm và trình độ</p>
                    <p className="mt-1">{activeComparison.warnings[0] || 'Hai snapshot sử dụng cách tính điểm khác nhau, nên thay đổi ở cấp kỹ năng không đủ tin cậy để hiển thị.'}</p>
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                  {activeComparison?.summary || activeComparison?.skillComparisonText || changeAssessment(overallChange)}
                  {hasProvenNonSkillRegression && (
                    <p className="mt-2 text-amber-700 dark:text-amber-300">
                      Điểm tổng còn chịu ảnh hưởng bởi các thành phần khác ngoài kỹ năng; breakdown ghi nhận ít nhất một thành phần đang giảm.
                    </p>
                  )}
                </div>

                {activeComparison.comparableSkillScores !== false && <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Tăng</p>
                    <div className="space-y-2">
                      {skillGroups.improved.length ? skillGroups.improved.map((skill) => (
                        <div key={skillName(skill)} className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                          {skillName(skill)} {skill.delta !== undefined && <span className="font-medium">({formatReadinessDelta(skill.delta)} điểm)</span>}
                        </div>
                      )) : <p className="text-sm text-slate-500">Chưa có kỹ năng tăng rõ.</p>}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Ổn định</p>
                    <div className="space-y-2">
                      {skillGroups.unchanged.length ? skillGroups.unchanged.map((skill) => (
                        <div key={skillName(skill)} className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {skillName(skill)}
                        </div>
                      )) : <p className="text-sm text-slate-500">Chưa có kỹ năng ổn định nổi bật.</p>}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Giảm</p>
                    <div className="space-y-2">
                      {skillGroups.weaker.length ? skillGroups.weaker.map((skill) => (
                        <div key={skillName(skill)} className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
                          {skillName(skill)} {skill.delta !== undefined && <span className="font-medium">({formatReadinessDelta(skill.delta)} điểm)</span>}
                        </div>
                      )) : <p className="text-sm text-slate-500">Chưa có kỹ năng giảm rõ.</p>}
                    </div>
                  </div>
                </div>}

                {activeComparison.comparableSkillScores !== false && activeComparison.newSkills.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Kỹ năng mới</p>
                    <div className="flex flex-wrap gap-2">
                      {activeComparison.newSkills.map((skill) => (
                        <Badge key={skillName(skill)} variant="success">{skillName(skill)}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {activeComparison.comparableSkillScores !== false && (activeComparison?.resolvedMissingSkills.length || activeComparison?.newMissingSkills.length) ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Đã bổ sung</p>
                      <MissingSkillList items={activeComparison.resolvedMissingSkills} />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Mới còn thiếu</p>
                      <MissingSkillList items={activeComparison.newMissingSkills} />
                    </div>
                  </div>
                ) : null}

                {activeComparison.comparableSkillScores !== false && activeComparison?.skillChanges.length ? (
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Chi tiết kỹ năng thay đổi</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {activeComparison.skillChanges.slice(0, MAX_SKILL_CHANGES).map((skill) => (
                        <div key={`${skillName(skill)}-${skill.category}`} className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900 dark:text-slate-100">{skillName(skill)}</p>
                              <p className="truncate text-xs text-slate-500">{skill.category || 'Kỹ năng'}</p>
                            </div>
                            <Badge variant={trendVariant(skill.trend || skill.status)}>{trendLabel(skill.trend || skill.status)}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            {formatReadinessScore(skill.fromScore ?? skill.beforePercent)} → {formatReadinessScore(skill.toScore ?? skill.afterPercent)}
                            {skill.delta !== undefined && ` (${formatReadinessDelta(skill.delta)})`}
                          </p>
                        </div>
                      ))}
                    </div>
                    {activeComparison.skillChanges.length > MAX_SKILL_CHANGES && (
                      <p className="mt-3 text-xs text-slate-500">Còn {activeComparison.skillChanges.length - MAX_SKILL_CHANGES} kỹ năng khác trong dữ liệu so sánh.</p>
                    )}
                  </div>
                ) : null}
                </> : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    {manualComparison?.comparisonStatus === 'incompatible_snapshot_versions'
                      ? 'Hai mốc sử dụng phiên bản phân tích khác nhau nên không thể so sánh kỹ năng trực tiếp.'
                      : insufficientComparison
                        ? snapshotTotal >= 2
                          ? 'Có nhiều mốc phân tích nhưng chưa có đủ hai mốc tương thích để so sánh tự động. Bạn vẫn có thể xem chi tiết từng mốc hoặc thử so sánh thủ công.'
                          : compatibleSnapshotCount === 1
                          ? 'Snapshot mới đã được ghi nhận ở ô “Mốc mới”. Hiện chỉ có 1 snapshot cùng phiên bản pipeline; cần phân tích lại thêm một lần sau khi repository có thay đổi để tạo mốc gốc tương thích.'
                          : baselineComparison.message || 'Cần ít nhất hai snapshot tương thích để so sánh tiến độ.'
                        : 'Chọn hai snapshot tương thích để so sánh.'}
                    {insufficientComparison && <div className="mt-3"><Link to={`/repositories/${repositoryId}`}><Button size="sm" variant="outline">Phân tích lại repository</Button></Link></div>}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Cần thêm mốc phân tích</CardTitle>
                <CardDescription>
                  Hiện chỉ có một snapshot. Sau lần phân tích tiếp theo, trang này sẽ hiển thị thay đổi điểm và kỹ năng giữa hai mốc.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
