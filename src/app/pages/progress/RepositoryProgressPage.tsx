import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, CheckCircle2, GitCompareArrows, History, MinusCircle, RefreshCw, XCircle } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { getApiErrorMessage } from '../../services/apis/core'
import { type AnalysisSnapshot, snapshotApi, type SnapshotComparison, type SnapshotScoreChange } from '../../services/apis/progress'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatDate } from '../../lib/utils'

type MetricKey = keyof Pick<AnalysisSnapshot, 'techStackScore' | 'documentationScore' | 'commitQualityScore' | 'testingScore' | 'deploymentScore' | 'portfolioReadinessScore'>
const COMPARISON_LIST_LIMIT = 5
const CHECKLIST_LIMIT = 6

const metrics: Array<{ key: MetricKey; label: string; description: string }> = [
  { key: 'techStackScore', label: 'Tech stack', description: 'Công nghệ, framework và cấu trúc dự án có phù hợp với định hướng nghề nghiệp hay không.' },
  { key: 'documentationScore', label: 'Tài liệu', description: 'README, hướng dẫn chạy dự án, mô tả tính năng và cấu hình môi trường.' },
  { key: 'commitQualityScore', label: 'Commit', description: 'Chất lượng lịch sử commit, cách đặt message và nhịp phát triển của repository.' },
  { key: 'testingScore', label: 'Testing', description: 'Mức độ có kiểm thử và khả năng chứng minh chất lượng code.' },
  { key: 'deploymentScore', label: 'Triển khai', description: 'Dấu hiệu sẵn sàng deploy như build, env mẫu, CI/CD hoặc hướng dẫn triển khai.' },
  { key: 'portfolioReadinessScore', label: 'Portfolio', description: 'Mức độ repository có thể dùng để trình bày năng lực trong CV hoặc phỏng vấn.' }
]

const score = (value: number | undefined) => Math.max(0, Math.min(100, Math.round(value ?? 0)))
const changeLabel = (value: number) => `${value > 0 ? '+' : ''}${Math.round(value)} điểm`

const getScoreLabel = (value: number | undefined) => {
  const current = score(value)
  if (current >= 80) return 'Tốt'
  if (current >= 65) return 'Ổn'
  if (current >= 45) return 'Cần cải thiện'
  return 'Yếu'
}

const getOverallDescription = (value: number | undefined) => {
  const current = score(value)
  if (current >= 80) return 'Repo đang khá sẵn sàng để đưa vào portfolio hoặc dùng làm minh chứng năng lực.'
  if (current >= 65) return 'Repo có nền tảng ổn, nên bổ sung thêm tài liệu, test hoặc phần triển khai để thuyết phục hơn.'
  if (current >= 45) return 'Repo đã có tín hiệu kỹ thuật nhưng còn thiếu một số phần quan trọng để thể hiện năng lực rõ ràng.'
  return 'Repo cần được hoàn thiện thêm về cấu trúc, tài liệu và các bằng chứng chất lượng trước khi dùng để đánh giá năng lực.'
}

const getChangeDescription = (value: number) => {
  if (value > 0) return 'Snapshot mới cho thấy repository đã tiến bộ so với mốc trước.'
  if (value < 0) return 'Một số tiêu chí đang giảm, nên kiểm tra lại các phần bị mất điểm sau lần phân tích mới.'
  return 'Điểm tổng quan chưa thay đổi. Repo có thể chưa có thay đổi đáng kể hoặc các cải thiện chưa tác động đến tiêu chí chấm điểm.'
}

const getMetricStatus = (change: number) => {
  if (change > 0) return { label: 'Cải thiện', variant: 'success' as const, icon: ArrowUpRight }
  if (change < 0) return { label: 'Giảm', variant: 'danger' as const, icon: ArrowDownRight }
  return { label: 'Không đổi', variant: 'default' as const, icon: MinusCircle }
}

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
    : metrics.map(({ key, label }) => {
      const before = first?.[key] ?? 0
      const after = latest?.[key] ?? 0
      const change = after - before

      return { key, label, before, after, change, status: change > 0 ? 'improved' : change < 0 ? 'regressed' : 'unchanged' }
    })
  const changedMetrics = metricChanges.filter((item) => item.change !== 0)
  const unchangedMetrics = metricChanges.filter((item) => item.change === 0)

  return <div className="max-w-7xl space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Tiến độ repository</h1><p className="mt-1 text-slate-500 dark:text-slate-400">Theo dõi snapshot phân tích, mức độ sẵn sàng của repo và thay đổi sau mỗi lần phân tích lại.</p></div>
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
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Thay đổi tổng quan</p><div className="mt-2 flex items-center gap-2"><p className={`text-3xl font-bold ${overallChange > 0 ? 'text-emerald-600' : overallChange < 0 ? 'text-red-600' : 'text-slate-700 dark:text-slate-200'}`}>{changeLabel(overallChange)}</p>{overallChange > 0 ? <ArrowUpRight className="h-5 w-5 text-emerald-600" /> : overallChange < 0 ? <ArrowDownRight className="h-5 w-5 text-red-600" /> : <MinusCircle className="h-5 w-5 text-slate-500" />}</div><p className="mt-1 text-xs text-slate-500">{snapshots.length > 1 ? 'Giữa hai snapshot đang so sánh' : 'Cần thêm snapshot để so sánh'}</p></CardContent></Card>
      </div>

      {latest && <Card><CardHeader><CardTitle>Đánh giá snapshot mới nhất</CardTitle><CardDescription>Repo hiện ở mức {getScoreLabel(latest.overallScore).toLowerCase()} với điểm tổng quan {score(latest.overallScore)}.</CardDescription></CardHeader><CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{getOverallDescription(latest.overallScore)}</p>{latest.careerDirection && <Badge className="mt-3" variant="info">{latest.careerDirection}</Badge>}</div><div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"><p className="text-sm font-medium">Kỹ năng còn thiếu</p>{latest.missingSkills.length ? <div className="mt-3 space-y-2">{latest.missingSkills.slice(0, 5).map((skill) => <div key={skill} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>{skill}</span></div>)}</div> : <p className="mt-2 text-sm text-slate-500">Chưa phát hiện kỹ năng thiếu nổi bật trong snapshot này.</p>}</div></CardContent></Card>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Diễn biến điểm tổng quan</CardTitle><CardDescription>Mỗi điểm là một lần repository được phân tích và lưu snapshot.</CardDescription></CardHeader><CardContent>{chartData.length ? <ResponsiveContainer width="100%" height={280}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} /><YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="score" name="Điểm tổng quan" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer> : <p className="text-sm text-slate-500">Đang tải lịch sử snapshot...</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Lịch sử</CardTitle></CardHeader><CardContent><div className="max-h-72 space-y-2 overflow-y-auto pr-1">{snapshots.map((snapshot, index) => <div key={snapshot.id} className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Mốc {index + 1}</p><p className="text-xs text-slate-500">{snapshot.createdAt ? formatDate(snapshot.createdAt) : 'Không rõ thời gian'}</p></div><Badge variant="info">{score(snapshot.overallScore)}</Badge></div><p className="mt-2 text-xs leading-5 text-slate-500">{getScoreLabel(snapshot.overallScore)} - {getOverallDescription(snapshot.overallScore)}</p></div>)}</div></CardContent></Card>
      </div>

      {snapshots.length > 1 ? <Card><CardHeader><CardTitle className="flex items-center gap-2"><GitCompareArrows className="h-5 w-5" />So sánh hai snapshot</CardTitle><CardDescription>Chọn hai lần phân tích để xem thay đổi điểm theo từng tiêu chí.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><select value={firstId} onChange={(event) => setFirstId(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">{snapshots.map((snapshot, index) => <option key={snapshot.id} value={snapshot.id}>Mốc {index + 1} · {snapshot.createdAt ? formatDate(snapshot.createdAt) : snapshot.id}</option>)}</select><select value={secondId} onChange={(event) => setSecondId(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">{snapshots.map((snapshot, index) => <option key={snapshot.id} value={snapshot.id}>Mốc {index + 1} · {snapshot.createdAt ? formatDate(snapshot.createdAt) : snapshot.id}</option>)}</select><Button onClick={compare} isLoading={isComparing} disabled={snapshots.length < 2 || firstId === secondId}><GitCompareArrows className="mr-2 h-4 w-4" />So sánh</Button></div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60"><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Nhận xét thay đổi</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{activeComparison?.summary || getChangeDescription(overallChange)}</p></div>
        {first && latest && <div className="grid gap-3 md:grid-cols-2">{metricChanges.map((item) => {
          const status = getMetricStatus(item.change)
          const Icon = status.icon
          const metric = metrics.find((entry) => entry.key === item.key)

          return <div key={item.key} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{item.label || metric?.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{metric?.description}</p></div><Badge variant={status.variant} className="shrink-0"><Icon className="mr-1 h-3 w-3" />{status.label}</Badge></div><div className="mt-3 flex items-center justify-between text-sm"><span className="text-slate-500">Trước {score(item.before)} · Sau {score(item.after)}</span><span className={item.change > 0 ? 'font-semibold text-emerald-600' : item.change < 0 ? 'font-semibold text-red-600' : 'font-semibold text-slate-500'}>{changeLabel(item.change)}</span></div></div>
        })}</div>}
        <div className="grid gap-4 md:grid-cols-3"><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"><div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />Có cải thiện</div><p className="mt-2 text-2xl font-semibold text-emerald-700 dark:text-emerald-300">{changedMetrics.filter((item) => item.change > 0).length}</p></div><div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60"><div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"><MinusCircle className="h-4 w-4" />Không đổi</div><p className="mt-2 text-2xl font-semibold text-slate-700 dark:text-slate-200">{unchangedMetrics.length}</p></div><div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20"><div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300"><XCircle className="h-4 w-4" />Bị giảm</div><p className="mt-2 text-2xl font-semibold text-red-700 dark:text-red-300">{changedMetrics.filter((item) => item.change < 0).length}</p></div></div>
        {(activeComparison?.topImprovedSkills.length || activeComparison?.remainingMissingSkills.length || activeComparison?.resolvedMissingSkills.length) ? <div className="grid gap-4 md:grid-cols-3"><div><p className="mb-2 text-sm font-medium">Kỹ năng cải thiện nổi bật</p><div className="space-y-2">{activeComparison?.topImprovedSkills.slice(0, COMPARISON_LIST_LIMIT).map((skill) => <div key={skill.skill} className="rounded-md bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900">{skill.skill}{skill.changePercent ? <span className="ml-2 text-emerald-600">+{skill.changePercent}%</span> : null}</div>)}{activeComparison && activeComparison.topImprovedSkills.length > COMPARISON_LIST_LIMIT && <p className="text-xs text-slate-500">+{activeComparison.topImprovedSkills.length - COMPARISON_LIST_LIMIT} kỹ năng khác</p>}</div></div><div><p className="mb-2 text-sm font-medium">Đã bổ sung</p><div className="space-y-2">{activeComparison?.resolvedMissingSkills.length ? activeComparison.resolvedMissingSkills.slice(0, COMPARISON_LIST_LIMIT).map((skill) => <div key={skill} className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">{skill}</div>) : <p className="text-sm text-slate-500">Chưa có kỹ năng thiếu nào được ghi nhận là đã bổ sung.</p>}{activeComparison && activeComparison.resolvedMissingSkills.length > COMPARISON_LIST_LIMIT && <p className="text-xs text-slate-500">+{activeComparison.resolvedMissingSkills.length - COMPARISON_LIST_LIMIT} kỹ năng khác</p>}</div></div><div><p className="mb-2 text-sm font-medium">Còn thiếu</p><div className="space-y-2">{activeComparison?.remainingMissingSkills.length ? activeComparison.remainingMissingSkills.slice(0, COMPARISON_LIST_LIMIT).map((skill) => <div key={skill} className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">{skill}</div>) : <p className="text-sm text-slate-500">Không có kỹ năng thiếu nổi bật trong dữ liệu so sánh.</p>}{activeComparison && activeComparison.remainingMissingSkills.length > COMPARISON_LIST_LIMIT && <p className="text-xs text-slate-500">+{activeComparison.remainingMissingSkills.length - COMPARISON_LIST_LIMIT} kỹ năng khác</p>}</div></div></div> : null}
        {activeComparison && <div className="grid gap-4 border-t border-slate-200 pt-5 dark:border-slate-800 md:grid-cols-2"><div><p className="mb-2 text-sm font-medium">Checklist repository</p><div className="grid gap-2">{activeComparison.alreadyPresentChecklist.slice(0, CHECKLIST_LIMIT).map((item) => <div key={item} className="flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Đã có: {item}</div>)}{activeComparison.stillMissingChecklist.slice(0, CHECKLIST_LIMIT).map((item) => <div key={item} className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/20 dark:text-amber-300"><XCircle className="mt-0.5 h-4 w-4 shrink-0" />Vẫn thiếu: {item}</div>)}{activeComparison.alreadyPresentChecklist.length + activeComparison.stillMissingChecklist.length > CHECKLIST_LIMIT * 2 && <p className="text-xs text-slate-500">Còn checklist khác trong dữ liệu so sánh.</p>}{!activeComparison.alreadyPresentChecklist.length && !activeComparison.stillMissingChecklist.length && <p className="text-sm text-slate-500">API chưa trả về checklist chi tiết cho lần so sánh này.</p>}</div></div><div><p className="mb-2 text-sm font-medium">Tổng quan kỹ năng</p><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900"><p className="text-lg font-semibold">{activeComparison.skillComparisonSummary.improvedCount}</p><p className="text-xs text-slate-500">cải thiện</p></div><div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900"><p className="text-lg font-semibold">{activeComparison.skillComparisonSummary.resolvedMissingCount}</p><p className="text-xs text-slate-500">đã bổ sung</p></div><div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900"><p className="text-lg font-semibold">{activeComparison.skillComparisonSummary.remainingMissingCount}</p><p className="text-xs text-slate-500">còn thiếu</p></div></div>{activeComparison.skillComparisonText && <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{activeComparison.skillComparisonText}</p>}</div></div>}
      </CardContent></Card> : <Card><CardHeader><CardTitle>Chi tiết điểm của snapshot hiện tại</CardTitle><CardDescription>Hiện mới có một snapshot, nên trang hiển thị đánh giá hiện trạng trước. Khi phân tích lại repo, hệ thống sẽ có thêm mốc để so sánh tiến độ.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{latest && metrics.map((metric) => <div key={metric.key} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{metric.label}</p><Badge variant={score(latest[metric.key]) >= 65 ? 'success' : 'warning'}>{score(latest[metric.key])}</Badge></div><p className="mt-2 text-xs leading-5 text-slate-500">{metric.description}</p></div>)}</CardContent></Card>}
    </>}
  </div>
}
