import { useEffect, useState, type ComponentType } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Compass,
  Database,
  Flame,
  GitBranch,
  Github,
  GraduationCap,
  LineChart,
  Linkedin,
  Lock,
  Menu,
  MessageSquare,
  Moon,
  Play,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  User,
  Users,
  X
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/authStore'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../lib/utils'

type IconType = ComponentType<{ className?: string }>

type Feature = {
  title: string
  description: string
  icon: IconType
  accent: string
  className?: string
}

const navItems = [
  { label: 'Tính năng', href: '#features' },
  { label: 'Lộ trình học', href: '#roadmap' },
  { label: 'AI Mentor', href: '#mentor' },
  { label: 'Theo dõi tiến độ', href: '#progress' },
  { label: 'Bảng giá', href: '#pricing' },
  { label: 'FAQ', href: '#faq' }
]

const stats = [
  { value: '128K+', label: 'repositories đã phân tích' },
  { value: '42K+', label: 'roadmap được tạo' },
  { value: '1.8M+', label: 'AI recommendations' }
]

const features: Feature[] = [
  {
    title: 'AI Phân Tích Repository',
    description: 'Đọc cấu trúc dự án, commit, dependency, test và convention để tạo điểm số kỹ thuật có ngữ cảnh.',
    icon: BrainCircuit,
    accent: 'from-indigo-500 to-cyan-400',
    className: 'lg:col-span-2'
  },
  {
    title: 'Sinh Lộ Trình Cá Nhân Hóa',
    description: 'Biến gap kỹ năng thành các milestone học tập rõ ràng theo vai trò mục tiêu.',
    icon: GraduationCap,
    accent: 'from-violet-500 to-fuchsia-400'
  },
  {
    title: 'Định Hướng Nghề Nghiệp',
    description: 'Gợi ý role phù hợp dựa trên portfolio GitHub và mức độ sẵn sàng thực tế.',
    icon: Compass,
    accent: 'from-blue-500 to-indigo-400'
  },
  {
    title: 'Phân Tích Skill Gap',
    description: 'So sánh kỹ năng hiện tại với chuẩn Frontend, Backend, Fullstack, DevOps và AI Engineer.',
    icon: Radar,
    accent: 'from-emerald-500 to-cyan-400'
  },
  {
    title: 'Theo Dõi Tiến Trình Học',
    description: 'XP, streak, completion rate, milestone và activity timeline trong một dashboard thống nhất.',
    icon: Activity,
    accent: 'from-amber-500 to-rose-400',
    className: 'lg:col-span-2'
  },
  {
    title: 'AI Mentor',
    description: 'Hỏi đáp trực tiếp về repo, career path, portfolio và việc nên học gì tiếp theo.',
    icon: Bot,
    accent: 'from-purple-500 to-blue-400'
  },
  {
    title: 'Kết Nối GitHub',
    description: 'OAuth flow rõ ràng, chỉ phân tích repository bạn chọn và minh bạch về dữ liệu.',
    icon: Github,
    accent: 'from-slate-700 to-indigo-500'
  },
  {
    title: 'Báo Cáo Phát Triển Kỹ Năng',
    description: 'Tổng hợp điểm mạnh, điểm yếu và đề xuất cải thiện theo từng sprint học tập.',
    icon: LineChart,
    accent: 'from-cyan-500 to-blue-500'
  }
]

const roadmapNodes = [
  { label: 'JavaScript', progress: 92, time: '2 tuần', state: 'done' },
  { label: 'TypeScript', progress: 76, time: '3 tuần', state: 'active' },
  { label: 'React', progress: 84, time: '4 tuần', state: 'active' },
  { label: 'NextJS', progress: 42, time: '3 tuần', state: 'next' },
  { label: 'Testing', progress: 31, time: '2 tuần', state: 'next' },
  { label: 'CI/CD', progress: 18, time: '2 tuần', state: 'next' },
  { label: 'System Design', progress: 12, time: '4 tuần', state: 'next' }
]

const testimonials = [
  {
    name: 'Minh Anh',
    role: 'Frontend Engineer',
    company: 'Fintech Studio',
    quote: 'Tôi biết chính xác repo nào cần test, document và refactor trước khi apply vị trí mới.',
    avatar: 'MA'
  },
  {
    name: 'Hoàng Nam',
    role: 'Backend Developer',
    company: 'CloudOps Labs',
    quote: 'Roadmap không chung chung. Nó bám vào project GitHub của tôi và chỉ ra gap rất cụ thể.',
    avatar: 'HN'
  },
  {
    name: 'Linh Phạm',
    role: 'Computer Science Student',
    company: 'HCM University',
    quote: 'AI Mentor giúp tôi chuyển portfolio từ bài tập rời rạc thành một kế hoạch nghề nghiệp rõ ràng.',
    avatar: 'LP'
  }
]

const pricingPlans = [
  {
    name: 'Free',
    price: '0đ',
    description: 'Dành cho lập trình viên muốn kiểm tra portfolio ban đầu.',
    features: ['3 repository scans', '1 roadmap cá nhân', 'Skill summary cơ bản', 'Community support']
  },
  {
    name: 'Premium',
    price: '199Kđ',
    description: 'Dành cho người đang chuẩn bị phỏng vấn hoặc nâng cấp career path.',
    features: ['Quét không giới hạn', 'AI Mentor không giới hạn', 'Điểm sẵn sàng nghề nghiệp', 'Phân tích tiến độ', 'Xuất báo cáo'],
    highlighted: true
  },
  {
    name: 'Team',
    price: 'Liên hệ',
    description: 'Dành cho mentor, bootcamp và đội ngũ kỹ thuật.',
    features: ['Dashboard đội nhóm', 'Nhóm học tập', 'Phân tích cho admin', 'Workspace riêng tư', 'Hỗ trợ ưu tiên']
  }
]

const faqs = [
  {
    question: 'AI phân tích source code như thế nào?',
    answer: 'Hệ thống đọc metadata repository, cấu trúc thư mục, dependency, convention, test coverage giả lập, commit pattern và tài liệu để tạo insight kỹ năng. Kết quả được trình bày thành score, skill gap và roadmap.'
  },
  {
    question: 'Dữ liệu GitHub có an toàn không?',
    answer: 'Luồng sản phẩm được thiết kế theo nguyên tắc chỉ phân tích repository bạn cấp quyền. Landing page này mô phỏng trải nghiệm sản phẩm; khi triển khai production nên bổ sung OAuth scope tối thiểu, mã hóa token và chính sách retention rõ ràng.'
  },
  {
    question: 'Roadmap có chính xác không?',
    answer: 'Roadmap dựa trên repository thực tế, vai trò mục tiêu và mức độ hiện tại. Người dùng vẫn có thể tinh chỉnh mục tiêu để AI Mentor cập nhật milestone phù hợp hơn.'
  },
  {
    question: 'Có thể tạo nhiều roadmap không?',
    answer: 'Có. Bạn có thể tạo roadmap cho Frontend, Backend, Fullstack, DevOps hoặc AI Engineer và theo dõi tiến độ riêng cho từng mục tiêu.'
  },
  {
    question: 'AI Mentor hoạt động như thế nào?',
    answer: 'AI Mentor trả lời câu hỏi dựa trên phân tích portfolio, skill gap và roadmap hiện tại, sau đó đề xuất bài học, project cải thiện hoặc bước tiếp theo.'
  }
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
}

const SectionHeader = ({
  eyebrow,
  title,
  description
}: {
  eyebrow: string
  title: string
  description: string
}) => (
  <motion.div
    className="mx-auto max-w-3xl text-center"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-120px' }}
    variants={fadeUp}
    transition={{ duration: 0.55 }}
  >
    <Badge variant="info" className="mb-4 border border-cyan-300/30 bg-cyan-100/80 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
      {eyebrow}
    </Badge>
    <h2 className="text-3xl font-bold leading-tight text-slate-950 dark:text-white md:text-5xl">
      {title}
    </h2>
    <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">
      {description}
    </p>
  </motion.div>
)

export const LandingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, user } = useAuthStore()
  const displayName = user?.name || user?.email || 'Tài khoản'

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-all duration-300',
        isScrolled
          ? 'border-slate-200/80 bg-white/80 shadow-sm shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/78 dark:shadow-black/20'
          : 'border-transparent bg-transparent',
        isAuthenticated && 'landing-authenticated'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white shadow-lg shadow-indigo-500/20 dark:bg-white dark:text-slate-950">
            <GitBranch className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-950 dark:text-white">GitAnalyzer AI</span>
            <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">Repository intelligence</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAuthenticated && (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  {displayName}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="sm">
                  Vào Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
          <Link to="/login" className={isAuthenticated ? 'hidden' : undefined}>
            <Button variant="ghost" size="sm">Đăng nhập</Button>
          </Link>
          <Link to="/register" className={isAuthenticated ? 'hidden' : undefined}>
            <Button variant="outline" size="sm">Đăng ký</Button>
          </Link>
          <Link to="/github/connect" className={isAuthenticated ? 'hidden' : undefined}>
            <Button size="sm">
              <Github className="mr-2 h-4 w-4" />
              Kết nối GitHub
            </Button>
          </Link>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white/70 text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-white lg:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 lg:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            {isAuthenticated && (
              <>
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    {displayName}
                  </Button>
                </Link>
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button className="w-full">
                    Vào Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
            <Link to="/login"><Button variant="outline" className="w-full">Đăng nhập</Button></Link>
            <Link to="/github/connect"><Button className="w-full"><Github className="mr-2 h-4 w-4" />Kết nối GitHub</Button></Link>
          </div>
        </div>
      )}
    </header>
  )
}

const SkillRadar = () => (
  <div className="relative mx-auto flex aspect-square w-full max-w-[230px] items-center justify-center">
    {[0, 1, 2].map((ring) => (
      <div
        key={ring}
        className="absolute rounded-full border border-indigo-300/40 dark:border-indigo-300/20"
        style={{ width: `${96 - ring * 24}%`, height: `${96 - ring * 24}%` }}
      />
    ))}
    <div className="absolute h-px w-full bg-indigo-300/30" />
    <div className="absolute h-full w-px bg-indigo-300/30" />
    <div className="absolute h-px w-full rotate-45 bg-indigo-300/20" />
    <div className="absolute h-px w-full -rotate-45 bg-indigo-300/20" />
    <motion.div
      className="h-[62%] w-[62%] rounded-[38%_62%_48%_52%] border border-cyan-300/70 bg-cyan-400/20 shadow-2xl shadow-cyan-500/20"
      animate={{ rotate: [0, 4, -3, 0], scale: [1, 1.03, 0.98, 1] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    />
    <span className="absolute rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">Skill Radar</span>
  </div>
)

const HeroDashboard = () => (
  <motion.div
    className="relative"
    initial={{ opacity: 0, y: 24, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.7, delay: 0.15 }}
  >
    <div className="absolute -inset-8 rounded-full bg-indigo-500/20 blur-3xl" />
    <div className="relative overflow-hidden rounded-lg border border-white/70 bg-white/80 p-4 shadow-2xl shadow-indigo-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70 dark:shadow-black/40">
      <div className="mb-4 flex items-center justify-between border-b border-slate-200/70 pb-4 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <Badge variant="success" className="bg-emerald-100/80 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
          Live analysis
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Phân tích repository</p>
                <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">portfolio-dashboard</h3>
              </div>
              <div className="rounded-lg bg-indigo-600 px-3 py-2 text-center text-white shadow-lg shadow-indigo-600/25">
                <p className="text-2xl font-bold">86</p>
                <p className="text-[10px] uppercase">AI score</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {['Code', 'Tests', 'Docs'].map((label, index) => (
                <div key={label} className="rounded-md border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{[91, 72, 84][index]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Lộ trình học</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">12 tuần</span>
            </div>
            <div className="space-y-3">
              {['TypeScript Advanced', 'React Performance', 'Testing Strategy'].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white', index === 0 ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-700')}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${[76, 48, 32][index]}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
            <SkillRadar />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-xl shadow-slate-950/20 dark:border-white/10">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-semibold">AI Insight</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Bạn mạnh về UI architecture, cần bổ sung integration testing và CI pipeline để đạt readiness cho Frontend Engineer.
            </p>
          </div>
        </div>
      </div>
    </div>

    {[
      { label: 'Skill Gap', value: 'Testing -28%', className: '-left-4 top-16' },
      { label: 'Career Path', value: 'Frontend Engineer', className: '-right-3 top-8' },
      { label: 'Đề xuất', value: 'NextJS, Vitest', className: 'bottom-10 -left-6' }
    ].map((card, index) => (
      <motion.div
        key={card.label}
        className={cn('absolute hidden rounded-lg border border-white/70 bg-white/85 px-4 py-3 shadow-xl shadow-indigo-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85 lg:block', card.className)}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5 + index, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
        <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{card.value}</p>
      </motion.div>
    ))}
  </motion.div>
)

export const HeroSection = () => (
  <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-28 lg:pt-36">
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.24),transparent_26rem),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.2),transparent_24rem),linear-gradient(135deg,#f8fafc,#eef2ff_46%,#f8fafc)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.26),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.16),transparent_24rem),linear-gradient(135deg,#020617,#0f172a_50%,#111827)]" />
    <div className="absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.35)_1px,transparent_0)] [background-size:28px_28px]" />
    <motion.div
      className="absolute left-1/2 top-20 -z-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
      animate={{ x: [-80, 80, -80], y: [0, 40, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />

    <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
      <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl">
        <motion.div variants={fadeUp}>
          <Badge variant="info" className="mb-5 border border-indigo-300/40 bg-white/70 text-indigo-700 shadow-sm dark:bg-white/10 dark:text-indigo-200">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            AI-first career intelligence for developers
          </Badge>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="text-4xl font-bold leading-[1.08] text-slate-950 dark:text-white sm:text-5xl lg:text-6xl"
        >
          Biến GitHub Thành Công Cụ Tăng Trưởng Sự Nghiệp Cá Nhân
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Sử dụng AI để phân tích source code, đánh giá kỹ năng, xác định khoảng trống kiến thức và tạo lộ trình học tập cá nhân hóa dành riêng cho bạn.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/github/connect">
            <Button size="lg" className="w-full shadow-xl shadow-indigo-600/20 sm:w-auto">
              <Github className="mr-2 h-5 w-5" />
              Phân tích miễn phí
            </Button>
          </Link>
          <a href="#mentor">
            <Button variant="outline" size="lg" className="w-full border-slate-300/80 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-white/10 sm:w-auto">
              <Play className="mr-2 h-5 w-5" />
              Xem Demo
            </Button>
          </a>
        </motion.div>
        <motion.div variants={fadeUp} className="mt-8 grid max-w-xl grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/70 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <p className="text-xl font-bold text-slate-950 dark:text-white">{stat.value}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <HeroDashboard />
    </div>
  </section>
)

export const SocialProofSection = () => (
  <section className="border-y border-slate-200/80 bg-white/70 px-4 py-10 backdrop-blur dark:border-white/10 dark:bg-slate-950/60 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-600 dark:text-indigo-300">Được tin dùng bởi cộng đồng lập trình viên</p>
          <div className="mt-4 flex -space-x-3">
            {['AN', 'TB', 'JS', 'KL', 'MP', 'VX'].map((avatar, index) => (
              <div key={avatar} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-indigo-500 to-cyan-400 text-xs font-bold text-white shadow-sm dark:border-slate-950">
                {index < 5 ? avatar : '+8K'}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {['React', 'Node', 'Python', 'Docker', 'Vercel', 'GitHub'].map((logo) => (
            <div key={logo} className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-center text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {logo}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
)

export const ProblemSection = () => (
  <section className="px-4 py-20 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <SectionHeader
        eyebrow="Vấn đề"
        title="Phần lớn lập trình viên không biết nên học gì tiếp theo"
        description="Công nghệ thay đổi nhanh, khóa học quá nhiều và feedback thường mơ hồ. GitAnalyzer AI biến portfolio thật thành bản đồ phát triển kỹ năng."
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <motion.div
          className="rounded-lg border border-rose-200 bg-rose-50/80 p-6 dark:border-rose-500/20 dark:bg-rose-500/10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h3 className="text-2xl font-bold text-slate-950 dark:text-white">Không sử dụng nền tảng</h3>
          <div className="mt-6 space-y-4">
            {['Quá nhiều công nghệ phải chọn', 'Không có lộ trình rõ ràng', 'Không biết mình thiếu kỹ năng gì', 'Học lan man theo trend', 'Thiếu phản hồi khách quan'].map((item) => (
              <div key={item} className="flex items-start gap-3 text-slate-700 dark:text-slate-200">
                <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div
          className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-2xl font-bold text-slate-950 dark:text-white">Sử dụng GitAnalyzer AI</h3>
          <div className="mt-6 space-y-4">
            {['Phân tích trực tiếp từ repository', 'Biết điểm mạnh và điểm yếu', 'Roadmap cá nhân hóa theo role', 'AI Mentor hướng dẫn bước tiếp theo', 'Theo dõi tiến độ bằng dữ liệu'].map((item) => (
              <div key={item} className="flex items-start gap-3 text-slate-700 dark:text-slate-200">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
)

export const FeaturesSection = () => (
  <section id="features" className="bg-slate-50/80 px-4 py-20 dark:bg-slate-900/40 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <SectionHeader
        eyebrow="Tính năng"
        title="Một hệ điều hành phát triển kỹ năng cho lập trình viên"
        description="Bento grid tập trung vào các workflow thực tế: phân tích repo, hiểu skill gap, tạo roadmap và theo dõi cải thiện theo thời gian."
      />
      <motion.div
        className="mt-12 grid auto-rows-[minmax(220px,auto)] gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={stagger}
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={fadeUp}
            className={cn('group overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 dark:border-white/10 dark:bg-slate-950/70 dark:hover:shadow-black/20', feature.className)}
          >
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-lg', feature.accent)}>
              <feature.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>AI signal</span>
                <span>Độ tin cậy cao</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <motion.div
                  className={cn('h-full rounded-full bg-gradient-to-r', feature.accent)}
                  initial={{ width: 0 }}
                  whileInView={{ width: feature.className ? '88%' : '72%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
)

export const HowItWorksSection = () => (
  <section className="px-4 py-20 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <SectionHeader
        eyebrow="Cách hoạt động"
        title="Từ GitHub đến roadmap chỉ trong 3 bước"
        description="Workflow được thiết kế cho lập trình viên: cấp quyền, chọn repository, nhận insight và bắt đầu học ngay."
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {[
          { title: 'Kết nối GitHub', description: 'Đăng nhập và chọn repository cần phân tích.', icon: Github },
          { title: 'AI phân tích source code', description: 'Hệ thống đọc cấu trúc, dependency, commit và quality signals.', icon: BrainCircuit },
          { title: 'Nhận roadmap cá nhân hóa', description: 'Skill gap được chuyển thành milestone, deadline và next actions.', icon: Rocket }
        ].map((step, index) => (
          <motion.div
            key={step.title}
            className="relative rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ delay: index * 0.08 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <step.icon className="h-6 w-6" />
            </div>
            <p className="mt-6 text-sm font-bold text-indigo-600 dark:text-indigo-300">Bước {index + 1}</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{step.title}</h3>
            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{step.description}</p>
            {index < 2 && <ChevronRight className="absolute -right-5 top-1/2 hidden h-8 w-8 text-indigo-300 lg:block" />}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

export const RoadmapSection = () => (
  <section id="roadmap" className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div>
        <Badge variant="info" className="mb-4 bg-cyan-400/10 text-cyan-300">Lộ trình học bằng AI</Badge>
        <h2 className="text-3xl font-bold leading-tight md:text-5xl">Roadmap trực quan dựa trên repository thật</h2>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          Ví dụ cho Frontend Developer: JavaScript, TypeScript, React, NextJS, Testing, CI/CD và System Design được sắp xếp theo mức độ ưu tiên.
        </p>
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            ['76%', 'Tiến độ'],
            ['7', 'Milestones'],
            ['20 tuần', 'Estimated']
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <motion.div
        className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Career track</p>
            <h3 className="text-2xl font-bold">Frontend Developer</h3>
          </div>
          <Badge variant="success" className="bg-emerald-400/10 text-emerald-300">Active</Badge>
        </div>
        <div className="relative space-y-3 pl-5 before:absolute before:left-[1.15rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-indigo-400/30">
          {roadmapNodes.map((node) => (
            <motion.div key={node.label} variants={fadeUp} className="relative flex gap-4 rounded-lg border border-white/10 bg-slate-900/80 p-4">
              <span className={cn('relative z-10 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-xs font-bold', node.state === 'done' ? 'border-emerald-300 bg-emerald-400 text-slate-950' : node.state === 'active' ? 'border-indigo-300 bg-indigo-500 text-white' : 'border-white/20 bg-slate-800 text-slate-300')}>
                {node.state === 'done' ? <Check className="h-4 w-4" /> : node.label[0]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{node.label}</p>
                  <span className="text-xs text-slate-400">{node.time}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300" style={{ width: `${node.progress}%` }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
)

export const ProgressSection = () => (
  <section id="progress" className="px-4 py-20 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <SectionHeader
        eyebrow="Theo dõi tiến độ"
        title="Theo dõi tiến trình như một sản phẩm học tập nghiêm túc"
        description="XP, level, streak, achievements và analytics giúp người học biết mình đang tiến bộ thật sự."
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {[
            { label: 'XP', value: '12,840', icon: Trophy, color: 'text-amber-500' },
            { label: 'Level', value: '24', icon: BadgeCheck, color: 'text-indigo-500' },
            { label: 'Streak', value: '18 ngày', icon: Flame, color: 'text-rose-500' },
            { label: 'Hoàn thành', value: '76%', icon: Target, color: 'text-emerald-500' }
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
              <item.icon className={cn('h-6 w-6', item.color)} />
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-950 dark:text-white">Phân tích học tập</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Activity timeline trong 7 tuần gần nhất</p>
            </div>
            <BarChart3 className="h-6 w-6 text-indigo-500" />
          </div>
          <div className="flex h-64 items-end gap-3 rounded-lg bg-slate-50 p-4 dark:bg-white/5">
            {[44, 68, 52, 82, 74, 92, 78].map((height, index) => (
              <motion.div
                key={index}
                className="flex flex-1 flex-col items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400 shadow-lg shadow-indigo-500/10" style={{ height: `${height}%` }} />
                <span className="text-xs text-slate-500 dark:text-slate-400">W{index + 1}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {['Hoàn thành React Performance milestone', 'Thêm 12 unit tests cho repository chính', 'AI Mentor cập nhật roadmap NextJS'].map((activity) => (
              <div key={activity} className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-white/10">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <p className="text-sm text-slate-700 dark:text-slate-300">{activity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
)

export const AIMentorSection = () => (
  <section id="mentor" className="bg-slate-50/80 px-4 py-20 dark:bg-slate-900/40 sm:px-6 lg:px-8">
    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div>
        <Badge variant="info" className="mb-4">AI Mentor</Badge>
        <h2 className="text-3xl font-bold leading-tight text-slate-950 dark:text-white md:text-5xl">Hỏi AI bằng ngôn ngữ nghề nghiệp của developer</h2>
        <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Mentor hiểu context từ GitHub, roadmap và skill gap để đưa ra gợi ý thực tế thay vì lời khuyên chung chung.
        </p>
        <div className="mt-8 grid gap-3">
          {['Tôi nên học gì tiếp theo?', 'Tôi cần bổ sung gì để trở thành Backend Engineer?', 'Phân tích portfolio GitHub của tôi'].map((prompt) => (
            <div key={prompt} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/70">
              <MessageSquare className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{prompt}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/70 dark:border-white/10 dark:bg-slate-950/80 dark:shadow-black/20">
        <div className="border-b border-slate-200 pb-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-950 dark:text-white">GitAnalyzer Mentor</p>
              <p className="text-xs text-emerald-500">Online with repository context</p>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <div className="ml-auto max-w-[82%] rounded-lg bg-indigo-600 px-4 py-3 text-sm leading-6 text-white">
            Tôi nên học gì tiếp theo để trở thành Frontend Engineer?
          </div>
          <div className="max-w-[88%] rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            Dựa trên repo của bạn, ưu tiên tiếp theo là Testing Strategy. Bạn đã có React tốt, nhưng thiếu unit test, integration test và CI quality gate.
          </div>
          <div className="grid gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-400/20 dark:bg-indigo-400/10">
            {['Tuần 1: Vitest + React Testing Library', 'Tuần 2: Mock API và integration flow', 'Tuần 3: GitHub Actions quality gate'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
)

export const CareerInsightsSection = () => (
  <section className="px-4 py-20 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <SectionHeader
        eyebrow="Career Insights"
        title="Định hướng nghề nghiệp từ dữ liệu dự án thực tế"
        description="Skill radar, readiness score, điểm mạnh, điểm yếu và role phù hợp được trình bày trong một bức tranh dễ hành động."
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-950/70">
          <SkillRadar />
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Career Readiness Score</p>
            <p className="mt-1 text-4xl font-bold text-slate-950 dark:text-white">82/100</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-950/70">
          <h3 className="text-xl font-bold text-slate-950 dark:text-white">Điểm mạnh</h3>
          <div className="mt-5 space-y-3">
            {['React component architecture', 'Clean UI implementation', 'Git workflow ổn định', 'API integration căn bản'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <h3 className="mt-8 text-xl font-bold text-slate-950 dark:text-white">Điểm yếu</h3>
          <div className="mt-5 space-y-3">
            {['Testing coverage thấp', 'CI/CD chưa rõ', 'System design cần luyện thêm'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <Target className="h-4 w-4 text-amber-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-950/70">
          <h3 className="text-xl font-bold text-slate-950 dark:text-white">Vai trò đề xuất</h3>
          <div className="mt-5 space-y-3">
            {[
              ['Frontend Engineer', '92% match'],
              ['Fullstack Engineer', '78% match'],
              ['Backend Engineer', '64% match'],
              ['DevOps Engineer', '51% match'],
              ['AI Engineer', '46% match']
            ].map(([role, match]) => (
              <div key={role} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{role}</span>
                  <span className="text-sm text-indigo-600 dark:text-indigo-300">{match}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
)

export const TestimonialsSection = () => (
  <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Badge variant="info" className="mb-4 bg-cyan-400/10 text-cyan-300">Testimonials</Badge>
          <h2 className="max-w-3xl text-3xl font-bold leading-tight md:text-5xl">Developer dùng GitHub như bản đồ phát triển kỹ năng</h2>
        </div>
        <div className="flex gap-1 text-amber-300">
          {[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-5 w-5 fill-current" />)}
        </div>
      </div>
      <motion.div
        className="mt-12 grid gap-4 lg:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        {testimonials.map((testimonial) => (
          <motion.div key={testimonial.name} variants={fadeUp} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold">
                {testimonial.avatar}
              </div>
              <div>
                <p className="font-bold">{testimonial.name}</p>
                <p className="text-sm text-slate-400">{testimonial.role} - {testimonial.company}</p>
              </div>
            </div>
            <p className="mt-5 leading-7 text-slate-300">"{testimonial.quote}"</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
)

export const PricingSection = () => (
  <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <SectionHeader
        eyebrow="Pricing"
        title="Bắt đầu miễn phí, nâng cấp khi portfolio cần nhiều insight hơn"
        description="Các gói được thiết kế cho cá nhân, người đang phỏng vấn và đội ngũ đào tạo developer."
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'rounded-lg border bg-white p-6 shadow-sm dark:bg-slate-950/70',
              plan.highlighted
                ? 'border-indigo-300 shadow-2xl shadow-indigo-500/15 ring-2 ring-indigo-500/20 dark:border-indigo-400/50'
                : 'border-slate-200 dark:border-white/10'
            )}
          >
            {plan.highlighted && <Badge variant="info" className="mb-4">Phổ biến nhất</Badge>}
            <h3 className="text-2xl font-bold text-slate-950 dark:text-white">{plan.name}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.description}</p>
            <p className="mt-6 text-4xl font-bold text-slate-950 dark:text-white">{plan.price}</p>
            <Link to={plan.name === 'Free' ? '/github/connect' : '/register'} className="mt-6 block">
              <Button className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
                {plan.name === 'Team' ? 'Liên hệ tư vấn' : 'Bắt đầu'}
              </Button>
            </Link>
            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export const FAQSection = () => (
  <section id="faq" className="bg-slate-50/80 px-4 py-20 dark:bg-slate-900/40 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-4xl">
      <SectionHeader
        eyebrow="FAQ"
        title="Câu hỏi thường gặp"
        description="Những điểm quan trọng về phân tích source code, dữ liệu GitHub, roadmap và AI Mentor."
      />
      <Accordion type="single" collapsible className="mt-10 rounded-lg border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-slate-950/70">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.question} value={`item-${index}`} className="border-slate-200 dark:border-white/10">
            <AccordionTrigger className="text-left text-base font-semibold text-slate-950 hover:no-underline dark:text-white">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="leading-7 text-slate-600 dark:text-slate-300">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
)

export const FinalCTASection = () => (
  <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.28),transparent_26rem),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.24),transparent_22rem)]" />
    <motion.div
      className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white/80 p-8 text-center shadow-2xl shadow-indigo-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/75 md:p-12"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
    >
      <Badge variant="info" className="mb-5">Start now</Badge>
      <h2 className="text-3xl font-bold leading-tight text-slate-950 dark:text-white md:text-5xl">
        Bắt Đầu Hành Trình Trở Thành Lập Trình Viên Tốt Hơn Ngay Hôm Nay
      </h2>
      <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
        Kết nối GitHub, phân tích repository đầu tiên và nhận roadmap học tập cá nhân hóa trong vài phút.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/github/connect">
          <Button size="lg" className="w-full sm:w-auto">
            <Github className="mr-2 h-5 w-5" />
            Kết nối GitHub
          </Button>
        </Link>
        <Link to="/login">
          <Button size="lg" variant="outline" className="w-full sm:w-auto">
            Bắt đầu miễn phí
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </motion.div>
  </section>
)

export const FooterSection = () => (
  <footer className="border-t border-slate-200 bg-white px-4 py-12 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <GitBranch className="h-5 w-5" />
          </span>
          <span className="font-bold text-slate-950 dark:text-white">GitAnalyzer AI</span>
        </div>
        <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
          Nền tảng phân tích repository GitHub bằng AI và tạo lộ trình học cá nhân hóa cho developer muốn phát triển bằng dữ liệu thực tế.
        </p>
        <div className="mt-5 flex gap-2">
          {[Github, Linkedin, X].map((Icon, index) => (
            <a key={index} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 dark:border-white/10 dark:text-slate-300">
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
      {[
        ['Tính năng', 'Phân tích repository', 'Skill Gap', 'AI Mentor', 'Theo dõi tiến độ'],
        ['Roadmap', 'Frontend', 'Backend', 'Fullstack', 'DevOps'],
        ['Company', 'Pricing', 'Documentation', 'Chính sách bảo mật', 'Điều khoản sử dụng']
      ].map(([title, ...links]) => (
        <div key={title}>
          <h3 className="font-bold text-slate-950 dark:text-white">{title}</h3>
          <div className="mt-4 grid gap-3">
            {links.map((link) => (
              <a key={link} href="#" className="text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">
                {link}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  </footer>
)

export const LandingPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <SocialProofSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <RoadmapSection />
        <ProgressSection />
        <AIMentorSection />
        <CareerInsightsSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <FooterSection />
    </div>
  )
}
