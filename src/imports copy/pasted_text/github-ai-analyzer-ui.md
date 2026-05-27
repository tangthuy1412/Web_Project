Bạn là Senior Product Designer + Senior Frontend Architect + UI/UX Engineer chuyên xây dựng dashboard SaaS hiện đại cho nền tảng AI Developer Analytics.

Hãy thiết kế và dựng toàn bộ UI/UX frontend web bằng React cho hệ thống “GitHub Repository AI Analyzer” với mục tiêu:

* Phân tích GitHub repository của sinh viên/lập trình viên.
* Đưa ra đánh giá kỹ năng, chất lượng project, hướng phát triển nghề nghiệp.
* Có AI Mentor Chat hỗ trợ học tập.

YÊU CẦU KỸ THUẬT:

* Frontend framework: React + Vite + TypeScript
* Styling: TailwindCSS
* UI library: shadcn/ui
* Icons: lucide-react
* Routing: react-router-dom
* State management: Zustand
* API client: Axios
* Form handling: React Hook Form + Zod
* Charts: Recharts
* Animation: Framer Motion
* Table: TanStack Table
* Folder structure scalable theo enterprise standard
* Responsive desktop-first nhưng mobile usable
* Dark mode support
* Code clean, reusable, component-driven

MỤC TIÊU:
Hiện tại CHƯA cần backend thật.
Hãy tập trung:

1. Dựng UI/UX hoàn chỉnh
2. Mock data realistic
3. Navigation flow đầy đủ
4. Layout chuyên nghiệp kiểu SaaS platform
5. Chuẩn bị sẵn để sau này chỉ cần connect API

Thiết kế theo style:

* Modern SaaS
* GitHub + Linear + Vercel + Notion hybrid
* Clean
* Professional
* Minimal nhưng premium
* Card-based dashboard
* AI product feeling

Màu sắc:

* Primary: Indigo/Blue
* Secondary: Slate
* Accent: Cyan/Purple gradient
* Success: Emerald
* Warning: Amber
* Danger: Red

Typography:

* Inter font
* Clear visual hierarchy

UI cần:

* Sidebar collapsible
* Sticky topbar
* Smooth transitions
* Skeleton loading
* Empty states
* Error states
* Reusable cards
* Data table professional
* Responsive layout

Tạo đầy đủ routing:

/login
/register
/dashboard
/github/connect
/repositories
/repositories/
/analysis/
/chat
/settings
/progress

Hãy tạo structure chuyên nghiệp:

src/
├── api/
├── assets/
├── components/
│    ├── common/
│    ├── layout/
│    ├── dashboard/
│    ├── repository/
│    ├── analysis/
│    ├── chat/
│    ├── settings/
│    └── ui/
├── features/
├── hooks/
├── layouts/
├── lib/
├── mock/
├── pages/
├── routes/
├── services/
├── stores/
├── types/
├── utils/
└── main.tsx

1. AUTH PAGES

* Login page
* Register page

Yêu cầu:

* Split layout
* Left: branding + illustration
* Right: auth form
* Validation UI
* Social login buttons
* Remember me
* Password visibility toggle
* Elegant UI

====================================

2. DASHBOARD PAGE

Hiển thị:

* Welcome section
* GitHub connection status
* Total repositories
* Total analyzed repositories
* Skill overview
* Recent analysis
* Quick actions
* AI recommendation cards
* Career direction card
* Charts:

  * language distribution
  * analysis progress
  * skill radar

Dashboard phải giống SaaS analytics thực tế.

====================================

3. GITHUB CONNECT PAGE

Features:

* Connect GitHub account
* PAT token input
* OAuth connect button
* Connected account card
* Disconnect/reconnect actions
* Security notes
* GitHub integration guide

====================================

4. REPOSITORY LIST PAGE

Professional data table gồm:

* Repository name
* Description
* Language
* Stars
* Updated date
* README status
* Analyze status
* Actions

Features:

* Search
* Filter
* Sort
* Pagination
* Row action dropdown
* Analyze button
* Status badges

UI phải giống GitHub/Vercel admin dashboard.

====================================

5. REPOSITORY DETAIL PAGE

Sections:

* Repository metadata
* README summary
* Package dependencies
* Commit summary
* Branch overview
* Contribution insights
* Analyze CTA

Dùng tabs layout.

====================================

6. ANALYSIS RESULT PAGE (CORE)

Đây là page quan trọng nhất.

Hiển thị:

* Project type
* Tech stack
* Architecture quality
* Repo completeness
* Commit quality
* Documentation quality
* Code convention quality
* Strengths
* Weaknesses
* AI recommendations
* Missing skills
* Suggested learning path
* Career direction
* Portfolio readiness checklist

UI requirements:

* Progress bars
* Score cards
* Insight cards
* Expandable sections
* Severity badges
* Charts
* Tabs
* Recommendation timeline

Thiết kế kiểu AI audit platform chuyên nghiệp.

====================================

7. CHAT AI PAGE

Layout:

* Session sidebar
* Chat history
* AI typing animation
* Suggested prompts
* Repo context panel

Features:

* Markdown rendering
* Code block rendering
* Message actions
* Auto scroll
* Empty chat state

Style:

* ChatGPT + Linear hybrid

====================================

8. SETTINGS PAGE

Sections:

* Profile
* GitHub integration
* Preferences
* Theme
* Logout

====================================

9. PROGRESS PAGE

Hiển thị:

* Analysis history
* Improvement over time
* Skill growth
* Missing skill trends
* Career direction evolution

Charts:

* Line charts
* Area charts
* Bar charts

Reusable:

* AppSidebar
* Topbar
* PageHeader
* StatsCard
* EmptyState
* ErrorState
* LoadingSkeleton
* DataTable
* SearchBar
* FilterDropdown
* ConfirmModal
* AnalysisScoreCard
* RecommendationCard
* SkillBadge
* RepoCard
* ChatMessage
* AIInsightCard

Tạo realistic mock data:

* repositories
* analysis results
* chat sessions
* recommendations
* dashboard stats
* user profile

Hãy:

1. Tạo toàn bộ project structure
2. Tạo routing setup
3. Tạo layout system
4. Tạo reusable UI components
5. Tạo từng page hoàn chỉnh
6. Tạo mock data
7. Tạo responsive UI
8. Tạo dark mode
9. Viết code sạch, modular
10. Viết như production-ready frontend

QUAN TRỌNG:

* Không viết pseudo-code.
* Viết code React TypeScript thật.
* Component reusable thực tế.
* UI phải đẹp như sản phẩm startup AI thật.
* Ưu tiên UX và visual hierarchy.
* Tạo trải nghiệm chuyên nghiệp cho nhà tuyển dụng/demo.
