import type {
  AIRecommendation,
  Roadmap,
  RoadmapCategory,
  SkillProgress,
  UserLearningStats
} from '../types'

export const roadmapCategories: (RoadmapCategory | 'All')[] = [
  'All',
  'Frontend',
  'Backend',
  'Fullstack',
  'DevOps',
  'Mobile',
  'AI/ML',
  'System Design',
  'Testing',
  'Blockchain',
  'Cloud'
]

const resource = (id: string, title: string, type: 'article' | 'video' | 'docs' | 'course' | 'repo' | 'exercise') => ({
  id,
  title,
  type,
  url: '#',
  provider: type === 'docs' ? 'Tài liệu chính thức' : type === 'repo' ? 'GitHub' : 'GitAnalyzer Academy',
  estimatedMinutes: type === 'exercise' ? 75 : 30
})

export const mockRoadmaps: Roadmap[] = [
  {
    id: 'roadmap-fullstack-production',
    slug: 'fullstack-production-engineer',
    title: 'Full-Stack Engineer hướng production',
    subtitle: 'Backend, testing, Docker, CI/CD và kỷ luật triển khai cho developer mạnh frontend.',
    description:
      'Lộ trình thực tế từ ứng dụng React chỉn chu tới hệ thống production đáng tin cậy với API, persistence, automated tests, container và delivery pipeline.',
    category: 'Fullstack',
    difficulty: 'Intermediate',
    estimatedWeeks: 10,
    estimatedHours: 86,
    requiredSkills: ['React fundamentals', 'JavaScript', 'Git', 'HTTP basics'],
    objectives: [
      'Design and ship REST APIs with reliable validation and error handling',
      'Model relational data in PostgreSQL and Prisma-style schemas',
      'Add automated tests across units, integrations and user flows',
      'Containerize services and automate delivery with GitHub Actions'
    ],
    tags: ['Node.js', 'PostgreSQL', 'Docker', 'GitHub Actions', 'Testing'],
    popularity: 94,
    rating: 4.9,
    learners: 18420,
    isFeatured: true,
    isAIRecommended: true,
    progress: 46,
    createdFrom: 'ai',
    careerOutcome: 'Full-Stack Engineer',
    modules: [
      {
        id: 'module-api-foundations',
        title: 'Nền tảng API',
        description: 'Xây dựng ranh giới service, controller, validation và tài liệu API dễ bảo trì.',
        order: 1,
        estimatedHours: 22,
        milestones: [
          {
            id: 'mile-api-contract',
            title: 'API contract đạt chuẩn portfolio',
            description: 'Hoàn thiện endpoint có tài liệu, validation và phản hồi lỗi nhất quán.',
            targetWeek: 2,
            nodeIds: ['node-node-runtime', 'node-rest-api', 'node-validation'],
            rewardXp: 450,
            completed: true
          }
        ],
        nodes: [
          {
            id: 'node-node-runtime',
            title: 'Node.js Runtime và cấu trúc service',
            description: 'Hiểu event loop cơ bản, cấu hình môi trường, ranh giới thư mục và script sẵn sàng production.',
            estimatedHours: 5,
            difficulty: 'Beginner',
            dependencies: [],
            status: 'completed',
            skills: ['Node.js', 'Backend Architecture'],
            resources: [
              resource('res-node-docs', 'Node.js runtime essentials', 'docs'),
              resource('res-service-layout', 'Service folder structure patterns', 'article')
            ],
            project: 'Tạo health-check service với cấu hình có cấu trúc.',
            quiz: { questions: 8, passingScore: 80 },
            xp: 160
          },
          {
            id: 'node-rest-api',
            title: 'Thiết kế REST API',
            description: 'Mô hình hóa resource, status code, phân trang, lọc và vòng đời request.',
            estimatedHours: 7,
            difficulty: 'Intermediate',
            dependencies: ['node-node-runtime'],
            status: 'completed',
            skills: ['REST', 'Express', 'API Design'],
            resources: [
              resource('res-rest-course', 'REST design workshop', 'course'),
              resource('res-api-exercise', 'Design a repository analytics API', 'exercise')
            ],
            project: 'Xây dựng endpoint repository, phân tích và tiến độ.',
            quiz: { questions: 12, passingScore: 85 },
            xp: 220
          },
          {
            id: 'node-validation',
            title: 'Validation và error contract',
            description: 'Dùng schema validation, safe parsing và phản hồi lỗi có kiểu để bảo vệ ranh giới API.',
            estimatedHours: 4,
            difficulty: 'Intermediate',
            dependencies: ['node-rest-api'],
            status: 'in-progress',
            skills: ['Zod', 'Error Handling', 'API Contracts'],
            resources: [
              resource('res-zod-docs', 'Schema validation with Zod', 'docs'),
              resource('res-errors', 'Error contract examples', 'repo')
            ],
            project: 'Thêm validation cho luồng gửi phân tích repository.',
            quiz: { questions: 6, passingScore: 80 },
            bookmarked: true,
            notes: 'Tập trung vào parse middleware tái sử dụng và cấu trúc response.',
            xp: 180
          },
          {
            id: 'node-auth-rate-limit',
            title: 'Xác thực và giới hạn tần suất',
            description: 'Bảo vệ API bằng xác minh token, kiểm tra quyền sở hữu và throttling request.',
            estimatedHours: 6,
            difficulty: 'Advanced',
            dependencies: ['node-validation'],
            status: 'unlocked',
            skills: ['Authentication', 'Security', 'Rate Limiting'],
            resources: [
              resource('res-auth-video', 'JWT and session tradeoffs', 'video'),
              resource('res-rate-limit', 'Implement API rate limits', 'exercise')
            ],
            project: 'Bảo mật endpoint phân tích repository riêng tư.',
            quiz: { questions: 10, passingScore: 85 },
            xp: 260
          }
        ]
      },
      {
        id: 'module-data-testing',
        title: 'Data and Testing',
        description: 'Make persistence and tests part of the normal development loop.',
        order: 2,
        estimatedHours: 30,
        milestones: [
          {
            id: 'mile-quality-bar',
            title: 'Quality gate ready',
            description: 'Repository analysis flow has database tests and meaningful coverage.',
            targetWeek: 5,
            nodeIds: ['node-postgres-modeling', 'node-integration-tests', 'node-e2e-tests'],
            rewardXp: 700,
            completed: false
          }
        ],
        nodes: [
          {
            id: 'node-postgres-modeling',
            title: 'PostgreSQL Data Modeling',
            description: 'Design normalized tables, indexes and query patterns for analysis histories and learning progress.',
            estimatedHours: 8,
            difficulty: 'Intermediate',
            dependencies: ['node-rest-api'],
            status: 'unlocked',
            skills: ['PostgreSQL', 'Data Modeling', 'SQL'],
            resources: [
              resource('res-pg-docs', 'PostgreSQL indexing basics', 'docs'),
              resource('res-schema-exercise', 'Design analysis schema', 'exercise')
            ],
            project: 'Persist roadmap progress and skill snapshots.',
            xp: 300
          },
          {
            id: 'node-integration-tests',
            title: 'Integration Testing',
            description: 'Test API and database behavior together with deterministic fixtures and clean setup/teardown.',
            estimatedHours: 8,
            difficulty: 'Intermediate',
            dependencies: ['node-postgres-modeling'],
            status: 'locked',
            skills: ['Testing', 'Vitest', 'Database Fixtures'],
            resources: [
              resource('res-integration-video', 'Integration testing patterns', 'video'),
              resource('res-fixtures', 'Test fixtures cookbook', 'article')
            ],
            project: 'Cover repository analysis creation and skill gap queries.',
            xp: 320
          },
          {
            id: 'node-e2e-tests',
            title: 'End-to-End Testing',
            description: 'Validate critical learning journeys from repository analysis to roadmap completion.',
            estimatedHours: 7,
            difficulty: 'Intermediate',
            dependencies: ['node-integration-tests'],
            status: 'locked',
            skills: ['Playwright', 'User Flows', 'Regression Testing'],
            resources: [
              resource('res-playwright-docs', 'Playwright test authoring', 'docs'),
              resource('res-e2e-exercise', 'Roadmap flow E2E suite', 'exercise')
            ],
            project: 'Test AI roadmap generation and task completion.',
            xp: 340
          },
          {
            id: 'node-test-strategy',
            title: 'Testing Strategy and Coverage',
            description: 'Choose the right coverage depth and CI gates for a project portfolio.',
            estimatedHours: 7,
            difficulty: 'Advanced',
            dependencies: ['node-e2e-tests'],
            status: 'locked',
            skills: ['Test Strategy', 'Quality Gates', 'Coverage'],
            resources: [
              resource('res-test-pyramid', 'Testing pyramid decisions', 'article'),
              resource('res-quality-gates', 'Quality gates checklist', 'exercise')
            ],
            project: 'Publish a test strategy document for your main repo.',
            xp: 360
          }
        ]
      },
      {
        id: 'module-delivery',
        title: 'Delivery and Operations',
        description: 'Turn working code into repeatable, observable releases.',
        order: 3,
        estimatedHours: 34,
        milestones: [
          {
            id: 'mile-ci-deploy',
            title: 'Automated delivery pipeline',
            description: 'Every push runs checks and can deploy a production-like build.',
            targetWeek: 9,
            nodeIds: ['node-docker', 'node-github-actions', 'node-observability'],
            rewardXp: 850,
            completed: false
          }
        ],
        nodes: [
          {
            id: 'node-docker',
            title: 'Docker for App Services',
            description: 'Package frontend, API and database dependencies with repeatable local environments.',
            estimatedHours: 8,
            difficulty: 'Intermediate',
            dependencies: ['node-validation'],
            status: 'unlocked',
            skills: ['Docker', 'Containers', 'Local Dev'],
            resources: [
              resource('res-docker-docs', 'Docker compose essentials', 'docs'),
              resource('res-container-exercise', 'Containerize API and database', 'exercise')
            ],
            project: 'Create a compose stack for API, database and worker.',
            xp: 330
          },
          {
            id: 'node-github-actions',
            title: 'GitHub Actions CI/CD',
            description: 'Automate lint, tests, build artifacts, preview deployments and protected branch checks.',
            estimatedHours: 10,
            difficulty: 'Intermediate',
            dependencies: ['node-docker', 'node-integration-tests'],
            status: 'locked',
            skills: ['GitHub Actions', 'CI/CD', 'Automation'],
            resources: [
              resource('res-actions-docs', 'Workflow syntax reference', 'docs'),
              resource('res-ci-workshop', 'Build a CI pipeline', 'course')
            ],
            project: 'Add CI gates to the analyzer and a preview deploy job.',
            xp: 420
          },
          {
            id: 'node-observability',
            title: 'Monitoring and Error Tracking',
            description: 'Instrument logs, metrics, alerts and issue triage for user-facing failures.',
            estimatedHours: 9,
            difficulty: 'Advanced',
            dependencies: ['node-github-actions'],
            status: 'locked',
            skills: ['Observability', 'Logging', 'Sentry'],
            resources: [
              resource('res-monitoring', 'App monitoring checklist', 'article'),
              resource('res-logs-exercise', 'Structured logs exercise', 'exercise')
            ],
            project: 'Track analysis failures and roadmap generation latency.',
            xp: 390
          },
          {
            id: 'node-release-review',
            title: 'Release Review and Rollback',
            description: 'Create deployment checklists, release notes, environment promotion and rollback plans.',
            estimatedHours: 7,
            difficulty: 'Advanced',
            dependencies: ['node-observability'],
            status: 'locked',
            skills: ['Release Management', 'Incident Response'],
            resources: [
              resource('res-release-playbook', 'Release playbook template', 'article'),
              resource('res-rollback', 'Rollback simulation', 'exercise')
            ],
            project: 'Run a simulated bad deploy and rollback plan.',
            xp: 360
          }
        ]
      }
    ]
  },
  {
    id: 'roadmap-frontend-architecture',
    slug: 'frontend-architecture-systems',
    title: 'Hệ thống kiến trúc Frontend',
    subtitle: 'Mở rộng ứng dụng React với design system, ranh giới state, hiệu năng và khả năng test.',
    description:
      'Lộ trình frontend senior tập trung vào kiến trúc React dễ bảo trì, component contract, accessibility, hiệu năng và chất lượng UI rõ tín hiệu.',
    category: 'Frontend',
    difficulty: 'Advanced',
    estimatedWeeks: 8,
    estimatedHours: 64,
    requiredSkills: ['React', 'TypeScript', 'CSS architecture'],
    objectives: [
      'Design component APIs that scale across teams',
      'Build performance budgets into development workflow',
      'Ship accessible dashboards with reliable visual states'
    ],
    tags: ['React', 'TypeScript', 'Design System', 'Performance'],
    popularity: 88,
    rating: 4.8,
    learners: 12680,
    isFeatured: true,
    isAIRecommended: false,
    progress: 18,
    createdFrom: 'manual',
    careerOutcome: 'Senior Frontend Engineer',
    modules: [
      {
        id: 'module-ui-foundations',
        title: 'UI System Foundations',
        description: 'Token thinking, component contracts and stateful UI primitives.',
        order: 1,
        estimatedHours: 24,
        milestones: [],
        nodes: [
          {
            id: 'node-component-apis',
            title: 'Component API Design',
            description: 'Create predictable props, variants, slots and composition points for reusable UI.',
            estimatedHours: 6,
            difficulty: 'Advanced',
            dependencies: [],
            status: 'in-progress',
            skills: ['React', 'Design Systems'],
            resources: [resource('res-component-api', 'Component API patterns', 'article')],
            project: 'Refactor cards and panels into a reusable analytics surface.',
            bookmarked: true,
            xp: 260
          },
          {
            id: 'node-accessibility',
            title: 'Accessibility cho dashboard',
            description: 'Keyboard navigation, semantic landmarks, focus states and chart alternatives.',
            estimatedHours: 6,
            difficulty: 'Intermediate',
            dependencies: ['node-component-apis'],
            status: 'unlocked',
            skills: ['Accessibility', 'ARIA'],
            resources: [resource('res-a11y-docs', 'ARIA dashboard patterns', 'docs')],
            project: 'Audit a repository analysis page for keyboard use.',
            xp: 240
          },
          {
            id: 'node-performance',
            title: 'Frontend Performance Budget',
            description: 'Measure render cost, bundle composition and dashboard interaction latency.',
            estimatedHours: 7,
            difficulty: 'Advanced',
            dependencies: ['node-accessibility'],
            status: 'locked',
            skills: ['Performance', 'Profiling'],
            resources: [resource('res-profiler', 'React profiler workflow', 'video')],
            project: 'Create a performance budget for charts and repository lists.',
            xp: 300
          }
        ]
      }
    ]
  },
  {
    id: 'roadmap-cloud-devops',
    slug: 'cloud-devops-foundations',
    title: 'Nền tảng Cloud DevOps',
    subtitle: 'Triển khai cloud, nền tảng hạ tầng, container và workflow reliability.',
    description:
      'Lộ trình DevOps tập trung cho application developer cần tự tin triển khai và hiểu vận hành.',
    category: 'DevOps',
    difficulty: 'Intermediate',
    estimatedWeeks: 7,
    estimatedHours: 52,
    requiredSkills: ['Git', 'HTTP', 'Command line basics'],
    objectives: ['Deploy services to cloud', 'Automate quality checks', 'Operate apps with logs and alerts'],
    tags: ['Docker', 'AWS', 'CI/CD', 'Monitoring'],
    popularity: 91,
    rating: 4.7,
    learners: 15340,
    isFeatured: true,
    isAIRecommended: true,
    progress: 0,
    createdFrom: 'manual',
    careerOutcome: 'Application Engineer hiểu platform',
    modules: [
      {
        id: 'module-cloud-start',
        title: 'Cloud Start',
        description: 'A practical path from local app to cloud-hosted service.',
        order: 1,
        estimatedHours: 20,
        milestones: [],
        nodes: [
          {
            id: 'node-cloud-basics',
            title: 'Cloud Service Basics',
            description: 'Compute, storage, networking and environment configuration for web apps.',
            estimatedHours: 6,
            difficulty: 'Beginner',
            dependencies: [],
            status: 'unlocked',
            skills: ['Cloud', 'Networking'],
            resources: [resource('res-cloud-intro', 'Cloud app fundamentals', 'course')],
            xp: 210
          },
          {
            id: 'node-cloud-deploy',
            title: 'First Production Deploy',
            description: 'Deploy a full-stack app with environment variables, build output and health checks.',
            estimatedHours: 8,
            difficulty: 'Intermediate',
            dependencies: ['node-cloud-basics'],
            status: 'locked',
            skills: ['Deployment', 'Runtime Config'],
            resources: [resource('res-deploy-exercise', 'Deploy a learning API', 'exercise')],
            xp: 280
          }
        ]
      }
    ]
  },
  {
    id: 'roadmap-testing-engineer',
    slug: 'testing-quality-engineer',
    title: 'Testing Quality Engineer',
    subtitle: 'Tạo sự tự tin với unit, integration, E2E, contract và regression testing.',
    description: 'Roadmap tập trung vào chất lượng cho developer muốn quyết định coverage tốt hơn và release tự tin hơn.',
    category: 'Testing',
    difficulty: 'Intermediate',
    estimatedWeeks: 6,
    estimatedHours: 44,
    requiredSkills: ['JavaScript', 'Basic app architecture'],
    objectives: ['Select effective test layers', 'Automate regression suites', 'Report quality signals clearly'],
    tags: ['Vitest', 'Playwright', 'Coverage', 'QA Strategy'],
    popularity: 82,
    rating: 4.6,
    learners: 9120,
    isFeatured: false,
    isAIRecommended: true,
    progress: 0,
    createdFrom: 'manual',
    careerOutcome: 'Software Engineer tập trung chất lượng',
    modules: [
      {
        id: 'module-test-start',
        title: 'Testing Start',
        description: 'Move from ad hoc checks to automated quality loops.',
        order: 1,
        estimatedHours: 18,
        milestones: [],
        nodes: [
          {
            id: 'node-unit-tests',
            title: 'Unit Testing Core Logic',
            description: 'Write fast unit tests for utilities, stores and service boundaries.',
            estimatedHours: 5,
            difficulty: 'Beginner',
            dependencies: [],
            status: 'unlocked',
            skills: ['Vitest', 'Unit Testing'],
            resources: [resource('res-unit-course', 'Unit testing essentials', 'course')],
            xp: 180
          }
        ]
      }
    ]
  }
]

export const mockSkillProgress: SkillProgress[] = [
  {
    id: 'skill-frontend',
    skill: 'Frontend Architecture',
    category: 'Frontend',
    current: 86,
    target: 92,
    history: [
      { month: 'Jan', value: 72 },
      { month: 'Feb', value: 76 },
      { month: 'Mar', value: 80 },
      { month: 'Apr', value: 83 },
      { month: 'May', value: 86 }
    ]
  },
  {
    id: 'skill-backend',
    skill: 'Backend APIs',
    category: 'Backend',
    current: 58,
    target: 82,
    history: [
      { month: 'Jan', value: 40 },
      { month: 'Feb', value: 44 },
      { month: 'Mar', value: 49 },
      { month: 'Apr', value: 54 },
      { month: 'May', value: 58 }
    ]
  },
  {
    id: 'skill-devops',
    skill: 'CI/CD and DevOps',
    category: 'DevOps',
    current: 42,
    target: 78,
    history: [
      { month: 'Jan', value: 28 },
      { month: 'Feb', value: 31 },
      { month: 'Mar', value: 34 },
      { month: 'Apr', value: 38 },
      { month: 'May', value: 42 }
    ]
  },
  {
    id: 'skill-testing',
    skill: 'Testing Strategy',
    category: 'Testing',
    current: 51,
    target: 80,
    history: [
      { month: 'Jan', value: 36 },
      { month: 'Feb', value: 39 },
      { month: 'Mar', value: 43 },
      { month: 'Apr', value: 48 },
      { month: 'May', value: 51 }
    ]
  }
]

export const mockLearningStats: UserLearningStats = {
  activeRoadmapIds: ['roadmap-fullstack-production', 'roadmap-frontend-architecture'],
  completedRoadmaps: 1,
  completedNodes: 9,
  totalNodes: 24,
  totalXp: 3840,
  level: 7,
  currentStreak: 12,
  longestStreak: 21,
  weeklyGoalHours: 8,
  weeklyHoursCompleted: 5.5,
  dailyGoalMinutes: 45,
  bookmarkedNodeIds: ['node-validation', 'node-component-apis'],
  achievements: [
    {
      id: 'ach-first-roadmap',
      title: 'Đã bắt đầu roadmap',
      description: 'Bắt đầu lộ trình học đầu tiên được AI hướng dẫn.',
      icon: 'Sparkles',
      unlockedAt: '2026-05-20T09:00:00Z',
      progress: 1,
      target: 1,
      xpReward: 150
    },
    {
      id: 'ach-ci-ready',
      title: 'Sẵn sàng CI/CD',
      description: 'Hoàn thành các node học Docker và GitHub Actions.',
      icon: 'Rocket',
      progress: 1,
      target: 2,
      xpReward: 500
    },
    {
      id: 'ach-seven-day',
      title: 'Chuỗi 7 ngày',
      description: 'Duy trì chuỗi học tập trong bảy ngày.',
      icon: 'Flame',
      unlockedAt: '2026-05-26T09:00:00Z',
      progress: 7,
      target: 7,
      xpReward: 300
    }
  ]
}

export const mockAIRecommendation: AIRecommendation = {
  id: 'ai-rec-1',
  generatedAt: '2026-05-27T09:30:00Z',
  summary:
    'Repository của bạn cho thấy năng lực React và TypeScript tốt, nhưng tính nhất quán backend, tự động hóa CI/CD và chiều sâu testing đang giới hạn mức sẵn sàng portfolio.',
  confidence: 89,
  sourceRepositories: ['ecommerce-platform', 'task-manager-app', 'portfolio-website'],
  strengths: [
    'Cấu trúc component frontend tốt và áp dụng TypeScript ổn',
    'Tư duy sản phẩm tốt trong các dự án dashboard và cộng tác',
    'Sử dụng Git ổn định với commit đều ở repository đang hoạt động'
  ],
  weaknesses: [
    'Validation backend và error contract chưa nhất quán',
    'Độ phủ testing còn nông ở các luồng người dùng quan trọng',
    'Chưa phát hiện CI/CD pipeline có thể lặp lại trong repository đã phân tích',
    'Thiếu tín hiệu monitoring và mức sẵn sàng release'
  ],
  missingSkills: ['Node.js API depth', 'PostgreSQL modeling', 'Docker', 'GitHub Actions', 'E2E testing'],
  commitPatternInsight:
    'Commit xuất hiện dày gần các mốc UI nhưng quality check có vẻ còn thủ công. Hãy thêm automated gate trước khi merge để giảm rủi ro regression.',
  complexityInsight:
    'Độ phức tạp dự án đang chuyển từ frontend đơn lẻ sang hệ thống full-stack hướng production. Điểm đòn bẩy tiếp theo là delivery backend đáng tin cậy.',
  careerSuggestion:
    'Hướng phù hợp nhất: Full-Stack Engineer với thế mạnh frontend. Củng cố DevOps và testing để tiến tới mức senior nhanh hơn.',
  estimatedCompletionWeeks: 10,
  skillGaps: [
    {
      skill: 'CI/CD Configuration',
      category: 'DevOps',
      currentScore: 34,
      targetScore: 78,
      priority: 'Critical',
      evidence: 'Không tìm thấy workflow file trong repository đã phân tích và deployment có vẻ còn thủ công.',
      recommendedNodeIds: ['node-docker', 'node-github-actions']
    },
    {
      skill: 'Backend API Contracts',
      category: 'Backend',
      currentScore: 58,
      targetScore: 82,
      priority: 'High',
      evidence: 'Các đề xuất API nhiều lần nhắc tới validation và lỗi nhất quán.',
      recommendedNodeIds: ['node-rest-api', 'node-validation']
    },
    {
      skill: 'End-to-End Testing',
      category: 'Testing',
      currentScore: 45,
      targetScore: 80,
      priority: 'High',
      evidence: 'Các luồng portfolio quan trọng chưa có E2E coverage tự động.',
      recommendedNodeIds: ['node-integration-tests', 'node-e2e-tests']
    },
    {
      skill: 'Observability',
      category: 'DevOps',
      currentScore: 28,
      targetScore: 68,
      priority: 'Medium',
      evidence: 'Chưa phát hiện monitoring, structured logging hoặc error tracking.',
      recommendedNodeIds: ['node-observability']
    }
  ],
  roadmap: mockRoadmaps[0]
}
