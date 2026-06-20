import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Code,
  Check,
  Copy,
  Award,
  ListTodo,
  AlertTriangle,
  Play,
  Youtube,
  Loader2,
  CheckCircle2,
  ChevronRight,
  BookOpenCheck,
  HelpCircle
} from 'lucide-react'
import { useRoadmapStore } from '../stores/roadmapStore'
import { useLearningStore } from '../stores/learningStore'
import { Badge } from '../../../app/components/ui/Badge'
import { Button } from '../../../app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../app/components/ui/tabs'

export const SkillLearningDetailPage = () => {
  const { id, skillName } = useParams<{ id: string; skillName: string }>()
  const { getRoadmapById, fetchRoadmapDetail, isLoading: isLoadingRoadmap } = useRoadmapStore()
  
  const {
    learningContent,
    resources,
    isLoadingContent,
    isGenerating,
    isLoadingResources,
    error,
    fetchSkillContent,
    generateSkillContent,
    fetchSkillResources,
    searchSkillResources,
    clearStore
  } = useLearningStore()

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const [activeTab, setActiveTab] = useState<string>('lessons')

  const roadmap = id ? getRoadmapById(id) : undefined
  const targetRole = roadmap?.careerOutcome || roadmap?.title || 'Software Engineer'
  const level = (roadmap?.difficulty || 'Beginner').toLowerCase()

  // 1. Fetch roadmap detail if not present
  useEffect(() => {
    if (id && !roadmap) {
      fetchRoadmapDetail(id)
    }
  }, [id, roadmap, fetchRoadmapDetail])

  // 2. Fetch learning content & resources once roadmap is loaded
  useEffect(() => {
    if (skillName && targetRole && level) {
      fetchSkillContent(skillName, { targetRole, level, language: 'vi' })
      fetchSkillResources(skillName, { targetRole, level, type: 'video', language: 'vi' })
    }
    return () => {
      clearStore()
    }
  }, [skillName, targetRole, level, fetchSkillContent, fetchSkillResources, clearStore])

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  // Get difficulty badge variant
  const getLevelBadgeVariant = (lvl: string) => {
    if (lvl.includes('beginner')) return 'info'
    if (lvl.includes('intermediate')) return 'warning'
    if (lvl.includes('advanced')) return 'danger'
    return 'default'
  }

  // Loading Roadmap State
  if (isLoadingRoadmap && !roadmap) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="mt-4 text-slate-500 dark:text-slate-400">Đang tải thông tin lộ trình...</p>
      </div>
    )
  }

  // AI Generating Learning Content State
  if (isGenerating) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6 max-w-2xl mx-auto">
        <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/10 blur-2xl"></div>
          <div className="absolute inset-4 animate-pulse rounded-full bg-violet-500/20 blur-xl"></div>
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-lg"></div>
          <Sparkles className="absolute h-8 w-8 text-violet-500 animate-bounce" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          AI Đang Biên Soạn Bài Học
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          AI đang biên soạn giáo trình và bài tập thực hành tiếng Việt cho kỹ năng này... Vui lòng đợi trong giây lát.
        </p>
      </div>
    )
  }

  // Loading Learning Content State
  if (isLoadingContent) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
        <p className="mt-4 text-slate-500 dark:text-slate-400">Đang tải giáo trình học tập...</p>
      </div>
    )
  }

  // Empty State - No content generated yet
  if (!learningContent) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
        <div className="flex items-center">
          <Link to={`/roadmaps/${id}`}>
            <Button variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại chi tiết lộ trình
            </Button>
          </Link>
        </div>

        {error && !error.toLowerCase().includes('not found') && !error.toLowerCase().includes('generate') && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-200">Đã xảy ra lỗi khi tải bài học</p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <Card className="border-dashed border-slate-300 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-inner">
              <BookOpenCheck className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Chưa Có Bài Học Cho Kỹ Năng Này
            </CardTitle>
            <CardDescription className="mt-3 max-w-lg text-slate-500 dark:text-slate-400 text-base leading-relaxed">
              Hệ thống chưa tìm thấy giáo trình biên soạn sẵn cho kỹ năng <span className="font-semibold text-indigo-600 dark:text-indigo-400">"{skillName}"</span> với vai trò <span className="font-semibold text-slate-900 dark:text-slate-200">{targetRole}</span> ở trình độ <span className="capitalize font-semibold text-slate-900 dark:text-slate-200">{level}</span>.
            </CardDescription>
            <Button
              className="mt-8 px-6 py-5 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
              onClick={() => generateSkillContent({ skillName: skillName!, targetRole, level, language: 'vi' })}
            >
              <Sparkles className="h-5 w-5" />
              Biên soạn bài học bằng AI
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Normal content state
  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6 px-4">
      {/* Header Info */}
      <div className="flex flex-col gap-4">
        <div>
          <Link to={`/roadmaps/${id}`}>
            <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-indigo-600 text-slate-600 dark:text-slate-400 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại lộ trình học
            </Button>
          </Link>
        </div>

        {error && !error.toLowerCase().includes('not found') && !error.toLowerCase().includes('generate') && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-200">Đã xảy ra lỗi</p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={getLevelBadgeVariant(level)} className="px-3 py-1 font-medium capitalize">
                {level}
              </Badge>
              <Badge variant="default" className="px-3 py-1 font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {targetRole}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {learningContent.title || skillName}
            </h1>
          </div>
        </div>
      </div>

      {/* Main content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl w-fit">
          <TabsTrigger value="lessons" className="rounded-xl px-5 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 font-semibold shadow-sm transition-all flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Lý thuyết
          </TabsTrigger>
          <TabsTrigger value="practice" className="rounded-xl px-5 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 font-semibold shadow-sm transition-all flex items-center gap-2">
            <Award className="h-4 w-4" />
            Thực hành & Checklist
          </TabsTrigger>
          <TabsTrigger value="resources" className="rounded-xl px-5 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 font-semibold shadow-sm transition-all flex items-center gap-2">
            <Youtube className="h-4 w-4" />
            Video bài giảng
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 - Lessons */}
        <TabsContent value="lessons" className="grid grid-cols-1 lg:grid-cols-3 gap-6 outline-none">
          {/* Overview columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Description */}
            <Card className="overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  Tổng Quan Kỹ Năng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base whitespace-pre-line">
                  {learningContent.overview}
                </p>
                
                {learningContent.whyLearn && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2 text-sm">
                      <HelpCircle className="h-4 w-4 text-violet-500" />
                      Tại sao cần học kỹ năng này?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                      {learningContent.whyLearn}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Code Examples */}
            {learningContent.examples && learningContent.examples.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 pl-1">
                  <Code className="h-5 w-5 text-indigo-500" />
                  Ví dụ thực hành minh họa
                </h2>

                {learningContent.examples.map((example, index) => (
                  <Card key={index} className="overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 py-4">
                      <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">
                        Ví dụ {index + 1}: {example.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Code Block Container */}
                      <div className="relative bg-slate-950 text-slate-100 p-4 font-mono text-sm leading-relaxed overflow-x-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute right-3 top-3 h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md p-0 flex items-center justify-center"
                          onClick={() => handleCopy(example.code, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-emerald-400 transition-all transform scale-115" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <pre className="pr-12 max-h-96 overflow-y-auto select-all">
                          <code>{example.code}</code>
                        </pre>
                      </div>

                      {/* Explanation box */}
                      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950/40">
                        <h4 className="font-semibold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                          Giải thích chi tiết
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                          {example.explanation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Use cases, How to apply, Next skills */}
          <div className="space-y-6">
            {/* Use cases */}
            {learningContent.useCases && learningContent.useCases.length > 0 && (
              <Card className="border border-slate-100 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Trường Hợp Áp Dụng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {learningContent.useCases.map((useCase, index) => (
                      <li key={index} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* How to Apply */}
            {learningContent.howToApply && (
              <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-gradient-to-br from-indigo-50/30 to-violet-50/10 dark:from-indigo-950/10 dark:to-slate-900/30">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    Cách Thức Áp Dụng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {learningContent.howToApply}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Next Skills */}
            {learningContent.nextSkills && learningContent.nextSkills.length > 0 && (
              <Card className="border border-slate-100 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Kỹ Năng Tiếp Theo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {learningContent.nextSkills.map((nextSkill, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {nextSkill}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab 2 - Practice */}
        <TabsContent value="practice" className="grid grid-cols-1 lg:grid-cols-3 gap-6 outline-none">
          {/* Exercises & Mistakes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Practical Exercises */}
            {learningContent.exercises && learningContent.exercises.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 pl-1">
                  <Award className="h-5 w-5 text-indigo-500" />
                  Bài Tập Thực Hành
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {learningContent.exercises.map((exercise, index) => (
                    <Card key={index} className="border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          Bài tập {index + 1}: {exercise.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                          {exercise.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Common Mistakes */}
            {learningContent.commonMistakes && learningContent.commonMistakes.length > 0 && (
              <Card className="border border-rose-100 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/10 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    Lỗi Phổ Biến Cần Tránh
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {learningContent.commonMistakes.map((mistake, index) => (
                      <li key={index} className="flex gap-2.5 items-start text-sm text-slate-600 dark:text-slate-300">
                        <div className="h-5 w-5 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                          !
                        </div>
                        <span className="leading-relaxed whitespace-pre-line">{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Checklist Sidebar */}
          {learningContent.checklist && learningContent.checklist.length > 0 && (
            <Card className="border border-slate-100 dark:border-slate-800 shadow-sm">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-indigo-500" />
                  Checklist Tự Đánh Giá
                </CardTitle>
                <CardDescription>
                  Hãy tích chọn các mục dưới đây sau khi bạn đã tự tin nắm vững.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {learningContent.checklist.map((item, index) => {
                    const isChecked = checkedItems[index] || false
                    return (
                      <li
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'border-indigo-150 bg-indigo-50/15 dark:border-indigo-950/50 dark:bg-indigo-950/10 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-100 bg-white dark:border-slate-850 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                        }`}
                        onClick={() => toggleCheck(index)}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                            isChecked
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900'
                          }`}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <span className={`text-sm leading-relaxed ${isChecked ? 'line-through opacity-75' : ''}`}>
                          {item}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3 - YouTube Resources */}
        <TabsContent value="resources" className="outline-none">
          {isLoadingResources ? (
            /* Pulsing grid placeholders */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="overflow-hidden border border-slate-100 dark:border-slate-800 animate-pulse">
                  <div className="aspect-video bg-slate-200 dark:bg-slate-800" />
                  <CardHeader className="space-y-2 p-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : resources && resources.length > 0 ? (
            /* Videos Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((video, index) => (
                <Card
                  key={index}
                  className="group overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300"
                >
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video bg-slate-950 overflow-hidden">
                    <img
                      src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />
                    {/* Hover play icon */}
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 flex items-center justify-center transition-colors">
                      <div className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </a>
                  
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Youtube className="h-3.5 w-3.5 text-red-500 fill-current" />
                        {video.channelTitle || 'YouTube Video'}
                      </span>
                      {video.score && (
                        <span className="flex items-center gap-1 text-amber-500 font-medium">
                          ★ {(video.score * 5).toFixed(1)}
                        </span>
                      )}
                    </div>
                    
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block font-bold text-sm text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-2 leading-snug transition-colors"
                      title={video.title}
                    >
                      {video.title}
                    </a>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            /* YouTube Recommendation Empty State */
            <Card className="max-w-xl mx-auto border-dashed border-slate-300 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 shadow-inner">
                  <Youtube className="h-7 w-7 fill-current" />
                </div>
                <CardTitle className="text-lg font-bold">Chưa Có Video Gợi Ý</CardTitle>
                <CardDescription className="mt-2 text-sm max-w-sm text-slate-500 dark:text-slate-400">
                  Bạn có muốn hệ thống tự động tìm kiếm các video bài học phù hợp nhất từ YouTube cho kỹ năng này không?
                </CardDescription>
                <Button
                  className="mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-md flex items-center gap-2"
                  onClick={() => searchSkillResources(skillName!, { targetRole, level, language: 'vi' })}
                >
                  <Play className="h-4 w-4 fill-current" />
                  Tìm kiếm video bài học từ YouTube
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
