import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, GitCompareArrows, History, RefreshCw } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { getApiErrorMessage } from '../../services/apis/apiClient'
import { type AnalysisSnapshot, snapshotApi, type SnapshotComparison, type SnapshotScoreChange } from '../../services/apis/snapshotApi'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatDate } from '../../lib/utils'

const metrics: Array<[keyof Pick<AnalysisSnapshot, 'techStackScore' | 'documentationScore' | 'commitQualityScore' | 'testingScore' | 'deploymentScore' | 'portfolioReadinessScore'>, string]> = [
  ['techStackScore', 'Tech stack'], ['documentationScore', 'Tài liệu'], ['commitQualityScore', 'Commit'],
  ['testingScore', 'Testing'], ['deploymentScore', 'Triển khai'], ['portfolioReadinessScore', 'Portfolio']
]

const score = (value: number | undefined) => Math.max(0, Math.min(100, Math.round(value ?? 0)))
const changeLabel = (value: number) => `${value > 0 ? '+' : ''}${Math.round(value)} điểm`

export const RepositoryProgressPage = () => {
  const { repositories, fetchRepositories } = useRepositoryStore()
  const [repositoryId, setRepositoryId] = useState('')
  const [snapshots, setSnapshots] = useState<AnalysisSnapshot[]>([])
  const [baseline, setBaseline] = useState<SnapshotComparison | null>(null)
  const [comparison, setComparison] = useState<SnapshotComparison | null>(null)
  const [firstId, setFirstId] = useState('')
  const [secondId, setSecondId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void fetchRepositories().catch(() => undefined) }, [fetchRepositories])
  useEffect(() => { if (!repositoryId && repositories.length) setRepositoryId(repositories[0].id) }, [repositories, repositoryId])

  const load = async () => {
    if (!repositoryId) return
    setIsLoading(true)
    setError(null)
    setComparison(null)
    try {
      const history = await snapshotApi.getSnapshots(repositoryId)
      const progress = history.length > 1
        ? await snapshotApi.getProgressComparison(repositoryId).catch(() => null)
        : null
      const ordered = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      const latestDetail = ordered.at(-1)
        ? await snapshotApi.getSnapshot(ordered.at(-1)!.id).catch(() => null)
        : null
      const hydratedSnapshots = latestDetail
        ? ordered.map((snapshot) => snapshot.id === latestDetail.id ? latestDetail : snapshot)
        : ordered
      setSnapshots(hydratedSnapshots)
      setBaseline(progress)
      setFirstId(hydratedSnapshots[0]?.id ?? '')
      setSecondId(hydratedSnapshots.at(-1)?.id ?? '')
    } catch (requestError) {
      setSnapshots([])
      setBaseline(null)
      setError(getApiErrorMessage(requestError))
    } finally { setIsLoading(false) }
  }

  useEffect(() => {
    void load()
    // Snapshot data only changes when the selected repository changes or the user refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositoryId])

  const compare = async () => {
    if (!firstId || !secondId || firstId === secondId) return
    setIsComparing(true)
    setError(null)
    try { setComparison(await snapshotApi.compareSnapshots(firstId, secondId)) }
    catch (requestError) { setError(getApiErrorMessage(requestError)) }
    finally { setIsComparing(false) }
  }

  const chartData = useMemo(() => snapshots.map((snapshot, index) => ({
    label: snapshot.createdAt ? formatDate(snapshot.createdAt) : `Mốc ${index + 1}`,
    score: score(snapshot.overallScore)
  })), [snapshots])
  const activeComparison = comparison ?? baseline
  const first = activeComparison?.firstSnapshot ?? snapshots[0] ?? null
  const latest = activeComparison?.latestSnapshot ?? snapshots.at(-1) ?? null
  const overallChange = activeComparison?.overallChange ?? (latest?.overallScore ?? 0) - (first?.overallScore ?? 0)
  const metricChanges: SnapshotScoreChange[] = activeComparison?.scoreChanges.length
    ? activeComparison.scoreChanges.filter((item) => item.key !== 'overallScore')
    : metrics.map(([key, label]) => ({ key, label, before: first?.[key] ?? 0, after: latest?.[key] ?? 0, change: (latest?.[key] ?? 0) - (first?.[key] ?? 0), status: 'unchanged' }))

  return <div className="max-w-7xl space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Tiến độ repository</h1><p className="mt-1 text-slate-500 dark:text-slate-400">Theo dõi thay đổi giữa các lần phân tích của từng repository.</p></div>
      <div className="flex w-full gap-2 lg:w-auto">
        <select value={repositoryId} onChange={(event) => setRepositoryId(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 lg:w-80">
          {repositories.length === 0 ? <option value="">Chưa có repository</option> : repositories.map((repository) => <option key={repository.id} value={repository.id}>{repository.fullName || repository.name}</option>)}
        </select>
        <Button variant="outline" onClick={load} isLoading={isLoading} disabled={!repositoryId} title="Tải lại snapshot"><RefreshCw className="h-4 w-4" /></Button>
      </div>
    </div>

    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

    {!isLoading && snapshots.length === 0 && !error ? <Card><CardContent className="p-10 text-center text-sm text-slate-500">Repository này chưa có snapshot. Hãy phân tích lại repository để tạo mốc theo dõi đầu tiên.</CardContent></Card> : <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Snapshot đầu tiên</p><p className="mt-2 text-3xl font-bold">{first ? score(first.overallScore) : '-'}</p><p className="mt-1 text-xs text-slate-500">{first?.createdAt ? formatDate(first.createdAt) : 'Chưa có dữ liệu'}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Snapshot gần nhất</p><p className="mt-2 text-3xl font-bold">{latest ? score(latest.overallScore) : '-'}</p><p className="mt-1 text-xs text-slate-500">{latest?.createdAt ? formatDate(latest.createdAt) : 'Chưa có dữ liệu'}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Thay đổi tổng quan</p><div className="mt-2 flex items-center gap-2"><p className={`text-3xl font-bold ${overallChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{changeLabel(overallChange)}</p>{overallChange >= 0 ? <ArrowUpRight className="h-5 w-5 text-emerald-600" /> : <ArrowDownRight className="h-5 w-5 text-red-600" />}</div><p className="mt-1 text-xs text-slate-500">Giữa hai snapshot đang so sánh</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Diễn biến điểm tổng quan</CardTitle><CardDescription>Mỗi điểm là một lần repository được phân tích và lưu snapshot.</CardDescription></CardHeader><CardContent>{chartData.length ? <ResponsiveContainer width="100%" height={280}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} /><YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="score" name="Điểm tổng quan" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer> : <p className="text-sm text-slate-500">Đang tải lịch sử snapshot...</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Lịch sử</CardTitle></CardHeader><CardContent><div className="max-h-72 space-y-2 overflow-y-auto pr-1">{snapshots.map((snapshot, index) => <div key={snapshot.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800"><div><p className="text-sm font-medium">Mốc {index + 1}</p><p className="text-xs text-slate-500">{snapshot.createdAt ? formatDate(snapshot.createdAt) : 'Không rõ thời gian'}</p></div><Badge variant="info">{score(snapshot.overallScore)}</Badge></div>)}</div></CardContent></Card>
      </div>

      {snapshots.length > 1 ? <Card><CardHeader><CardTitle className="flex items-center gap-2"><GitCompareArrows className="h-5 w-5" />So sánh hai snapshot</CardTitle><CardDescription>Chọn hai lần phân tích để xem thay đổi điểm theo từng tiêu chí.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><select value={firstId} onChange={(event) => setFirstId(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">{snapshots.map((snapshot, index) => <option key={snapshot.id} value={snapshot.id}>Mốc {index + 1} · {snapshot.createdAt ? formatDate(snapshot.createdAt) : snapshot.id}</option>)}</select><select value={secondId} onChange={(event) => setSecondId(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">{snapshots.map((snapshot, index) => <option key={snapshot.id} value={snapshot.id}>Mốc {index + 1} · {snapshot.createdAt ? formatDate(snapshot.createdAt) : snapshot.id}</option>)}</select><Button onClick={compare} isLoading={isComparing} disabled={snapshots.length < 2 || firstId === secondId}><GitCompareArrows className="mr-2 h-4 w-4" />So sánh</Button></div>
        {first && latest && <div className="grid gap-3 md:grid-cols-2">{metricChanges.map((item) => <div key={item.key} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{item.label}</p><span className={item.change >= 0 ? 'text-sm font-semibold text-emerald-600' : 'text-sm font-semibold text-red-600'}>{changeLabel(item.change)}</span></div><p className="mt-2 text-sm text-slate-500">Trước: {score(item.before)} · Sau: {score(item.after)}</p></div>)}</div>}
        {activeComparison?.summary && <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{activeComparison.summary}</p>}
        {(activeComparison?.topImprovedSkills.length || activeComparison?.remainingMissingSkills.length) ? <div className="grid gap-4 md:grid-cols-2"><div><p className="mb-2 text-sm font-medium">Kỹ năng cải thiện nổi bật</p><div className="flex flex-wrap gap-2">{activeComparison?.topImprovedSkills.slice(0, 5).map((skill) => <Badge key={skill.skill} variant="success">{skill.skill}{skill.changePercent ? ` +${skill.changePercent}%` : ''}</Badge>)}</div></div><div><p className="mb-2 text-sm font-medium">Cần ưu tiên bổ sung</p><div className="flex flex-wrap gap-2">{activeComparison?.remainingMissingSkills.map((skill) => <Badge key={skill} variant="warning">{skill}</Badge>)}</div></div></div> : null}
        {activeComparison && <div className="grid gap-4 border-t border-slate-200 pt-5 dark:border-slate-800 md:grid-cols-2"><div><p className="mb-2 text-sm font-medium">Checklist repository</p><div className="flex flex-wrap gap-2">{activeComparison.alreadyPresentChecklist.map((item) => <Badge key={item} variant="success">{item}</Badge>)}{activeComparison.stillMissingChecklist.map((item) => <Badge key={item} variant="warning">Thiếu {item}</Badge>)}</div></div><div><p className="mb-2 text-sm font-medium">Tổng quan kỹ năng</p><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900"><p className="text-lg font-semibold">{activeComparison.skillComparisonSummary.improvedCount}</p><p className="text-xs text-slate-500">cải thiện</p></div><div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900"><p className="text-lg font-semibold">{activeComparison.skillComparisonSummary.resolvedMissingCount}</p><p className="text-xs text-slate-500">đã bổ sung</p></div><div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900"><p className="text-lg font-semibold">{activeComparison.skillComparisonSummary.remainingMissingCount}</p><p className="text-xs text-slate-500">còn thiếu</p></div></div>{activeComparison.skillComparisonText && <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{activeComparison.skillComparisonText}</p>}</div></div>}
      </CardContent></Card> : <Card><CardHeader><CardTitle>Chi tiết snapshot hiện tại</CardTitle><CardDescription>Chạy phân tích lại sau khi cập nhật code để tạo snapshot tiếp theo và bắt đầu so sánh tiến độ.</CardDescription></CardHeader><CardContent className="space-y-5">{latest && <><div className="flex flex-wrap gap-2">{latest.careerDirection && <Badge variant="info">{latest.careerDirection}</Badge>}{latest.missingSkills.map((skill) => <Badge key={skill} variant="warning">Thiếu {skill}</Badge>)}</div><div className="grid gap-3 md:grid-cols-2">{metrics.map(([key, label]) => <div key={key} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800"><p className="text-sm font-medium">{label}</p><p className="text-lg font-semibold">{score(latest[key])}</p></div>)}</div></>}</CardContent></Card>}
    </>}
  </div>
}
