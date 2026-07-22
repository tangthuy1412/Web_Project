import { useEffect, useState } from 'react'
import { BookOpen, ExternalLink, RefreshCw } from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import { useCourseRecommendationStore } from '../stores/courseRecommendationStore'
import type { CourseraCourseRecommendation } from '../types/courseRecommendations'
import { isAllowedCourseraUrl } from '../utils/courseraUrl'

interface Props {
  roadmapId: string
}

const readableLabel = (value: string) => value
  .split('_')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ')

const CourseThumbnail = ({ course }: { course: CourseraCourseRecommendation }) => {
  const [hasImageError, setHasImageError] = useState(false)
  const thumbnailUrl = typeof course.thumbnailUrl === 'string' ? course.thumbnailUrl.trim() : ''
  const fallbackUrl = '/coursera-fallback.svg'
  const imageUrl = thumbnailUrl && !hasImageError ? thumbnailUrl : fallbackUrl

  useEffect(() => {
    setHasImageError(false)
  }, [thumbnailUrl])

  return (
    <div className="aspect-[16/9] overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
      <img
        src={imageUrl}
        alt={thumbnailUrl && !hasImageError ? `Ảnh khóa học ${course.title}` : 'Coursera'}
        loading="lazy"
        onError={() => {
          if (imageUrl !== fallbackUrl) setHasImageError(true)
        }}
        className="h-full w-full object-cover"
      />
    </div>
  )
}

const CourseCard = ({ course }: { course: CourseraCourseRecommendation }) => {
  const hasAllowedUrl = isAllowedCourseraUrl(course.url)
  const openCourse = () => {
    if (!hasAllowedUrl) return
    window.open(course.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/50">
      <CourseThumbnail course={course} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="info">{readableLabel(course.contentType) || 'Course'}</Badge>
        {course.level && <Badge>{readableLabel(course.level)}</Badge>}
      </div>
      <h3 className="mt-3 text-base font-semibold leading-6 text-slate-950 dark:text-slate-50">{course.title}</h3>
      {course.partnerName && <p className="mt-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">{course.partnerName}</p>}
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{course.description || 'Coursera chưa cung cấp mô tả cho khóa học này.'}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        {course.estimatedDuration && <span>Thời lượng: {course.estimatedDuration}</span>}
        {course.language && <span>Ngôn ngữ: {course.language.toUpperCase()}</span>}
      </div>
      <div className="mt-auto pt-5">
        <Button className="w-full whitespace-nowrap" variant="outline" disabled={!hasAllowedUrl} onClick={openCourse} aria-label={`Xem khóa học ${course.title} trên Coursera`}>
          Xem khóa học trên Coursera
          <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  )
}

export const CourseraRecommendationSection = ({ roadmapId }: Props) => {
  const normalizedRoadmapId = roadmapId.trim()
  const entry = useCourseRecommendationStore((state) => state.entriesByRoadmapId[normalizedRoadmapId])
  const fetchCourseRecommendations = useCourseRecommendationStore((state) => state.fetchCourseRecommendations)
  const retryCourseRecommendations = useCourseRecommendationStore((state) => state.retryCourseRecommendations)

  useEffect(() => {
    if (normalizedRoadmapId) void fetchCourseRecommendations(normalizedRoadmapId)
  }, [fetchCourseRecommendations, normalizedRoadmapId])

  return (
    <section aria-labelledby="coursera-recommendations-heading">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300" aria-hidden="true">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle id="coursera-recommendations-heading">Khóa học tham khảo trên Coursera</CardTitle>
              <CardDescription className="mt-1">Các khóa học bên ngoài được đề xuất theo toàn bộ lộ trình của bạn.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(!entry || entry.status === 'idle' || entry.status === 'loading') && (
            <div role="status" aria-label="Đang tải khóa học Coursera" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} aria-hidden="true" className="animate-pulse rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="aspect-[16/9] rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-3 h-3 w-full rounded bg-slate-100 dark:bg-slate-900" />
                </div>
              ))}
            </div>
          )}

          {entry?.status === 'error' && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <div>
                <p className="font-medium">Không thể tải khóa học Coursera lúc này.</p>
                {entry.error && <p className="mt-1 text-xs opacity-80">{entry.error}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => retryCourseRecommendations(normalizedRoadmapId)}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />Thử lại
              </Button>
            </div>
          )}

          {entry?.status === 'success' && entry.data?.courses.length === 0 && (
            <p role="status" className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Chưa có khóa học Coursera phù hợp.
            </p>
          )}

          {entry?.status === 'success' && Boolean(entry.data?.courses.length) && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {entry.data?.courses.map((course, index) => <CourseCard key={`${course.url || course.title}-${index}`} course={course} />)}
            </div>
          )}

          <div className="mt-5 space-y-1 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <p>Đây là tài nguyên học bổ sung. Tiến độ học trên Coursera không được đồng bộ với tiến độ roadmap trong ứng dụng.</p>
            <p>Khóa học có thể miễn phí hoặc trả phí tùy theo Coursera.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
