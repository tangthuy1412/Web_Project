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
  provider: type === 'docs' ? 'Official Docs' : type === 'repo' ? 'GitHub' : 'GitAnalyzer Academy',
  estimatedMinutes: type === 'exercise' ? 75 : 30
})

export const mockRoadmaps: Roadmap[] = [
  {
    id: 'roadmap-fullstack-production',
    slug: 'fullstack-production-engineer',
    title: 'Production Full-Stack Engineer',
    subtitle: 'Backend, testing, Docker, CI/CD and deployment discipline for frontend-heavy developers.',
    description:
      'A practical path from polished React apps to reliable production systems with APIs, persistence, automated tests, containers and delivery pipelines.',
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
        title: 'API Foundations',
        description: 'Build maintainable service boundaries, controllers, validation and API documentation.',
        order: 1,
        estimatedHours: 22,
        milestones: [
          {
            id: 'mile-api-contract',
            title: 'Portfolio-grade API contract',
            description: 'Ship documented endpoints with validation and consistent error responses.',
            targetWeek: 2,
            nodeIds: ['node-node-runtime', 'node-rest-api', 'node-validation'],
            rewardXp: 450,
            completed: true
          }
        ],
        nodes: [
          {
            id: 'node-node-runtime',
            title: 'Node.js Runtime and Service Structure',
            description: 'Understand event loop basics, environment configuration, folder boundaries and production-ready scripts.',
            estimatedHours: 5,
            difficulty: 'Beginner',
            dependencies: [],
            status: 'completed',
            skills: ['Node.js', 'Backend Architecture'],
            resources: [
              resource('res-node-docs', 'Node.js runtime essentials', 'docs'),
              resource('res-service-layout', 'Service folder structure patterns', 'article')
            ],
            project: 'Create a health-check service with structured config.',
            quiz: { questions: 8, passingScore: 80 },
            xp: 160
          },
          {
            id: 'node-rest-api',
            title: 'REST API Design',
            description: 'Model resources, status codes, pagination, filtering and request lifecycle decisions.',
            estimatedHours: 7,
            difficulty: 'Intermediate',
            dependencies: ['node-node-runtime'],
            status: 'completed',
            skills: ['REST', 'Express', 'API Design'],
            resources: [
              resource('res-rest-course', 'REST design workshop', 'course'),
              resource('res-api-exercise', 'Design a repository analytics API', 'exercise')
            ],
            project: 'Build repository, analysis and progress endpoints.',
            quiz: { questions: 12, passingScore: 85 },
            xp: 220
          },
          {
            id: 'node-validation',
            title: 'Validation and Error Contracts',
            description: 'Use schema validation, safe parsing and typed error responses to protect API boundaries.',
            estimatedHours: 4,
            difficulty: 'Intermediate',
            dependencies: ['node-rest-api'],
            status: 'in-progress',
            skills: ['Zod', 'Error Handling', 'API Contracts'],
            resources: [
              resource('res-zod-docs', 'Schema validation with Zod', 'docs'),
              resource('res-errors', 'Error contract examples', 'repo')
            ],
            project: 'Add validation to repository analysis submission.',
            quiz: { questions: 6, passingScore: 80 },
            bookmarked: true,
            notes: 'Focus on reusable parse middleware and response shape.',
            xp: 180
          },
          {
            id: 'node-auth-rate-limit',
            title: 'Auth and Rate Limiting',
            description: 'Protect APIs with token verification, ownership checks and request throttling.',
            estimatedHours: 6,
            difficulty: 'Advanced',
            dependencies: ['node-validation'],
            status: 'unlocked',
            skills: ['Authentication', 'Security', 'Rate Limiting'],
            resources: [
              resource('res-auth-video', 'JWT and session tradeoffs', 'video'),
              resource('res-rate-limit', 'Implement API rate limits', 'exercise')
            ],
            project: 'Secure private repository analysis endpoints.',
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
    title: 'Frontend Architecture Systems',
    subtitle: 'Scale React applications with design systems, state boundaries, performance and testability.',
    description:
      'A senior frontend path focused on maintainable React architecture, component contracts, accessibility, performance and high-signal UI quality.',
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
            title: 'Dashboard Accessibility',
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
    title: 'Cloud DevOps Foundations',
    subtitle: 'Cloud deployment, infrastructure fundamentals, containers and reliability workflows.',
    description:
      'A focused DevOps path for application developers who need deployment confidence and operational literacy.',
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
    careerOutcome: 'Platform-aware Application Engineer',
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
    subtitle: 'Build confidence with unit, integration, E2E, contract and regression testing.',
    description: 'A quality-focused roadmap for developers who want better coverage decisions and release confidence.',
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
    careerOutcome: 'Quality-focused Software Engineer',
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
      title: 'Roadmap Started',
      description: 'Started your first AI-guided learning path.',
      icon: 'Sparkles',
      unlockedAt: '2026-05-20T09:00:00Z',
      progress: 1,
      target: 1,
      xpReward: 150
    },
    {
      id: 'ach-ci-ready',
      title: 'CI/CD Ready',
      description: 'Complete Docker and GitHub Actions learning nodes.',
      icon: 'Rocket',
      progress: 1,
      target: 2,
      xpReward: 500
    },
    {
      id: 'ach-seven-day',
      title: '7-Day Streak',
      description: 'Maintain a learning streak for seven days.',
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
    'Your repositories show strong React and TypeScript execution, but backend consistency, CI/CD automation and testing depth are limiting portfolio readiness.',
  confidence: 89,
  sourceRepositories: ['ecommerce-platform', 'task-manager-app', 'portfolio-website'],
  strengths: [
    'Strong frontend component structure and TypeScript adoption',
    'Good product sense across dashboard and collaboration projects',
    'Solid Git usage with steady commits on active repositories'
  ],
  weaknesses: [
    'Backend validation and error contracts are inconsistent',
    'Testing coverage is shallow for critical user flows',
    'No repeatable CI/CD pipeline detected in analyzed repositories',
    'Monitoring and release-readiness signals are missing'
  ],
  missingSkills: ['Node.js API depth', 'PostgreSQL modeling', 'Docker', 'GitHub Actions', 'E2E testing'],
  commitPatternInsight:
    'Commits are frequent near UI milestones but quality checks appear manual. Add automated gates before merge to reduce regression risk.',
  complexityInsight:
    'Project complexity is moving from single-app frontend work toward production full-stack systems. The next leverage point is reliable backend delivery.',
  careerSuggestion:
    'Best-fit trajectory: Full-Stack Engineer with strong frontend specialization. Strengthen DevOps and testing to reach senior readiness faster.',
  estimatedCompletionWeeks: 10,
  skillGaps: [
    {
      skill: 'CI/CD Configuration',
      category: 'DevOps',
      currentScore: 34,
      targetScore: 78,
      priority: 'Critical',
      evidence: 'No workflow files found in analyzed repositories and deployment appears manual.',
      recommendedNodeIds: ['node-docker', 'node-github-actions']
    },
    {
      skill: 'Backend API Contracts',
      category: 'Backend',
      currentScore: 58,
      targetScore: 82,
      priority: 'High',
      evidence: 'API recommendations repeatedly mention validation and consistent errors.',
      recommendedNodeIds: ['node-rest-api', 'node-validation']
    },
    {
      skill: 'End-to-End Testing',
      category: 'Testing',
      currentScore: 45,
      targetScore: 80,
      priority: 'High',
      evidence: 'Critical portfolio flows do not have automated E2E coverage.',
      recommendedNodeIds: ['node-integration-tests', 'node-e2e-tests']
    },
    {
      skill: 'Observability',
      category: 'DevOps',
      currentScore: 28,
      targetScore: 68,
      priority: 'Medium',
      evidence: 'No monitoring, structured logging or error tracking detected.',
      recommendedNodeIds: ['node-observability']
    }
  ],
  roadmap: mockRoadmaps[0]
}
