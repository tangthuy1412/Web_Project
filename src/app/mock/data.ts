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
  name: 'Nguyễn Minh',
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
    description: 'Nền tảng thương mại điện tử full-stack xây dựng bằng React, Node.js và PostgreSQL',
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
    description: 'Ứng dụng quản lý công việc hiện đại có cộng tác thời gian thực',
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
    description: 'Dự án machine learning phân loại hình ảnh bằng TensorFlow',
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
    description: 'RESTful API dữ liệu thời tiết có caching và rate limiting',
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
    description: 'Website portfolio cá nhân xây dựng bằng Next.js và Tailwind CSS',
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
    projectType: 'Ứng dụng web full-stack',
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
      'Monorepo có cấu trúc tốt và phân tách trách nhiệm rõ ràng',
      'Sử dụng TypeScript đầy đủ với định nghĩa kiểu hợp lý',
      'Độ phủ test tốt (78%) với unit test và integration test',
      'Đã container hóa bằng Docker để triển khai dễ hơn',
      'Commit message rõ ràng theo conventional commits',
      'Có tài liệu API bằng Swagger/OpenAPI'
    ],
    weaknesses: [
      'Thiếu end-to-end test cho các luồng người dùng quan trọng',
      'Một số component nên được refactor để tái sử dụng tốt hơn',
      'Xử lý lỗi trong API cần nhất quán hơn',
      'Thiếu cấu hình monitoring và logging',
      'Chưa tìm thấy cấu hình CI/CD pipeline'
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Triển khai End-to-End Testing',
        description: 'Thêm E2E test bằng Playwright hoặc Cypress cho các hành trình quan trọng như checkout, xác thực người dùng và quản lý giỏ hàng.',
        priority: 'high',
        category: 'testing'
      },
      {
        id: 'rec-2',
        title: 'Thiết lập CI/CD Pipeline',
        description: 'Cấu hình GitHub Actions để tự động test, lint và deploy lên môi trường staging/production.',
        priority: 'high',
        category: 'other'
      },
      {
        id: 'rec-3',
        title: 'Bổ sung giải pháp monitoring',
        description: 'Tích hợp monitoring như Sentry để theo dõi lỗi hoặc DataDog để theo dõi hiệu năng trong production.',
        priority: 'medium',
        category: 'performance'
      },
      {
        id: 'rec-4',
        title: 'Cải thiện khả năng tái sử dụng component',
        description: 'Tách các pattern dùng chung thành thư viện component. Cân nhắc tạo design system để UI nhất quán hơn.',
        priority: 'medium',
        category: 'architecture'
      },
      {
        id: 'rec-5',
        title: 'Nâng cấp xử lý lỗi',
        description: 'Triển khai middleware xử lý lỗi tập trung và định dạng phản hồi lỗi nhất quán cho toàn bộ API endpoint.',
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
      secondary: ['Chuyên gia Frontend', 'Backend Engineer', 'DevOps Engineer'],
      confidence: 87,
      reasoning: 'Bạn có nền tảng tốt ở cả frontend và backend với TypeScript. Repository cho thấy hiểu biết về kiến trúc hệ thống, thiết kế database và containerization. Nên tăng cường kỹ năng DevOps để phát triển nhanh hơn.'
    },
    portfolioReadiness: {
      overallReadiness: 75,
      items: [
        { label: 'README rõ ràng với tổng quan dự án', completed: true, importance: 'critical' },
        { label: 'Liên kết demo live', completed: false, importance: 'critical' },
        { label: 'Ảnh chụp màn hình hoặc video demo', completed: false, importance: 'important' },
        { label: 'Hướng dẫn cài đặt', completed: true, importance: 'critical' },
        { label: 'Tài liệu kiến trúc', completed: true, importance: 'important' },
        { label: 'Độ phủ test', completed: true, importance: 'important' },
        { label: 'Badge chất lượng code', completed: false, importance: 'nice-to-have' },
        { label: 'File license', completed: true, importance: 'nice-to-have' }
      ]
    }
  },
  {
    id: 'analysis-2',
    repositoryId: '2',
    repositoryName: 'task-manager-app',
    createdAt: '2024-05-16T14:30:00Z',
    projectType: 'Ứng dụng web frontend',
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
      'Tính năng cộng tác thời gian thực hoạt động mượt',
      'Responsive design hiển thị tốt trên thiết bị di động',
      'Sử dụng React hooks tốt cho quản lý state',
      'Giao diện sạch và dễ sử dụng'
    ],
    weaknesses: [
      'Chưa dùng TypeScript nên thiếu type safety',
      'Độ phủ test còn thấp (chỉ 35%)',
      'Một số chỗ bị prop-drilling trong cây component',
      'Thiếu error boundary phù hợp',
      'Form chưa có input validation'
    ],
    recommendations: [
      {
        id: 'rec-6',
        title: 'Chuyển sang TypeScript',
        description: 'Chuyển codebase sang TypeScript để cải thiện chất lượng code, phát hiện lỗi sớm và tăng trải nghiệm developer.',
        priority: 'high',
        category: 'architecture'
      },
      {
        id: 'rec-7',
        title: 'Cải thiện quản lý state',
        description: 'Cân nhắc dùng Context API hoặc thư viện quản lý state như Zustand để tránh prop drilling.',
        priority: 'medium',
        category: 'architecture'
      },
      {
        id: 'rec-8',
        title: 'Thêm form validation',
        description: 'Triển khai validation phía client bằng React Hook Form kết hợp Zod để cải thiện UX và tính toàn vẹn dữ liệu.',
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
      reasoning: 'Bạn có kỹ năng frontend tốt với React và tính năng thời gian thực. Nên tập trung áp dụng TypeScript và cải thiện testing để phát triển nghề nghiệp.'
    },
    portfolioReadiness: {
      overallReadiness: 62,
      items: [
        { label: 'README rõ ràng với tổng quan dự án', completed: true, importance: 'critical' },
        { label: 'Liên kết demo live', completed: true, importance: 'critical' },
        { label: 'Ảnh chụp màn hình hoặc video demo', completed: false, importance: 'important' },
        { label: 'Hướng dẫn cài đặt', completed: true, importance: 'critical' },
        { label: 'Tài liệu kiến trúc', completed: false, importance: 'important' },
        { label: 'Độ phủ test', completed: false, importance: 'important' },
        { label: 'Badge chất lượng code', completed: false, importance: 'nice-to-have' },
        { label: 'File license', completed: false, importance: 'nice-to-have' }
      ]
    }
  }
]

export const mockChatSessions: ChatSession[] = [
  {
    id: 'chat-1',
    title: 'Cải thiện dự án thương mại điện tử như thế nào?',
    createdAt: '2024-05-22T09:00:00Z',
    repositoryContext: 'ecommerce-platform',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Tôi có thể cải thiện dự án thương mại điện tử như thế nào?',
        timestamp: '2024-05-22T09:00:00Z'
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Dựa trên phân tích nền tảng thương mại điện tử của bạn, đây là các cải thiện nên ưu tiên:\n\n1. **Thêm End-to-End Tests**: Dự án có unit test khá tốt (78%) nhưng thiếu E2E test cho các luồng quan trọng như checkout và thanh toán. Có thể dùng Playwright hoặc Cypress.\n\n2. **Triển khai CI/CD**: Thiết lập GitHub Actions để tự động test và deploy, giúp phát hiện lỗi sớm và tối ưu quy trình release.\n\n3. **Bổ sung Monitoring**: Tích hợp Sentry để theo dõi lỗi và công cụ theo dõi hiệu năng. Điều này rất quan trọng với ứng dụng production.\n\nBạn muốn tôi hướng dẫn chi tiết phần nào trước?',
        timestamp: '2024-05-22T09:00:30Z'
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'Có, hãy giúp tôi thiết lập CI/CD bằng GitHub Actions.',
        timestamp: '2024-05-22T09:01:00Z'
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'Được. Đây là hướng dẫn từng bước để thiết lập CI/CD cho nền tảng thương mại điện tử:\n\n## Bước 1: Tạo GitHub Actions Workflow\n\nTạo file `.github/workflows/ci.yml`:\n\n```yaml\nname: CI/CD Pipeline\n\non:\n  push:\n    branches: [main, develop]\n  pull_request:\n    branches: [main]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-node@v3\n        with:\n          node-version: \'18\'\n      - run: npm ci\n      - run: npm run lint\n      - run: npm test\n      - run: npm run build\n```\n\nWorkflow này sẽ:\n- Chạy khi push lên main/develop\n- Thực thi lint, test và build\n- Dừng pipeline nếu có bước thất bại\n\nBạn có muốn tôi hướng dẫn thêm bước deployment không?',
        timestamp: '2024-05-22T09:01:45Z'
      }
    ]
  },
  {
    id: 'chat-2',
    title: 'Tư vấn nghề nghiệp cho full-stack developer',
    createdAt: '2024-05-20T15:30:00Z',
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'Tôi nên tập trung kỹ năng nào để trở thành senior full-stack developer?',
        timestamp: '2024-05-20T15:30:00Z'
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content: 'Dựa trên phân tích portfolio hiện tại, bạn đang đi đúng hướng. Các mảng nên tập trung gồm:\n\n**Kỹ năng kỹ thuật cần củng cố:**\n1. **DevOps & Infrastructure** - Bạn đã dùng Docker, nhưng nên học thêm Kubernetes, CI/CD pipeline và cloud platform như AWS/GCP.\n2. **System Design** - Luyện thiết kế kiến trúc có khả năng mở rộng cho ứng dụng traffic cao.\n3. **Testing** - Mở rộng từ unit test sang E2E test và chiến lược integration testing.\n4. **Performance Optimization** - Học caching, tối ưu database và hiệu năng frontend.\n\n**Kỹ năng mềm:**\n1. **Technical Leadership** - Mentor developer junior và dẫn dắt code review.\n2. **Architecture Documentation** - Luyện viết tài liệu kỹ thuật và RFC rõ ràng.\n3. **Communication** - Giải thích quyết định kỹ thuật phức tạp cho stakeholder không chuyên.\n\nTypeScript của bạn đang tốt, đây là nền tảng mạnh. Hãy ưu tiên gap DevOps trước vì nó xuất hiện trong nhiều phân tích dự án.',
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
