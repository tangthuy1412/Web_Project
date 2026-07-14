import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { useRepositoryStore } from '../../stores/repositoryStore'

export const AnalysisResultPage = () => {
  const { id = '' } = useParams()
  const { analyses, fetchAnalysis, fetchMyAnalyses } = useRepositoryStore()
  const [hasLoaded, setHasLoaded] = useState(false)
  const analysis = useMemo(
    () => analyses.find((item) => item.id === id || item.repositoryId === id),
    [analyses, id]
  )

  useEffect(() => {
    let isCurrent = true

    const resolveRepository = async () => {
      await fetchMyAnalyses().catch(() => undefined)
      if (!useRepositoryStore.getState().analyses.some((item) => item.id === id || item.repositoryId === id)) {
        await fetchAnalysis(id).catch(() => undefined)
      }
      if (isCurrent) setHasLoaded(true)
    }

    void resolveRepository()
    return () => { isCurrent = false }
  }, [fetchAnalysis, fetchMyAnalyses, id])

  if (!analysis && !hasLoaded) {
    return <div className="text-sm text-slate-500">Đang mở chi tiết dự án...</div>
  }

  return <Navigate to={`/repositories/${analysis?.repositoryId || id}`} replace />
}
