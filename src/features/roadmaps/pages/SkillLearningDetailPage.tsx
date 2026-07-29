import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  PlayCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import { cn } from '../../../app/lib/utils'
import { useLearningStore } from '../stores/learningStore'
import { useRoadmapStore } from '../stores/roadmapStore'

type TextBlock =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; code: string }

const stripInlineMarkdown = (value: string) =>
  value
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .trim()

const getYouTubeEmbedUrl = (value?: string) => {
  if (!value) return ''

  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase()
    let videoId = ''

    if (hostname === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] ?? ''
    } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtube-nocookie.com') {
      videoId = url.searchParams.get('v') ?? ''
      if (!videoId) {
        const pathParts = url.pathname.split('/').filter(Boolean)
        if (['embed', 'shorts', 'live'].includes(pathParts[0])) videoId = pathParts[1] ?? ''
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : ''
  } catch {
    return ''
  }
}

const isDirectVideoUrl = (value?: string) => Boolean(value && /\.(mp4|webm|ogg)(?:$|[?#])/i.test(value))

const cleanListItem = (value: string) =>
  stripInlineMarkdown(value.replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+[.)]\s+/, ''))

const stripCodeFence = (value: string) =>
  value
    .replace(/^```[a-zA-Z0-9_-]*\n?/, '')
    .replace(/```$/, '')
    .replace(/^[a-zA-Z0-9_-]+\\n/, '')
    .replace(/^[a-zA-Z0-9_-]+\n(?=(import|const|let|var|function|class|export|<|{|\/\/))/m, '')
    .trim()

const parseRichText = (text?: string): TextBlock[] => {
  if (!text?.trim()) return []

  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: TextBlock[] = []
  let paragraph: string[] = []
  let listItems: string[] = []
  let orderedItems: string[] = []
  let codeLines: string[] = []
  let inCode = false

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push({ type: 'paragraph', lines: paragraph.map(stripInlineMarkdown).filter(Boolean) })
    paragraph = []
  }

  const flushList = () => {
    if (listItems.length) blocks.push({ type: 'ul', items: listItems })
    if (orderedItems.length) blocks.push({ type: 'ol', items: orderedItems })
    listItems = []
    orderedItems = []
  }

  const flushCode = () => {
    if (!codeLines.length) return
    blocks.push({ type: 'code', code: stripCodeFence(codeLines.join('\n')) })
    codeLines = []
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      if (inCode) {
        inCode = false
        flushCode()
      } else {
        flushParagraph()
        flushList()
        inCode = true
      }
      return
    }

    if (inCode) {
      codeLines.push(line)
      return
    }

    if (!trimmed) {
      flushParagraph()
      flushList()
      return
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph()
      orderedItems = []
      listItems.push(cleanListItem(trimmed))
      return
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      flushParagraph()
      listItems = []
      orderedItems.push(cleanListItem(trimmed))
      return
    }

    flushList()
    paragraph.push(trimmed)
  })

  flushParagraph()
  flushList()
  flushCode()

  return blocks
}

const RichText = ({ text, emptyText = 'Chưa có nội dung.' }: { text?: string; emptyText?: string }) => {
  const blocks = useMemo(() => parseRichText(text), [text])

  if (!blocks.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
  }

  return (
    <div className="space-y-4 text-[15px] leading-7 text-slate-700 dark:text-slate-300">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return block.lines.map((line, lineIndex) => (
            <p key={`${index}-${lineIndex}`} className="max-w-[75ch] text-pretty">
              {line}
            </p>
          ))
        }

        if (block.type === 'ul') {
          return (
            <ul key={index} className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'ol') {
          return (
            <ol key={index} className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="grid grid-cols-[28px_1fr] gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {itemIndex + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          )
        }

        return (
          <pre key={index} className="max-w-full overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
            <code>{block.code}</code>
          </pre>
        )
      })}
    </div>
  )
}

const LearningAccordionSection = ({
  title,
  description,
  count,
  defaultOpen = false,
  children
}: {
  title: string
  description?: string
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 active:scale-[0.995] dark:hover:bg-slate-900"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</span>
            {typeof count === 'number' && count > 0 && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {count}
              </span>
            )}
          </span>
          {description && <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{description}</span>}
        </span>
        <ChevronDown className={cn('h-5 w-5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t border-slate-200 px-5 py-5 dark:border-slate-800">{children}</div>}
    </section>
  )
}

const TextList = ({ items, tone = 'default' }: { items?: string[]; tone?: 'default' | 'warning' | 'success' }) => {
  if (!items?.length) return <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có dữ liệu cho mục này.</p>

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'rounded-lg border p-3 text-sm leading-6',
            tone === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
              : tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          )}
        >
          <RichText text={item} />
        </div>
      ))}
    </div>
  )
}

const CodeBlock = ({ code }: { code?: string }) => {
  const cleanedCode = stripCodeFence(code ?? '')

  if (!cleanedCode) return null

  return (
    <pre className="max-w-full overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100 shadow-inner">
      <code>{cleanedCode}</code>
    </pre>
  )
}

export const SkillLearningDetailPage = () => {
  const { id, skillName, itemId } = useParams<{ id: string; skillName?: string; itemId?: string }>()
  const location = useLocation()
  const { getRoadmapById, fetchRoadmapDetail, updateNodeStatus, isLoading: isLoadingRoadmap } = useRoadmapStore()
  const {
    learningContent,
    roadmapLearningItem,
    resources,
    status,
    currentLearningKey,
    isLoadingContent,
    isGenerating,
    error,
    fetchRoadmapItemContent,
    generateRoadmapItemContent,
    fetchSkillContent,
    generateSkillContent,
    clearStore
  } = useLearningStore()

  const roadmap = id ? getRoadmapById(id) : undefined
  const decodedItemId = itemId ? decodeURIComponent(itemId) : ''
  const decodedSkillName = skillName ? decodeURIComponent(skillName) : ''
  const isRoadmapItemLearning = Boolean(id && decodedItemId)
  const expectedLearningKey = isRoadmapItemLearning && id ? `${id}:${decodedItemId}` : null
  const taskNode = decodedItemId
    ? roadmap?.modules.flatMap((module) => module.nodes).find((node) => node.itemId === decodedItemId)
    : undefined
  const isInvalidRoadmapItemId = isRoadmapItemLearning && (
    decodedItemId.includes('-node-') ||
    Boolean(roadmap && !taskNode)
  )
  const targetRole = roadmap?.careerOutcome || roadmap?.title || 'Software Engineer'
  const level = (roadmap?.difficulty || 'Beginner').toLowerCase()
  const currentLearningItemId = roadmapLearningItem?.itemId || roadmapLearningItem?.task?.itemId || ''
  const hasMismatchedLearningItem = Boolean(
    isRoadmapItemLearning &&
    expectedLearningKey &&
    currentLearningKey === expectedLearningKey &&
    currentLearningItemId &&
    currentLearningItemId !== decodedItemId
  )
  const isCurrentRouteLearningReady = Boolean(
    !expectedLearningKey ||
    (
      currentLearningKey === expectedLearningKey &&
      !hasMismatchedLearningItem
    )
  )
  const currentResources = learningContent?.resources ?? resources
  const viewKey = expectedLearningKey ?? (decodedSkillName || 'learning')
  const navigationState = location.state as { returnItemId?: string; returnScrollY?: number } | null
  const returnToRoadmapState = isRoadmapItemLearning
    ? {
      restoreItemId: navigationState?.returnItemId ?? decodedItemId,
      restoreScrollY: navigationState?.returnScrollY
    }
    : undefined
  const taskStatusLabel = taskNode?.status === 'completed'
    ? 'Đã hoàn thành'
    : taskNode?.status === 'in-progress'
      ? 'Đang học'
      : 'Chưa học'

  useEffect(() => {
    if (id && !roadmap) {
      fetchRoadmapDetail(id)
    }
  }, [fetchRoadmapDetail, id, roadmap])

  useEffect(() => {
    if (isInvalidRoadmapItemId) return

    if (isRoadmapItemLearning && id && decodedItemId) {
      fetchRoadmapItemContent(id, decodedItemId)
      return () => clearStore()
    }

    if (decodedSkillName) {
      fetchSkillContent(decodedSkillName, { targetRole, level, language: 'vi' })
    }

    return () => clearStore()
  }, [clearStore, decodedItemId, decodedSkillName, expectedLearningKey, fetchRoadmapItemContent, fetchSkillContent, id, isInvalidRoadmapItemId, isRoadmapItemLearning, level, targetRole])

  const retry = () => {
    if (isRoadmapItemLearning && id && decodedItemId && !isInvalidRoadmapItemId) {
      void generateRoadmapItemContent(id, decodedItemId, { forceRegenerate: false, includeResources: true })
      return
    }

    if (decodedSkillName) {
      void generateSkillContent({ skillName: decodedSkillName, targetRole, level, language: 'vi', forceRegenerate: false })
    }
  }

  const completeTask = () => {
    if (roadmap && taskNode) {
      void updateNodeStatus(roadmap.id, taskNode.id, taskNode.status === 'completed' ? 'in-progress' : 'completed')
    }
  }

  const rememberRoadmapReturnTarget = () => {
    if (!id || !decodedItemId || typeof window === 'undefined') return

    const storageKey = `roadmap:return:${id}`
    let scrollY = navigationState?.returnScrollY
    const storedValue = sessionStorage.getItem(storageKey)

    if (typeof scrollY !== 'number' && storedValue) {
      try {
        const storedData = JSON.parse(storedValue) as { scrollY?: number }
        scrollY = storedData.scrollY
      } catch {
        scrollY = undefined
      }
    }

    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        itemId: decodedItemId,
        scrollY: typeof scrollY === 'number' ? scrollY : 0,
        ts: Date.now()
      })
    )
  }

  if (isLoadingRoadmap && !roadmap) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="mt-4 text-slate-500 dark:text-slate-400">Đang tải thông tin lộ trình...</p>
      </div>
    )
  }

  if (isGenerating || status === 'generating') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center p-6 text-center">
        <div className="mb-5 rounded-2xl bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
          <Sparkles className="h-10 w-10 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Đang tạo nội dung học cho kỹ năng này...</h2>
        <p className="mt-3 text-slate-500 dark:text-slate-400">Vui lòng đợi trong giây lát.</p>
      </div>
    )
  }

  if (isLoadingContent || status === 'loading' || (isRoadmapItemLearning && !isCurrentRouteLearningReady)) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 py-6 px-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="mt-4 h-10 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}
          </div>
        </div>
      </div>
    )
  }

  if (isInvalidRoadmapItemId) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-6 px-4">
        <Link to={`/roadmaps/${id}`} state={returnToRoadmapState} onClick={rememberRoadmapReturnTarget}>
          <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại lộ trình học</Button>
        </Link>
        <Card>
          <CardContent className="flex gap-3 p-8">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Không tìm thấy task học</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Task chưa có itemId, vui lòng tải lại roadmap hoặc tạo lại roadmap.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasMismatchedLearningItem || (error && (!learningContent || !isCurrentRouteLearningReady))) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-6 px-4">
        <Link to={`/roadmaps/${id}`} state={returnToRoadmapState} onClick={rememberRoadmapReturnTarget}>
          <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại lộ trình học</Button>
        </Link>
        <Card>
          <CardContent className="flex gap-3 p-8">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Đã xảy ra lỗi khi tải bài học</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {hasMismatchedLearningItem
                  ? 'Nội dung học trả về không khớp task đang mở. Vui lòng tải lại roadmap.'
                  : error}
              </p>
              <Button className="mt-4" onClick={retry} isLoading={isGenerating}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!learningContent || !isCurrentRouteLearningReady) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-6 px-4">
        <Link to={`/roadmaps/${id}`} state={returnToRoadmapState} onClick={rememberRoadmapReturnTarget}>
          <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại lộ trình học</Button>
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-indigo-500" />
            <p className="font-semibold text-slate-900 dark:text-slate-100">Chưa có nội dung học để hiển thị.</p>
            <Button className="mt-4" onClick={retry} isLoading={isGenerating}>Thử lại</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main key={viewKey} className="mx-auto max-w-5xl space-y-5 py-6 px-4">
      <Link to={`/roadmaps/${id}`} state={returnToRoadmapState} onClick={rememberRoadmapReturnTarget}>
        <Button variant="ghost" className="pl-0 text-slate-600 transition-colors hover:bg-transparent hover:text-indigo-600 dark:text-slate-400">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại lộ trình học
        </Button>
      </Link>

      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{learningContent.level || level}</Badge>
              <Badge variant="default">{learningContent.targetRole || targetRole}</Badge>
              {taskNode?.status && (
                <Badge variant={taskNode.status === 'completed' ? 'success' : taskNode.status === 'in-progress' ? 'info' : 'default'}>
                  {taskStatusLabel}
                </Badge>
              )}
            </div>
            <div>
              <h1 className="max-w-[18ch] text-3xl font-bold leading-tight text-slate-950 text-pretty dark:text-slate-50 md:max-w-[22ch] md:text-4xl">
                {stripInlineMarkdown(learningContent.title)}
              </h1>
              {taskNode?.title && (
                <p className="mt-3 max-w-[72ch] text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Nhiệm vụ: {stripInlineMarkdown(taskNode.title)}
                </p>
              )}
            </div>
          </div>
          {taskNode && (
            <Button
              className="w-full shrink-0 md:w-auto"
              variant={taskNode.status === 'completed' ? 'outline' : 'default'}
              onClick={completeTask}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {taskNode.status === 'completed' ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
            </Button>
          )}
        </div>
      </header>

      <LearningAccordionSection
        title="Video/tài nguyên"
       
        count={currentResources.length}
        defaultOpen={currentResources.length > 0}
      >
        {currentResources.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {currentResources.map((resource, index) => {
              const isVideo = resource.provider?.toLowerCase().includes('youtube') || resource.type === 'video'
              const youtubeEmbedUrl = isVideo ? getYouTubeEmbedUrl(resource.url) : ''
              const directVideo = isVideo && isDirectVideoUrl(resource.url)
              const canPlayInline = Boolean(youtubeEmbedUrl || directVideo)

              return (
                <article
                  key={resource.id ?? resource._id ?? resource.url ?? index}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition hover:border-indigo-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-slate-950"
                >
                  <div className="relative aspect-video bg-black">
                    {youtubeEmbedUrl ? (
                      <iframe
                        src={youtubeEmbedUrl}
                        title={stripInlineMarkdown(resource.title)}
                        className="absolute inset-0 h-full w-full"
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : directVideo ? (
                      <video
                        src={resource.url}
                        title={stripInlineMarkdown(resource.title)}
                        poster={resource.thumbnailUrl}
                        className="h-full w-full"
                        controls
                        preload="metadata"
                      />
                    ) : resource.thumbnailUrl ? (
                      <img src={resource.thumbnailUrl} alt={resource.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full min-h-28 items-center justify-center text-slate-400">
                        {isVideo ? <PlayCircle className="h-9 w-9" /> : <BookOpen className="h-9 w-9" />}
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col justify-between p-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{resource.provider || resource.source || 'Tài nguyên'}</span>
                        {resource.channelTitle && <span>{resource.channelTitle}</span>}
                        {resource.publishedAt && <span>{resource.publishedAt}</span>}
                      </div>
                      <p className="line-clamp-2 font-semibold leading-6 text-slate-900 group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-300">
                        {stripInlineMarkdown(resource.title)}
                      </p>
                    </div>
                    {!canPlayInline && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                      >
                        {isVideo ? 'Mở video nguồn' : 'Mở tài nguyên'}
                        <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Chưa có video/tài nguyên phù hợp cho kỹ năng này.
          </p>
        )}
      </LearningAccordionSection>

      <div className="space-y-3">
        <LearningAccordionSection title="Tổng quan" defaultOpen>
          <RichText text={learningContent.overview} />
        </LearningAccordionSection>

        {learningContent.whyLearn && (
          <LearningAccordionSection title="Vì sao cần học?">
            <RichText text={learningContent.whyLearn} />
          </LearningAccordionSection>
        )}

        <LearningAccordionSection title="Use cases" count={learningContent.useCases.length}>
          <TextList items={learningContent.useCases} />
        </LearningAccordionSection>

        {learningContent.howToApply && (
          <LearningAccordionSection title="Cách áp dụng">
            <RichText text={learningContent.howToApply} />
          </LearningAccordionSection>
        )}

        <LearningAccordionSection title="Ví dụ" count={learningContent.examples.length}>
          {learningContent.examples.length > 0 ? (
            <div className="space-y-4">
              {learningContent.examples.map((example, index) => (
                <div key={index} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{stripInlineMarkdown(example.title || `Ví dụ ${index + 1}`)}</p>
                  </div>
                  <div className="space-y-4 p-4">
                    <CodeBlock code={example.code} />
                    {example.explanation && <RichText text={example.explanation} />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có ví dụ cho bài học này.</p>
          )}
        </LearningAccordionSection>

        <LearningAccordionSection title="Bài tập" count={learningContent.exercises.length}>
          {learningContent.exercises.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {learningContent.exercises.map((exercise, index) => (
                <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{stripInlineMarkdown(exercise.title || `Bài tập ${index + 1}`)}</p>
                  <div className="mt-3">
                    <RichText text={exercise.description} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có bài tập cho bài học này.</p>
          )}
        </LearningAccordionSection>

        <LearningAccordionSection title="Checklist" count={learningContent.checklist.length}>
          <TextList items={learningContent.checklist} tone="success" />
        </LearningAccordionSection>

        <LearningAccordionSection title="Lỗi thường gặp" count={learningContent.commonMistakes.length}>
          <TextList items={learningContent.commonMistakes} tone="warning" />
        </LearningAccordionSection>

        <LearningAccordionSection title="Kỹ năng tiếp theo" count={learningContent.nextSkills.length}>
          {learningContent.nextSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {learningContent.nextSkills.map((skill, index) => (
                <span key={index} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  {stripInlineMarkdown(skill)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có gợi ý kỹ năng tiếp theo.</p>
          )}
        </LearningAccordionSection>
      </div>
    </main>
  )
}
