import { apiClient, extractApiResource } from '../../../app/services/apis/core'
import { roadmapTargetRoles } from '../constants/roadmapTargetRoles'
import type {
  AIRecommendation,
  LearningNodeStatus,
  ResourceType,
  Roadmap,
  RoadmapCategory,
  RoadmapDifficulty,
  RoadmapProgressRecord,
  SkillGapAnalysis
} from '../types'

export { roadmapTargetRoles }

type RoadmapTask = {
  _id?: string
  itemId?: string
  title?: string
  description?: string
  skillName?: string
  canonicalSkillName?: string
  targetRole?: string
  category?: string
  priority?: number
  week?: number
  level?: string
  learningStatus?: 'available' | 'missing' | string
  progressPercent?: number
  skillTags?: string[]
  status?: string
  estimatedHours?: number
  resources?: Array<{
    _id?: string
    title?: string
    type?: string
    url?: string
    provider?: string
    estimatedMinutes?: number
  }>
}

type RoadmapPhase = {
  _id?: string
  title?: string
  goal?: string
  skills?: string[]
  tasks?: RoadmapTask[]
  status?: string
}

export type BackendRoadmap = {
  _id?: string
  id?: string
  roadmapId?: string
  title?: string
  targetRole?: string
  roleId?: string
  requestedLevel?: string
  effectiveLevel?: string
  durationWeeks?: number
  language?: string
  currentGithubDirection?: string
  summary?: string
  mainRoadmap?: {
    title?: string
    reason?: string
    phases?: RoadmapPhase[]
    tasks?: RoadmapTask[]
  }
  alternativeRoadmaps?: Array<{
    _id?: string
    id?: string
    title?: string
    reason?: string
    skills?: string[]
    suggestedTasks?: string[]
  }>
  mainPath?: {
    title?: string
    reason?: string
    phases?: RoadmapPhase[]
  }
  tasks?: RoadmapTask[]
  supportingPaths?: Array<{
    _id?: string
    title?: string
    reason?: string
    skills?: string[]
    suggestedTasks?: string[]
  }>
  sourceContextSummary?: {
    repositoriesCount?: number
    detectedSkills?: string[]
    missingSkills?: string[]
    latestAnalysisSnapshotId?: string
  }
  roadmapSource?: Roadmap['roadmapSource']
  roleMatch?: BackendRoadmapRoleMatch
  skillGapSummary?: Roadmap['skillGapSummary'] | Array<{
    totalGaps?: number
    missingRequiredCount?: number
    weakSkillCount?: number
    recommendedNextSkills?: string[]
    prioritySkills?: string[]
    gaps?: Array<{
      skillName?: string
      canonicalSkillName?: string
      category?: string
      currentLevel?: string
      targetLevel?: string
      currentScore?: number
      requiredScore?: number
      gap?: number
      priority?: string
      reason?: string
    }>
  }>
  progressSummary?: Roadmap['progressSummary']
  status?: 'active' | 'archived'
  createdAt?: string
  updatedAt?: string
}

type BackendRoadmapRoleMatch = {
  roleId?: string
  roleName?: string
  matchScore?: number
  matchLevel?: string
  matchLevelLabel?: string
  scoringMethod?: string
  probability?: number
  rank?: number
  modelVersion?: string
  vectorSources?: string[]
  sourceStats?: Record<string, unknown>
}

export type RoadmapListParams = {
  status?: 'active' | 'archived'
  targetRole?: string
}

export type RoadmapSourceMode = 'single_repo' | 'selected_repos' | 'all_analyzed_repos'

export type GenerateRoadmapOptions = {
  sourceMode?: RoadmapSourceMode
  repoId?: string
  roleId?: string
  repoIds?: string[]
  repositoryIds?: string[]
  level?: 'beginner' | 'intermediate' | 'advanced' | string
  durationWeeks?: number
  language?: string
  useRoleMatching?: boolean
  forceRegenerate?: boolean
  selectedRole?: {
    roleId?: string
    roleName?: string
  }
}

const roleLabels: Record<string, string> = {
  'Frontend Developer': 'Frontend Developer',
  'Backend Developer': 'Backend Developer',
  'Mobile Developer': 'Mobile Developer',
  'DevOps Engineer': 'DevOps Engineer',
  'Data Scientist': 'Data Scientist',
  'Fullstack Developer': 'Fullstack Developer',
  'Tester / QA Engineer': 'Tester / QA Engineer',
  'DevOps Beginner': 'DevOps Engineer',
  'Data Analyst': 'Data Scientist',
  'AI Engineer': 'AI Engineer',
  'AI / Machine Learning Beginner': 'Data Scientist',
  'Generalist Software Engineer': 'Kỹ sư phần mềm đa hướng'
}

const roleLabelsById: Record<string, string> = {
  backend: 'Backend Developer',
  frontend: 'Frontend Developer',
  mobile: 'Mobile Developer',
  devops: 'DevOps Engineer',
  data_scientist: 'Data Scientist',
  'frontend-developer': 'Frontend Developer',
  'backend-developer': 'Backend Developer',
  'fullstack-developer': 'Fullstack Developer',
  'mobile-developer': 'Mobile Developer',
  'tester-qa-engineer': 'Tester / QA Engineer',
  'devops-engineer': 'DevOps Engineer',
  'data-analyst': 'Data Scientist',
  'ai-engineer': 'AI Engineer'
}
const levelTitle = (level?: string) => {
  const normalized = level?.trim().toLowerCase()
  if (normalized === 'beginner') return 'mới bắt đầu'
  if (normalized === 'intermediate') return 'trung cấp'
  if (normalized === 'advanced') return 'nâng cao'
  return 'cá nhân hóa'
}

const roadmapTitleForRole = (targetRole: string, level?: string) =>
  `Lộ trình ${roleLabels[targetRole] ?? targetRole} ${levelTitle(level)}`

const textMap: Record<string, string> = {
  'Backend Developer MVP Path': 'Lộ trình Backend Developer mới bắt đầu',
  'Fullstack Developer MVP Path': 'Lộ trình Fullstack Developer mới bắt đầu',
  'Frontend Developer MVP Path': 'Lộ trình Frontend Developer mới bắt đầu',
  'Mobile Developer MVP Path': 'Lộ trình Mobile Developer mới bắt đầu',
  'Tester / QA Engineer MVP Path': 'Lộ trình Tester / QA Engineer mới bắt đầu',
  'DevOps Beginner MVP Path': 'Lộ trình DevOps mới bắt đầu',
  'Data Analyst MVP Path': 'Lộ trình Data Analyst mới bắt đầu',
  'AI / Machine Learning Beginner MVP Path': 'Lộ trình AI / Machine Learning mới bắt đầu',
  'Backend Foundation': 'Nền tảng Backend',
  'Database and API': 'Cơ sở dữ liệu và API',
  'Authentication and Security': 'Xác thực và bảo mật',
  'Testing and Deployment': 'Kiểm thử và triển khai',
  'Fullstack Extension': 'Mở rộng sang Fullstack',
  'Job-readiness Path': 'Chuẩn bị ứng tuyển',
  'Hoc va thuc hanh Node.js, Express.js': 'Học và thực hành Node.js, Express.js',
  'Hoc va thuc hanh MongoDB, Mongoose': 'Học và thực hành MongoDB, Mongoose',
  'Hoc va thuc hanh JWT, Validation': 'Học và thực hành JWT, Validation',
  'Hoc va thuc hanh Testing, Docker': 'Học và thực hành Testing, Docker',
  'Ap dung vao project GitHub hien co': 'Áp dụng vào project GitHub hiện có',
  'Tap trung vao nhung phan can thiet de dat MVP cho vai tro Backend Developer.': 'Tập trung vào phần cần thiết để đạt mức sẵn sàng cho vai trò Backend Developer.',
  'Cap nhat mot repository hien co hoac tao mini project de co bang chung thuc hanh.': 'Cập nhật một repository hiện có hoặc tạo mini project để có bằng chứng thực hành.',
  'Cung co Node.js, Express va kien truc routes-controller-service-model.': 'Củng cố Node.js, Express và kiến trúc routes - controller - service - model.',
  'Thiet ke schema MongoDB/Mongoose va CRUD API ro rang.': 'Thiết kế schema MongoDB/Mongoose và CRUD API rõ ràng.',
  'Lam JWT auth, validation, error handling va bao ve route.': 'Làm JWT auth, validation, xử lý lỗi và bảo vệ route.',
  'Them test API co ban, Docker/CI va deploy backend demo.': 'Thêm test API cơ bản, Docker/CI và triển khai backend demo.',
  'Tap trung vao nhung ky nang toi thieu de sinh vien co the demo nang luc Backend Developer, khong bat hoc tat ca ky nang con thieu.': 'Tập trung vào các kỹ năng tối thiểu để bạn có thể chứng minh năng lực Backend Developer mà không phải học dàn trải.',
  'GitHub hien co co dau hieu frontend, nen co the tan dung de mo rong sang san pham fullstack.': 'GitHub hiện có tín hiệu frontend, có thể tận dụng để mở rộng thành sản phẩm fullstack.',
  'Tang kha nang ung tuyen thuc tap/di lam bang cac dau hieu nha tuyen dung de kiem tra.': 'Tăng khả năng ứng tuyển bằng những tín hiệu nhà tuyển dụng thường kiểm tra.',
  'Chon repository co tin hieu tot nhat va viet lai README theo huong portfolio.': 'Chọn repository có tín hiệu tốt nhất và viết lại README theo hướng portfolio.',
  'Bo sung mot tinh nang nho the hien ro skill manh da co.': 'Bổ sung một tính năng nhỏ thể hiện rõ kỹ năng mạnh đã có.',
  'Ghi lai evidence: cong nghe dung, demo link, anh man hinh va cach chay project.': 'Ghi lại bằng chứng: công nghệ sử dụng, demo link, ảnh màn hình và cách chạy project.',
  'Chuan hoa README: problem, features, tech stack, setup, demo va screenshots.': 'Chuẩn hóa README: vấn đề, tính năng, tech stack, setup, demo và ảnh màn hình.',
  'Them test co ban cho flow quan trong nhat.': 'Thêm test cơ bản cho flow quan trọng nhất.',
  'Them Dockerfile hoac huong dan deploy don gian.': 'Thêm Dockerfile hoặc hướng dẫn deploy đơn giản.',
  'Chuan bi 3 gach dau dong giai thich dong gop ky thuat trong CV.': 'Chuẩn bị 3 gạch đầu dòng giải thích đóng góp kỹ thuật trong CV.'
}

const skillMap: Record<string, string> = {
  'java script': 'JavaScript',
  javascript: 'JavaScript',
  react: 'React',
  express: 'Express.js',
  jsonwebtoken: 'JWT',
  mongoose: 'Mongoose',
  dotenv: 'Environment Configuration',
  nodemon: 'Node.js',
  'express-session': 'Express Session',
  'connect-flash': 'Express Flash',
  'web-vitals': 'Web Vitals',
  'Backend Development': 'Backend Development',
  'JWT Authentication': 'JWT Authentication'
}

const stripBrokenEncoding = (value: string) =>
  value
    .replace(/Repo cÃ³ README, giÃºp ngÆ°á»i khÃ¡c hiá»ƒu má»¥c tiÃªu vÃ  cÃ¡ch sá»­ dá»¥ng project\./g, 'README rõ ràng')
    .replace(/Ä/g, 'Đ')
    .replace(/Ã/g, '')
    .replace(/Æ/g, '')
    .replace(/áº|á»/g, '')
    .trim()

const toUserText = (value?: string, fallback = '') => {
  if (!value) return fallback
  const direct = textMap[value] ?? roleLabels[value]
  if (direct) return direct

  let text = stripBrokenEncoding(value)

  const summaryMatch = text.match(/Lo trinh fallback duoc tao dua tren (\d+) repository.*muc tieu (.+)\./i)
  if (summaryMatch) {
    return `Lộ trình được tạo dựa trên ${summaryMatch[1]} repository đã phân tích và mục tiêu ${summaryMatch[2]}.`
  }

  text = text
    .replace(/\bLo trinh\b/gi, 'Lộ trình')
    .replace(/\bduoc tao dua tren\b/gi, 'được tạo dựa trên')
    .replace(/\bcac skill da phat hien\b/gi, 'các kỹ năng đã phát hiện')
    .replace(/\bva muc tieu\b/gi, 'và mục tiêu')
    .replace(/\bhien co\b/gi, 'hiện có')
    .replace(/\bco the\b/gi, 'có thể')
    .replace(/\bky nang\b/gi, 'kỹ năng')
    .replace(/\bcon thieu\b/gi, 'còn thiếu')
    .replace(/\bthuc hanh\b/gi, 'thực hành')
    .replace(/\bproject\b/gi, 'dự án')

  return text
}

const normalizeSkill = (skill?: string) => {
  if (!skill) return ''
  const cleaned = stripBrokenEncoding(skill).trim()
  const key = cleaned.toLowerCase()
  const normalized = skillMap[key] ?? skillMap[cleaned] ?? cleaned

  if (!normalized || normalized.length > 38 || normalized.includes(',')) return ''
  return normalized
}

const unique = (items: Array<string | undefined>) => {
  const seen = new Set<string>()

  return items.reduce<string[]>((result, item) => {
    const normalized = normalizeSkill(item)
    const key = normalized.toLowerCase()
    if (!normalized || seen.has(key)) return result
    seen.add(key)
    result.push(normalized)
    return result
  }, [])
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const asNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const resolveTargetRole = (backend: BackendRoadmap) =>
  backend.roleMatch?.roleName ||
  (backend.roleId ? roleLabelsById[backend.roleId] : undefined) ||
  backend.targetRole ||
  backend.currentGithubDirection ||
  'Developer'

const hasRoleMismatch = (text: string | undefined, targetRole: string) => {
  if (!text) return false
  const normalizedText = text.toLowerCase()
  const normalizedRole = targetRole.toLowerCase()

  return normalizedText.includes('backend developer') && !normalizedRole.includes('backend')
}

const roleSafeText = (text: string, targetRole: string) => {
  if (!targetRole || targetRole === 'Backend Developer') return text

  return text
    .replace(/Backend Developer/g, targetRole)
    .replace(/backend developer/g, targetRole)
}

const phaseTitleForRole = (phase: RoadmapPhase, tasks: RoadmapTask[], targetRole: string, index: number) => {
  const text = `${phase.title ?? ''} ${phase.goal ?? ''} ${(phase.skills ?? []).join(' ')} ${tasks.map((task) => `${task.skillName ?? ''} ${task.canonicalSkillName ?? ''}`).join(' ')}`.toLowerCase()

  if (targetRole.toLowerCase().includes('ai')) {
    if (text.includes('prompt')) return 'Prompt Engineering và dữ liệu'
    if (text.includes('llm') || text.includes('ai')) return 'Nền tảng AI ứng dụng'
    if (text.includes('api') || text.includes('backend') || text.includes('node') || text.includes('express')) return 'Tích hợp API cho sản phẩm AI'
    if (text.includes('test') || text.includes('docker') || text.includes('ci/cd')) return 'Kiểm thử và triển khai sản phẩm AI'
  }

  return `Giai đoạn ${index + 1} cho ${targetRole}`
}

const phaseDescriptionForRole = (phase: RoadmapPhase, tasks: RoadmapTask[], targetRole: string) => {
  const skills = unique([
    ...(phase.skills ?? []),
    ...tasks.flatMap((task) => [task.canonicalSkillName, task.skillName, ...(task.skillTags ?? [])])
  ]).slice(0, 4)

  if (!skills.length) return `Hoàn thành các kỹ năng trọng tâm để tiến gần hơn tới vai trò ${targetRole}.`
  return `Tập trung vào ${skills.join(', ')} để bổ sung năng lực cho vai trò ${targetRole}.`
}

const taskTitleForRole = (task: RoadmapTask, targetRole: string) => {
  const primarySkill = normalizeSkill(task.canonicalSkillName ?? task.skillName ?? task.skillTags?.[0])
  if (primarySkill) return `Học và thực hành ${primarySkill}`
  return `Nhiệm vụ thực hành cho ${targetRole}`
}

const taskDescriptionForRole = (task: RoadmapTask, targetRole: string) => {
  const primarySkill = normalizeSkill(task.canonicalSkillName ?? task.skillName ?? task.skillTags?.[0])
  if (primarySkill) return `Hoàn thành bài thực hành nhỏ để chứng minh kỹ năng ${primarySkill} trong lộ trình ${targetRole}.`
  return `Hoàn thành nhiệm vụ này để tiến gần hơn tới mục tiêu ${targetRole}.`
}

const inferCategory = (targetRole = '', skills: string[] = []): RoadmapCategory => {
  const text = `${targetRole} ${skills.join(' ')}`.toLowerCase()

  if (text.includes('fullstack') || text.includes('full stack')) return 'Fullstack'
  if (text.includes('frontend') || text.includes('react') || text.includes('vue')) return 'Frontend'
  if (text.includes('data scientist') || text.includes('data science') || text.includes('python') || text.includes('pandas') || text.includes('sql')) return 'AI/ML'
  if (text.includes('ai') || text.includes('machine learning') || text.includes('ml')) return 'AI/ML'
  if (text.includes('backend') || text.includes('node') || text.includes('express') || text.includes('api')) return 'Backend'
  if (text.includes('devops') || text.includes('docker') || text.includes('cloud') || text.includes('ci/cd')) return 'DevOps'
  if (text.includes('mobile') || text.includes('react native') || text.includes('flutter')) return 'Mobile'
  if (text.includes('tester') || text.includes('test') || text.includes('qa')) return 'Testing'

  return 'Backend'
}

const inferDifficulty = (phases: RoadmapPhase[], tasks: RoadmapTask[]): RoadmapDifficulty => {
  const totalItems = phases.length + tasks.length
  const totalHours = tasks.reduce((sum, task) => sum + asNumber(task.estimatedHours, 4), 0)

  if (totalItems >= 12 || totalHours >= 80) return 'Advanced'
  if (totalItems >= 6 || totalHours >= 32) return 'Intermediate'
  return 'Beginner'
}

const levelToDifficulty = (level?: string): RoadmapDifficulty | undefined => {
  const normalized = level?.trim().toLowerCase()
  if (normalized === 'beginner') return 'Beginner'
  if (normalized === 'intermediate') return 'Intermediate'
  if (normalized === 'advanced') return 'Advanced'
  return undefined
}

const normalizeStatus = (status?: string, index = 0): LearningNodeStatus => {
  if (status === 'completed') return 'completed'
  if (status === 'in-progress' || status === 'in_progress') return 'in-progress'
  if (status === 'locked') return 'locked'
  return index === 0 ? 'unlocked' : 'locked'
}

const normalizeResourceType = (type?: string): ResourceType => {
  const normalized = type?.toLowerCase()
  if (normalized === 'video' || normalized === 'docs' || normalized === 'course' || normalized === 'repo' || normalized === 'exercise') {
    return normalized
  }
  return 'article'
}

const normalizeProgress = (payload: unknown): RoadmapProgressRecord => {
  const source = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>
  const summary = (source.progressSummary && typeof source.progressSummary === 'object' ? source.progressSummary : {}) as Record<string, unknown>
  const items = Array.isArray(source.items) ? source.items : []

  return {
    id: String(source._id ?? source.id ?? ''),
    roadmapId: String(source.roadmapId ?? ''),
    overallProgress: asNumber(summary.overallProgress, asNumber(source.overallProgress, 0)),
    items: items.map((item) => {
      const record = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      return {
        itemId: typeof record.itemId === 'string' ? record.itemId : undefined,
        taskTitle: typeof record.taskTitle === 'string' ? record.taskTitle : typeof record.title === 'string' ? record.title : undefined,
        skillName: String(record.skillName ?? ''),
        normalizedSkillName: typeof record.normalizedSkillName === 'string' ? record.normalizedSkillName : undefined,
        canonicalSkillName: typeof record.canonicalSkillName === 'string' ? record.canonicalSkillName : undefined,
        category: typeof record.category === 'string' ? record.category : undefined,
        targetRole: typeof record.targetRole === 'string' ? record.targetRole : undefined,
        level: typeof record.level === 'string' ? record.level : undefined,
        week: typeof record.week === 'number' ? record.week : undefined,
        priority: typeof record.priority === 'number' || typeof record.priority === 'string' ? record.priority : undefined,
        status: String(record.status ?? 'not_started'),
        progressPercent: asNumber(record.progressPercent, 0),
        startedAt: typeof record.startedAt === 'string' ? record.startedAt : null,
        completedAt: typeof record.completedAt === 'string' ? record.completedAt : null,
        updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined
      }
    }).filter((item) => item.itemId || item.skillName),
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : undefined,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : undefined
  }
}

const phaseTasks = (phase: RoadmapPhase, fallbackIndex: number): RoadmapTask[] => {
  if (phase.tasks?.length) return phase.tasks

  return [{
    _id: phase._id,
    title: phase.title ?? `Giai đoạn ${fallbackIndex + 1}`,
    description: phase.goal ?? 'Hoàn thành các kỹ năng trọng tâm của giai đoạn này.',
    skillTags: phase.skills,
    status: phase.status,
    estimatedHours: Math.max(6, (phase.skills?.length ?? 1) * 4)
  }]
}

export const normalizeBackendRoadmap = (backend: BackendRoadmap): Roadmap => {
  const id = backend.roadmapId ?? backend._id ?? backend.id ?? `roadmap-${Date.now()}`
  const mainRoadmap = backend.mainRoadmap ?? backend.mainPath
  const phases = mainRoadmap?.phases ?? []
  const standaloneTasks = mainRoadmap?.tasks ?? backend.tasks ?? []
  const allTasks = [...phases.flatMap(phaseTasks), ...standaloneTasks]
  const targetRole = resolveTargetRole(backend)
  const skills = unique([
    ...(backend.sourceContextSummary?.detectedSkills ?? []),
    ...phases.flatMap((phase) => phase.skills ?? []),
    ...allTasks.flatMap((task) => task.skillTags ?? [])
  ])
  const missingSkills = unique(backend.sourceContextSummary?.missingSkills ?? [])
  const rawTitle = backend.title ?? mainRoadmap?.title
  const titleMatchesResolvedRole = rawTitle?.toLowerCase().includes(targetRole.toLowerCase())
  const title = titleMatchesResolvedRole
    ? toUserText(rawTitle, roadmapTitleForRole(targetRole, backend.effectiveLevel ?? backend.requestedLevel))
    : roadmapTitleForRole(targetRole, backend.effectiveLevel ?? backend.requestedLevel)
  const reason = roleSafeText(toUserText(mainRoadmap?.reason), targetRole)
  const summary = roleSafeText(toUserText(backend.summary, reason || `Lộ trình cá nhân hóa cho ${targetRole}`), targetRole)
  const estimatedHours = Math.max(
    allTasks.reduce((sum, task) => sum + asNumber(task.estimatedHours, 4), 0),
    phases.length * 8,
    12
  )
  const completedTasks = allTasks.filter((task) => task.status === 'completed').length
  const taskProgress = allTasks.length ? Math.round((completedTasks / allTasks.length) * 100) : 0
  const progress = Math.max(0, Math.min(100, Math.round(backend.progressSummary?.overallProgress ?? taskProgress)))
  const category = inferCategory(targetRole, skills)
  const difficulty = levelToDifficulty(backend.effectiveLevel ?? backend.requestedLevel) ?? inferDifficulty(phases, allTasks)
  const slug = `${slugify(title || targetRole)}-${id}`
  const skillGapSummary = Array.isArray(backend.skillGapSummary)
    ? {
        totalGaps: backend.skillGapSummary.length,
        missingRequiredCount: backend.skillGapSummary.filter((gap) => gap.priority === 'high' && gap.currentLevel === 'missing').length,
        weakSkillCount: backend.skillGapSummary.filter((gap) => gap.currentLevel === 'weak' || gap.currentLevel === 'developing').length,
        recommendedNextSkills: backend.skillGapSummary
          .filter((gap) => gap.priority === 'high' || gap.priority === 'medium')
          .map((gap) => gap.skillName || gap.canonicalSkillName)
          .filter(Boolean) as string[],
        prioritySkills: backend.skillGapSummary
          .filter((gap) => gap.priority === 'high')
          .map((gap) => gap.skillName || gap.canonicalSkillName)
          .filter(Boolean) as string[],
        gaps: backend.skillGapSummary
      }
    : backend.skillGapSummary

  const modules = (phases.length ? phases : [{ title: 'Lộ trình chính', goal: reason, tasks: standaloneTasks }]).map((phase, moduleIndex) => {
    const tasks = phaseTasks(phase, moduleIndex)
    const phaseHasMismatch = hasRoleMismatch(`${phase.title ?? ''} ${phase.goal ?? ''}`, targetRole)
    const phaseTitle = phaseHasMismatch
      ? phaseTitleForRole(phase, tasks, targetRole, moduleIndex)
      : roleSafeText(toUserText(phase.title, `Giai Ä‘oáº¡n ${moduleIndex + 1}`), targetRole)
    const phaseDescription = phaseHasMismatch
      ? phaseDescriptionForRole(phase, tasks, targetRole)
      : roleSafeText(toUserText(phase.goal, reason || 'CÃ¡c nhiá»‡m vá»¥ há»c táº­p Ä‘Æ°á»£c cÃ¡ nhÃ¢n hÃ³a theo phÃ¢n tÃ­ch GitHub.'), targetRole)

    return {
      id: phase._id ?? `${id}-module-${moduleIndex + 1}`,
      title: phaseTitle,
      description: phaseDescription,
      order: moduleIndex + 1,
      estimatedHours: tasks.reduce((sum, task) => sum + asNumber(task.estimatedHours, 4), 0),
      nodes: tasks.map((task, taskIndex) => ({
        id: task.itemId ?? task._id ?? `${id}-node-${moduleIndex + 1}-${taskIndex + 1}`,
        itemId: task.itemId,
        hasBackendItemId: Boolean(task.itemId),
        title: hasRoleMismatch(`${task.title ?? ''} ${task.description ?? ''} ${task.targetRole ?? ''}`, targetRole)
          ? taskTitleForRole(task, targetRole)
          : roleSafeText(toUserText(task.title, `Nhiệm vụ ${taskIndex + 1}`), targetRole),
        description: hasRoleMismatch(`${task.title ?? ''} ${task.description ?? ''} ${task.targetRole ?? ''}`, targetRole)
          ? taskDescriptionForRole(task, targetRole)
          : roleSafeText(toUserText(task.description, phase.goal ?? 'Hoàn thành nhiệm vụ này để tiến gần hơn tới mục tiêu nghề nghiệp.'), targetRole),
        estimatedHours: asNumber(task.estimatedHours, 4),
        difficulty,
        dependencies: taskIndex === 0 ? [] : [tasks[taskIndex - 1]?.itemId ?? tasks[taskIndex - 1]?._id ?? `${id}-node-${moduleIndex + 1}-${taskIndex}`],
        status: normalizeStatus(task.status, moduleIndex === 0 ? taskIndex : taskIndex + 1),
        skills: unique([task.canonicalSkillName, task.skillName, ...(task.skillTags ?? []), ...(phase.skills ?? [])]),
        skillName: normalizeSkill(task.skillName ?? task.canonicalSkillName ?? task.skillTags?.[0]),
        canonicalSkillName: normalizeSkill(task.canonicalSkillName ?? task.skillName ?? task.skillTags?.[0]),
        targetRole,
        category: task.category,
        priority: task.priority,
        week: task.week ?? moduleIndex + 1,
        level: task.level,
        learningStatus: task.learningStatus,
        progressPercent: task.progressPercent,
        resources: (task.resources ?? []).map((resource, resourceIndex) => ({
          id: resource._id ?? `${id}-resource-${moduleIndex + 1}-${taskIndex + 1}-${resourceIndex + 1}`,
          title: toUserText(resource.title, 'Tài nguyên học tập'),
          type: normalizeResourceType(resource.type),
          url: resource.url ?? '#',
          provider: resource.provider ?? 'AI Mentor',
          estimatedMinutes: asNumber(resource.estimatedMinutes, 30)
        })),
        project: hasRoleMismatch(`${task.title ?? ''} ${task.description ?? ''} ${task.targetRole ?? ''}`, targetRole)
          ? taskDescriptionForRole(task, targetRole)
          : roleSafeText(toUserText(task.description), targetRole),
        bookmarked: false,
        xp: Math.max(80, asNumber(task.estimatedHours, 4) * 30)
      })),
      milestones: [{
        id: `${id}-milestone-${moduleIndex + 1}`,
        title: `Hoàn thành ${phaseTitle}`,
        description: phaseDescription,
        targetWeek: Math.max(1, (moduleIndex + 1) * 2),
        nodeIds: tasks.map((task, taskIndex) => task.itemId ?? task._id ?? `${id}-node-${moduleIndex + 1}-${taskIndex + 1}`),
        rewardXp: 250,
        completed: tasks.every((task) => task.status === 'completed')
      }]
    }
  })

  const roadmapSource = backend.roadmapSource && typeof backend.roadmapSource === 'object' ? backend.roadmapSource : undefined
  const sourceRepositoryIds = Array.from(new Set((roadmapSource?.repositoryIds ?? []).filter(Boolean)))
  const sourceRepositories = roadmapSource?.repositories ?? []
  const sourceRepositoryKeys = Array.from(new Set(sourceRepositories.map((repository) =>
    repository.repositoryId || repository.fullName || repository.repoName
  ).filter(Boolean)))
  const sourceMode = roadmapSource?.sourceMode || roadmapSource?.type
  const sourceRepositoriesCount = sourceMode === 'single_repo'
    ? 1
    : sourceRepositoryIds.length || sourceRepositoryKeys.length || (
        roadmapSource?.repositoryId || roadmapSource?.fullName || roadmapSource?.repoName ? 1 : 0
      ) || roadmapSource?.totalRepositories || backend.sourceContextSummary?.repositoriesCount || 0

  return {
    id,
    slug,
    title,
    subtitle: reason || summary,
    description: summary,
    category,
    difficulty,
    estimatedWeeks: backend.durationWeeks ?? Math.max(1, Math.ceil(estimatedHours / 8)),
    estimatedHours,
    requiredSkills: skills,
    objectives: [
      ...phases.map((phase) => toUserText(phase.goal)).filter(Boolean),
      ...(backend.supportingPaths ?? []).map((path) => toUserText(path.reason)).filter(Boolean)
    ].slice(0, 8),
    tags: unique([targetRole, category, ...skills]).slice(0, 8),
    popularity: 0,
    rating: 0,
    learners: backend.sourceContextSummary?.repositoriesCount ?? 0,
    isFeatured: false,
    isAIRecommended: true,
    progress,
    modules,
    createdFrom: 'ai',
    careerOutcome: roleLabels[targetRole] ?? targetRole,
    status: backend.status ?? 'active',
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt,
    sourceRepositoriesCount,
    roleId: backend.roleId,
    requestedLevel: backend.requestedLevel,
    effectiveLevel: backend.effectiveLevel,
    durationWeeks: backend.durationWeeks,
    language: backend.language,
    missingSkills,
    roadmapSource: backend.roadmapSource,
    roleMatch: backend.roleMatch,
    progressSummary: backend.progressSummary,
    skillGapSummary,
    supportingPaths: ([...(backend.supportingPaths ?? []), ...(backend.alternativeRoadmaps ?? [])]).map((path, index) => ({
      id: path._id ?? `${id}-support-${index + 1}`,
      title: toUserText(path.title, `Hướng bổ trợ ${index + 1}`),
      reason: toUserText(path.reason),
      skills: unique(path.skills ?? []),
      suggestedTasks: (path.suggestedTasks ?? []).map((task) => toUserText(task)).filter(Boolean)
    }))
  }
}

const buildRecommendation = (backend: BackendRoadmap): AIRecommendation => {
  const roadmap = normalizeBackendRoadmap(backend)
  const missingSkills = roadmap.missingSkills ?? []
  const detectedSkills = roadmap.requiredSkills
  const sourceCount = roadmap.sourceRepositoriesCount ?? 0
  const skillGaps: SkillGapAnalysis[] = missingSkills.map((skill, index) => ({
    skill,
    category: roadmap.category,
    currentScore: Math.max(15, 45 - index * 5),
    targetScore: 80,
    priority: index === 0 ? 'High' : 'Medium',
    evidence: `Kỹ năng ${skill} đang cần được bổ sung trong lộ trình hiện tại.`,
    recommendedNodeIds: roadmap.modules.flatMap((module) => module.nodes).slice(0, 2).map((node) => node.id)
  }))

  return {
    id: `ai-${roadmap.id}`,
    generatedAt: backend.updatedAt ?? backend.createdAt ?? new Date().toISOString(),
    summary: roadmap.description,
    confidence: Math.min(95, 72 + Math.min(sourceCount, 5) * 4),
    sourceRepositories: [`${sourceCount || 0} repository đã phân tích`],
    strengths: detectedSkills.length ? detectedSkills.slice(0, 4) : ['Đã có dữ liệu GitHub để cá nhân hóa lộ trình'],
    weaknesses: missingSkills.length ? missingSkills.slice(0, 4) : ['Chưa có kỹ năng thiếu nổi bật trong roadmap này'],
    missingSkills,
    commitPatternInsight: sourceCount > 0
      ? 'Lộ trình này được cá nhân hóa từ các repository đã phân tích.'
      : 'Hãy phân tích thêm repository để lộ trình chính xác hơn.',
    complexityInsight: roadmap.subtitle,
    careerSuggestion: roadmap.careerOutcome,
    estimatedCompletionWeeks: roadmap.estimatedWeeks,
    skillGaps,
    roadmap
  }
}

export const roadmapService = {
  async getRoadmaps(params: RoadmapListParams = { status: 'active' }): Promise<Roadmap[]> {
    const response = await apiClient.get('/roadmaps/me', { params })
    const roadmaps = extractApiResource<BackendRoadmap[]>(response.data, ['roadmaps'])
    return (roadmaps ?? []).map(normalizeBackendRoadmap)
  },

  async getRoadmapById(idOrSlug: string): Promise<Roadmap | undefined> {
    const slugParts = idOrSlug.split('-')
    const backendId = slugParts[slugParts.length - 1] ?? idOrSlug
    const response = await apiClient.get(`/roadmaps/${backendId}`)
    const roadmap = extractApiResource<BackendRoadmap>(response.data, ['roadmap'])
    return roadmap ? normalizeBackendRoadmap(roadmap) : undefined
  },

  async generateAIRoadmap(targetRole = 'Backend Developer', optionsOrForce: GenerateRoadmapOptions | boolean = false, legacyRepoId?: string): Promise<AIRecommendation> {
    if (false) {
      throw new Error('Hãy phân tích một repository trước khi tạo roadmap.')
    }

    const options: GenerateRoadmapOptions = typeof optionsOrForce === 'boolean'
      ? { forceRegenerate: optionsOrForce, repoId: legacyRepoId, sourceMode: legacyRepoId ? 'single_repo' : 'all_analyzed_repos' }
      : optionsOrForce
    const selectedRepositoryIds = options.repositoryIds ?? options.repoIds ?? []
    const sourceMode = options.sourceMode ?? (selectedRepositoryIds.length ? 'selected_repos' : options.repoId ? 'single_repo' : 'all_analyzed_repos')

    if (sourceMode === 'single_repo' && !options.repoId) {
      throw new Error('Hay chon mot repository da phan tich truoc khi tao roadmap.')
    }
    if (sourceMode === 'selected_repos' && !selectedRepositoryIds.length) {
      throw new Error('Hay chon it nhat mot repository da phan tich.')
    }

    const requestedRoleName = options.selectedRole?.roleName ?? targetRole
    const safeRole = roadmapTargetRoles.includes(requestedRoleName as typeof roadmapTargetRoles[number])
      ? requestedRoleName
      : 'Backend Developer'
    const roleIds: Record<string, string> = {
      'Backend Developer': 'backend',
      'Frontend Developer': 'frontend',
      'Mobile Developer': 'mobile',
      'DevOps Engineer': 'devops',
      'Data Scientist': 'data_scientist',
      'Fullstack Developer': 'backend',
      'Tester / QA Engineer': 'backend',
      'DevOps Beginner': 'devops',
      'Data Analyst': 'data_scientist',
      'AI Engineer': 'data_scientist',
      'AI / Machine Learning Beginner': 'data_scientist'
    }
    const response = await apiClient.post('/roadmaps/generate', {
      targetRole: safeRole,
      roleId: options.selectedRole?.roleId ?? options.roleId ?? roleIds[safeRole] ?? 'backend',
      selectedRole: {
        roleId: options.selectedRole?.roleId ?? options.roleId ?? roleIds[safeRole] ?? 'backend',
        roleName: safeRole
      },
      level: options.level ?? 'beginner',
      durationWeeks: options.durationWeeks ?? 6,
      language: options.language ?? 'vi',
      useRoleMatching: options.useRoleMatching ?? true,
      forceRegenerate: options.forceRegenerate ?? false,
      sourceMode,
      ...(sourceMode === 'single_repo' ? { repoId: options.repoId } : {}),
      ...(sourceMode === 'selected_repos' ? { repoIds: selectedRepositoryIds } : {})
    })
    const roadmap = extractApiResource<BackendRoadmap>(response.data, ['roadmap'])
    const selectedSourceCount = sourceMode === 'single_repo'
      ? 1
      : sourceMode === 'selected_repos'
        ? selectedRepositoryIds.length
        : undefined
    const existingSource = roadmap.roadmapSource && typeof roadmap.roadmapSource === 'object' ? roadmap.roadmapSource : {}
    const enrichedRoadmap: BackendRoadmap = selectedSourceCount === undefined ? roadmap : {
      ...roadmap,
      sourceContextSummary: {
        ...roadmap.sourceContextSummary,
        repositoriesCount: selectedSourceCount
      },
      roadmapSource: {
        ...existingSource,
        sourceMode,
        totalRepositories: selectedSourceCount,
        ...(sourceMode === 'single_repo' ? { repositoryId: options.repoId } : {}),
        ...(sourceMode === 'selected_repos' ? { repositoryIds: selectedRepositoryIds } : {})
      }
    }
    return buildRecommendation(enrichedRoadmap)
  },

  async archiveRoadmap(roadmapId: string): Promise<Roadmap> {
    const response = await apiClient.patch(`/roadmaps/${roadmapId}/archive`)
    const roadmap = extractApiResource<BackendRoadmap>(response.data, ['roadmap'])
    return normalizeBackendRoadmap(roadmap)
  },

  async deleteRoadmap(roadmapId: string): Promise<void> {
    await apiClient.delete(`/roadmaps/${roadmapId}`)
  },

  async getRoadmapProgress(roadmapId: string): Promise<RoadmapProgressRecord> {
    const response = await apiClient.get(`/roadmaps/${roadmapId}/progress`)
    return normalizeProgress(extractApiResource<unknown>(response.data, ['progress']))
  },

  async updateRoadmapProgressItem(
    roadmapId: string,
    data: { itemId?: string; skillName?: string; status: 'not_started' | 'in_progress' | 'completed' | string }
  ): Promise<RoadmapProgressRecord> {
    const response = await apiClient.patch(`/roadmaps/${roadmapId}/progress/items`, data)
    return normalizeProgress(extractApiResource<unknown>(response.data, ['progress']))
  },

  async resetRoadmapProgress(roadmapId: string): Promise<RoadmapProgressRecord> {
    const response = await apiClient.post(`/roadmaps/${roadmapId}/progress/reset`)
    return normalizeProgress(extractApiResource<unknown>(response.data, ['progress']))
  }
}




