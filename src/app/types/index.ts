export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  githubConnected: boolean;
  githubUsername?: string;
  createdAt: string;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  language: string;
  stars: number;
  forks: number;
  updatedAt: string;
  hasReadme: boolean;
  analyzed: boolean;
  analysisId?: string;
  url: string;
  private: boolean;
}

export interface AnalysisResult {
  id: string;
  repositoryId: string;
  repositoryName: string;
  createdAt: string;
  projectType: string;
  techStack: string[];
  scores: {
    architecture: number;
    completeness: number;
    commitQuality: number;
    documentation: number;
    codeConvention: number;
    overall: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  missingSkills: Skill[];
  careerDirection: CareerDirection;
  portfolioReadiness: PortfolioChecklist;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'architecture' | 'documentation' | 'testing' | 'security' | 'performance' | 'other';
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  importance: 'high' | 'medium' | 'low';
}

export interface CareerDirection {
  primary: string;
  secondary: string[];
  confidence: number;
  reasoning: string;
}

export interface PortfolioChecklist {
  items: {
    label: string;
    completed: boolean;
    importance: 'critical' | 'important' | 'nice-to-have';
  }[];
  overallReadiness: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
  repositoryContext?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DashboardStats {
  totalRepositories: number;
  analyzedRepositories: number;
  githubConnected: boolean;
  skillOverview: {
    frontend: number;
    backend: number;
    devops: number;
    testing: number;
  };
  languageDistribution: {
    language: string;
    count: number;
    percentage: number;
  }[];
  recentAnalyses: AnalysisResult[];
}

export interface ProgressData {
  date: string;
  scores: {
    architecture: number;
    documentation: number;
    overall: number;
  };
}
