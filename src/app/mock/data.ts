import type {
  User,
  Repository,
  AnalysisResult,
  ChatSession,
  DashboardStats,
  ProgressData
} from '../types'

export const mockUser: User = {
  id: '1',
  email: 'developer@example.com',
  name: 'Alex Johnson',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  githubConnected: true,
  githubUsername: 'alexjohnson',
  createdAt: '2024-01-15T10:00:00Z'
}

export const mockRepositories: Repository[] = [
  {
    id: '1',
    name: 'ecommerce-platform',
    fullName: 'alexjohnson/ecommerce-platform',
    description: 'Full-stack e-commerce platform built with React, Node.js, and PostgreSQL',
    language: 'TypeScript',
    stars: 127,
    forks: 23,
    updatedAt: '2024-05-20T14:30:00Z',
    hasReadme: true,
    analyzed: true,
    analysisId: 'analysis-1',
    url: 'https://github.com/alexjohnson/ecommerce-platform',
    private: false
  },
  {
    id: '2',
    name: 'task-manager-app',
    fullName: 'alexjohnson/task-manager-app',
    description: 'A modern task management application with real-time collaboration',
    language: 'JavaScript',
    stars: 45,
    forks: 8,
    updatedAt: '2024-05-15T09:20:00Z',
    hasReadme: true,
    analyzed: true,
    analysisId: 'analysis-2',
    url: 'https://github.com/alexjohnson/task-manager-app',
    private: false
  },
  {
    id: '3',
    name: 'ml-image-classifier',
    fullName: 'alexjohnson/ml-image-classifier',
    description: 'Machine learning project for image classification using TensorFlow',
    language: 'Python',
    stars: 89,
    forks: 15,
    updatedAt: '2024-05-10T16:45:00Z',
    hasReadme: true,
    analyzed: false,
    url: 'https://github.com/alexjohnson/ml-image-classifier',
    private: false
  },
  {
    id: '4',
    name: 'weather-api',
    fullName: 'alexjohnson/weather-api',
    description: 'RESTful API for weather data with caching and rate limiting',
    language: 'Go',
    stars: 34,
    forks: 6,
    updatedAt: '2024-04-28T11:15:00Z',
    hasReadme: true,
    analyzed: false,
    url: 'https://github.com/alexjohnson/weather-api',
    private: false
  },
  {
    id: '5',
    name: 'portfolio-website',
    fullName: 'alexjohnson/portfolio-website',
    description: 'Personal portfolio website built with Next.js and Tailwind CSS',
    language: 'TypeScript',
    stars: 12,
    forks: 2,
    updatedAt: '2024-05-25T08:00:00Z',
    hasReadme: false,
    analyzed: false,
    url: 'https://github.com/alexjohnson/portfolio-website',
    private: false
  }
]

export const mockAnalysisResults: AnalysisResult[] = [
  {
    id: 'analysis-1',
    repositoryId: '1',
    repositoryName: 'ecommerce-platform',
    createdAt: '2024-05-21T10:00:00Z',
    projectType: 'Full-Stack Web Application',
    techStack: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Docker', 'Redis'],
    scores: {
      architecture: 85,
      completeness: 78,
      commitQuality: 82,
      documentation: 75,
      codeConvention: 88,
      overall: 82
    },
    strengths: [
      'Well-structured monorepo with clear separation of concerns',
      'Comprehensive TypeScript usage with proper type definitions',
      'Good test coverage (78%) with unit and integration tests',
      'Docker containerization for easy deployment',
      'Clear commit messages following conventional commits',
      'API documentation using Swagger/OpenAPI'
    ],
    weaknesses: [
      'Missing end-to-end tests for critical user flows',
      'Some components could be refactored for better reusability',
      'Error handling could be more consistent across the API',
      'Missing monitoring and logging setup',
      'No CI/CD pipeline configuration found'
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Implement End-to-End Testing',
        description: 'Add E2E tests using Playwright or Cypress to cover critical user journeys like checkout flow, user authentication, and cart management.',
        priority: 'high',
        category: 'testing'
      },
      {
        id: 'rec-2',
        title: 'Set Up CI/CD Pipeline',
        description: 'Configure GitHub Actions for automated testing, linting, and deployment to staging/production environments.',
        priority: 'high',
        category: 'other'
      },
      {
        id: 'rec-3',
        title: 'Add Monitoring Solution',
        description: 'Integrate application monitoring (e.g., Sentry for error tracking, DataDog for performance) to track issues in production.',
        priority: 'medium',
        category: 'performance'
      },
      {
        id: 'rec-4',
        title: 'Improve Component Reusability',
        description: 'Extract common patterns into a shared component library. Consider creating a design system for consistent UI.',
        priority: 'medium',
        category: 'architecture'
      },
      {
        id: 'rec-5',
        title: 'Enhance Error Handling',
        description: 'Implement a centralized error handling middleware and consistent error response format across all API endpoints.',
        priority: 'low',
        category: 'architecture'
      }
    ],
    missingSkills: [
      {
        id: 'skill-1',
        name: 'End-to-End Testing',
        category: 'Testing',
        level: 'intermediate',
        importance: 'high'
      },
      {
        id: 'skill-2',
        name: 'CI/CD Configuration',
        category: 'DevOps',
        level: 'intermediate',
        importance: 'high'
      },
      {
        id: 'skill-3',
        name: 'Application Monitoring',
        category: 'DevOps',
        level: 'beginner',
        importance: 'medium'
      }
    ],
    careerDirection: {
      primary: 'Full-Stack Engineer',
      secondary: ['Frontend Specialist', 'Backend Engineer', 'DevOps Engineer'],
      confidence: 87,
      reasoning: 'Strong proficiency in both frontend and backend technologies with TypeScript. Shows understanding of system architecture, database design, and containerization. Would benefit from strengthening DevOps skills.'
    },
    portfolioReadiness: {
      overallReadiness: 75,
      items: [
        { label: 'Clear README with project overview', completed: true, importance: 'critical' },
        { label: 'Live demo link', completed: false, importance: 'critical' },
        { label: 'Screenshots or video demo', completed: false, importance: 'important' },
        { label: 'Setup instructions', completed: true, importance: 'critical' },
        { label: 'Architecture documentation', completed: true, importance: 'important' },
        { label: 'Test coverage', completed: true, importance: 'important' },
        { label: 'Code quality badges', completed: false, importance: 'nice-to-have' },
        { label: 'License file', completed: true, importance: 'nice-to-have' }
      ]
    }
  },
  {
    id: 'analysis-2',
    repositoryId: '2',
    repositoryName: 'task-manager-app',
    createdAt: '2024-05-16T14:30:00Z',
    projectType: 'Frontend Web Application',
    techStack: ['React', 'JavaScript', 'Firebase', 'Material-UI', 'Socket.io'],
    scores: {
      architecture: 72,
      completeness: 68,
      commitQuality: 75,
      documentation: 65,
      codeConvention: 70,
      overall: 70
    },
    strengths: [
      'Real-time collaboration features working smoothly',
      'Responsive design that works well on mobile devices',
      'Good use of React hooks for state management',
      'Clean and intuitive user interface'
    ],
    weaknesses: [
      'No TypeScript - missing type safety',
      'Limited test coverage (only 35%)',
      'Some prop-drilling issues in component tree',
      'Missing proper error boundaries',
      'No input validation on forms'
    ],
    recommendations: [
      {
        id: 'rec-6',
        title: 'Migrate to TypeScript',
        description: 'Convert the codebase to TypeScript to improve code quality, catch errors early, and enhance developer experience.',
        priority: 'high',
        category: 'architecture'
      },
      {
        id: 'rec-7',
        title: 'Improve State Management',
        description: 'Consider using Context API or a state management library like Zustand to avoid prop drilling.',
        priority: 'medium',
        category: 'architecture'
      },
      {
        id: 'rec-8',
        title: 'Add Form Validation',
        description: 'Implement client-side validation using libraries like React Hook Form with Zod for better UX and data integrity.',
        priority: 'high',
        category: 'other'
      }
    ],
    missingSkills: [
      {
        id: 'skill-4',
        name: 'TypeScript',
        category: 'Programming Language',
        level: 'beginner',
        importance: 'high'
      },
      {
        id: 'skill-5',
        name: 'Form Validation',
        category: 'Frontend Development',
        level: 'intermediate',
        importance: 'medium'
      }
    ],
    careerDirection: {
      primary: 'Frontend Developer',
      secondary: ['Full-Stack Engineer', 'UI/UX Developer'],
      confidence: 78,
      reasoning: 'Strong frontend skills with React and real-time features. Should focus on TypeScript adoption and testing practices to advance career.'
    },
    portfolioReadiness: {
      overallReadiness: 62,
      items: [
        { label: 'Clear README with project overview', completed: true, importance: 'critical' },
        { label: 'Live demo link', completed: true, importance: 'critical' },
        { label: 'Screenshots or video demo', completed: false, importance: 'important' },
        { label: 'Setup instructions', completed: true, importance: 'critical' },
        { label: 'Architecture documentation', completed: false, importance: 'important' },
        { label: 'Test coverage', completed: false, importance: 'important' },
        { label: 'Code quality badges', completed: false, importance: 'nice-to-have' },
        { label: 'License file', completed: false, importance: 'nice-to-have' }
      ]
    }
  }
]

export const mockChatSessions: ChatSession[] = [
  {
    id: 'chat-1',
    title: 'How to improve my e-commerce project?',
    createdAt: '2024-05-22T09:00:00Z',
    repositoryContext: 'ecommerce-platform',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'How can I improve my e-commerce platform project?',
        timestamp: '2024-05-22T09:00:00Z'
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Based on the analysis of your e-commerce platform, here are the top improvements you should focus on:\n\n1. **Add End-to-End Tests**: Your project has good unit test coverage (78%), but lacks E2E tests for critical flows like checkout and payment processing. Consider using Playwright or Cypress.\n\n2. **Implement CI/CD**: Set up GitHub Actions to automate testing and deployment. This will help catch issues early and streamline your release process.\n\n3. **Add Monitoring**: Integrate tools like Sentry for error tracking and performance monitoring. This is crucial for production applications.\n\nWould you like detailed guidance on any of these improvements?',
        timestamp: '2024-05-22T09:00:30Z'
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'Yes, can you help me with setting up CI/CD with GitHub Actions?',
        timestamp: '2024-05-22T09:01:00Z'
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'Absolutely! Here\'s a step-by-step guide to set up CI/CD for your e-commerce platform:\n\n## Step 1: Create GitHub Actions Workflow\n\nCreate a file `.github/workflows/ci.yml`:\n\n```yaml\nname: CI/CD Pipeline\n\non:\n  push:\n    branches: [main, develop]\n  pull_request:\n    branches: [main]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-node@v3\n        with:\n          node-version: \'18\'\n      - run: npm ci\n      - run: npm run lint\n      - run: npm test\n      - run: npm run build\n```\n\nThis workflow will:\n- Run on every push to main/develop\n- Execute linting, tests, and build\n- Fail if any step fails\n\nWould you like me to explain how to add deployment steps as well?',
        timestamp: '2024-05-22T09:01:45Z'
      }
    ]
  },
  {
    id: 'chat-2',
    title: 'Career advice for full-stack developer',
    createdAt: '2024-05-20T15:30:00Z',
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'What skills should I focus on to become a senior full-stack developer?',
        timestamp: '2024-05-20T15:30:00Z'
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content: 'Based on your current portfolio analysis, you\'re on a great path! Here are the key areas to focus on:\n\n**Technical Skills to Strengthen:**\n1. **DevOps & Infrastructure** - You\'re using Docker, but adding Kubernetes, CI/CD pipelines, and cloud platforms (AWS/GCP) would be valuable\n2. **System Design** - Practice designing scalable architectures for high-traffic applications\n3. **Testing** - Expand beyond unit tests to E2E testing and integration testing strategies\n4. **Performance Optimization** - Learn about caching strategies, database optimization, and frontend performance\n\n**Soft Skills:**\n1. **Technical Leadership** - Mentor junior developers, lead code reviews\n2. **Architecture Documentation** - Practice writing clear technical documentation and RFCs\n3. **Communication** - Explain complex technical decisions to non-technical stakeholders\n\nYour TypeScript proficiency is excellent - that\'s a strong foundation. Focus on the DevOps gap first as it appears in multiple project analyses.',
        timestamp: '2024-05-20T15:30:45Z'
      }
    ]
  }
]

export const mockDashboardStats: DashboardStats = {
  totalRepositories: 5,
  analyzedRepositories: 2,
  githubConnected: true,
  skillOverview: {
    frontend: 85,
    backend: 78,
    devops: 45,
    testing: 65
  },
  languageDistribution: [
    { language: 'TypeScript', count: 2, percentage: 40 },
    { language: 'JavaScript', count: 1, percentage: 20 },
    { language: 'Python', count: 1, percentage: 20 },
    { language: 'Go', count: 1, percentage: 20 }
  ],
  recentAnalyses: mockAnalysisResults
}

export const mockProgressData: ProgressData[] = [
  {
    date: '2024-01-15',
    scores: { architecture: 65, documentation: 55, overall: 62 }
  },
  {
    date: '2024-02-15',
    scores: { architecture: 70, documentation: 60, overall: 67 }
  },
  {
    date: '2024-03-15',
    scores: { architecture: 75, documentation: 68, overall: 72 }
  },
  {
    date: '2024-04-15',
    scores: { architecture: 78, documentation: 70, overall: 75 }
  },
  {
    date: '2024-05-15',
    scores: { architecture: 82, documentation: 75, overall: 79 }
  }
]
