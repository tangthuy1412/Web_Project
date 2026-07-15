export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider?: string;
  role?: 'admin' | 'student' | string;
  status?: 'active' | 'banned' | 'inactive' | string;
  githubConnected: boolean;
  githubUsername?: string;
  createdAt: string;
}

export interface Profile {
  id?: string;
  fullName: string;
  university: string;
  major: string;
  year: number;
  targetCareer: string;
  currentSkills: string[];
  githubUsername?: string;
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

export interface RepositoryPackageFile {
  name?: string;
  path?: string;
  type?: string;
  content?: unknown;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface RepositoryCommit {
  id?: string;
  sha?: string;
  message?: string;
  author?: string;
  date?: string;
  url?: string;
}

export interface AnalysisResult {
  id: string;
  snapshotId?: string;
  repositoryId: string;
  repositoryName: string;
  repoName?: string;
  fullName?: string;
  createdAt: string;
  analyzedAt?: string;
  projectType: string;
  analysisScope?: AnalysisScopeSummary;
  summary?: AnalysisResponseSummary;
  topSkills?: AnalysisCompactSkill[];
  scoreBreakdown?: AnalysisScoreBreakdown;
  techStack: string[];
  languages?: string[];
  frameworks?: string[];
  packages?: string[];
  skillSignals?: string[];
  careerSignals?: string[];
  skillVector?: SkillVectorItem[];
  scores: {
    architecture: number;
    completeness: number;
    commitQuality: number;
    documentation: number;
    codeConvention: number;
    overall: number;
    techStackScore?: number;
    documentationScore?: number;
    commitQualityScore?: number;
    deploymentScore?: number;
    testingScore?: number;
    portfolioReadinessScore?: number;
    overallScore?: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  missingSkills: Skill[];
  careerDirection: CareerDirection;
  commitSummary?: CommitSummary;
  checklist?: AnalysisChecklist;
  portfolioReadiness: PortfolioChecklist;
}

export interface AnalysisScopeSummary {
  type?: string;
  githubUsername?: string;
  totalRepoCommits?: number;
  userCommits?: number;
  activeDays?: number;
  firstCommitDate?: string;
  lastCommitDate?: string;
}

export interface AnalysisCompactSkill {
  skill: string;
  canonicalSkillName?: string;
  category?: string;
  score: number;
  level?: string;
}

export interface AnalysisMissingSkill {
  skill: string;
  canonicalSkillName?: string;
  category?: string;
  priority?: 'high' | 'medium' | 'low' | string;
}

export interface AnalysisResponseSummary {
  careerDirection?: string;
  userLevel?: string;
  userReadinessScore?: number;
  overallScore?: number;
  projectType?: string;
  confidence?: number | string;
}

export interface AnalysisScoreBreakdown {
  skillScore?: number;
  contributionScore?: number;
  commitQualityScore?: number;
  projectCompletenessScore?: number;
  missingCriticalPenalty?: number;
  confidence?: number;
}

export type SkillVectorLevel = 'missing' | 'weak' | 'developing' | 'strong' | string;

export interface SkillVectorItem {
  canonicalSkillName: string;
  normalizedSkillName?: string;
  category?: string;
  score: number;
  level: SkillVectorLevel;
  evidence?: string[];
  sources?: string[];
}

export interface CommitSummary {
  totalCommits: number;
  activeDays: number;
  vagueCommitRatio: number;
  conventionalCommitRatio: number;
  firstCommitDate?: string;
  lastCommitDate?: string;
}

export interface AnalysisChecklist {
  hasReadme: boolean;
  hasEnvExample: boolean;
  hasDocker: boolean;
  hasDockerCompose: boolean;
  hasCICD: boolean;
  hasTesting: boolean;
  hasLinting: boolean;
  hasFormatter: boolean;
  hasPackageFile: boolean;
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

export type ChatSenderType = 'USER' | 'AI' | 'ADMIN';
export type ChatMessageRole = 'user' | 'assistant';
export type ChatSessionStatus = 'active' | 'waiting_admin' | 'answered' | 'closed' | string;
export type ChatMode = 'AI_AUTO' | 'MANUAL';
export type ChatModeSource = 'GLOBAL' | 'SESSION' | string;

export interface ChatContext {
  repositoryId?: string;
  repoName?: string;
  roadmapId?: string;
  analysisId?: string;
  snapshotId?: string;
  progressUpdatedAt?: string;
  analysisSource?: string;
  contextSelectionReason?: string;
  contextPinned?: boolean;
  intent?: string;
  intents?: string[];
  hasRoadmapContext?: boolean;
  hasComparisonContext?: boolean;
  comparedRepoCount?: number;
}

export interface ChatMessage {
  _id?: string;
  id: string;
  sessionId?: string;
  senderType: ChatSenderType;
  role?: ChatMessageRole;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  _id?: string;
  id: string;
  title: string;
  repositoryId?: string;
  roadmapId?: string;
  analysisId?: string;
  snapshotId?: string;
  contextSelectionReason?: string;
  contextPinnedAt?: string;
  status?: ChatSessionStatus;
  closedAt?: string;
  closedBy?: string;
  closeReason?: string;
  mode?: ChatMode;
  modeSource?: ChatModeSource;
  effectiveMode?: ChatMode;
  unreadByUser?: boolean;
  unreadByAdmin?: boolean;
  lastMessage?: ChatMessage;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt?: string;
  messages: ChatMessage[];
  repositoryContext?: string;
  context?: ChatContext;
}

export interface CreateChatSessionPayload {
  title: string;
  roadmapId?: string;
  repositoryId?: string;
  analysisId?: string;
  snapshotId?: string;
}

export interface SendMessagePayload extends Omit<CreateChatSessionPayload, 'title'> {
  message: string;
}

export interface SendMessageResponseData {
  mode?: ChatMode;
  effectiveMode?: ChatMode;
  modeSource?: ChatModeSource;
  status?: ChatSessionStatus;
  userMessage?: ChatMessage | null;
  aiMessage?: ChatMessage | null;
  adminMessage?: ChatMessage | null;
  session?: ChatSession;
  context?: ChatContext;
}

export interface ChatMessageCreatedEvent {
  sessionId: string;
  message: ChatMessage;
  emittedAt?: string;
}

export interface ChatSessionUpdatedEvent {
  sessionId: string;
  session: Partial<ChatSession> & { _id?: string; id?: string };
  emittedAt?: string;
}

export interface ChatReadUpdatedEvent {
  sessionId: string;
  session: Partial<ChatSession> & { _id?: string; id?: string };
  actor?: {
    actorId?: string;
    actorType?: ChatSenderType;
    role?: string;
  };
  emittedAt?: string;
}

export interface ChatTypingEvent {
  sessionId: string;
  isTyping: boolean;
  actorId?: string;
  actorType?: ChatSenderType;
  role?: string;
  timestamp?: string;
}

export interface AIFeedback {
  id?: string;
  repositoryId?: string;
  analysisSnapshotId?: string;
  githubRepoId?: number;
  repoName?: string;
  fullName?: string;
  projectType?: string;
  careerDirection?: string;
  createdAt?: string;
  generatedAt?: string;
  summary?: string;
  feedback?: string;
  strengthFeedback?: string[];
  weaknessFeedback?: string[];
  learningAdvice?: string;
  nextSteps?: string[];
  recommendedTopics?: string[];
  careerSuggestion?: string;
  portfolioAdvice?: string;
  riskNotes?: string[];
  recommendations?: string[];
  metadata?: Record<string, unknown>;
  raw?: unknown;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: string;
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

export type RoleMatchLevel = 'high' | 'medium' | 'low' | 'very_low' | string;

export interface RoleMatch {
  roleId: string;
  roleName: string;
  description: string;
  category: string;
  matchScore: number;
  matchLevel: RoleMatchLevel;
  matchLevelLabel: string;
  requiredScore: number;
  optionalScore: number;
  coverageScore: number;
  matchedSkillCount: number;
  weakSkillCount: number;
  missingRequiredSkillCount: number;
  recommendedNextSkills: string[];
  topMatchedSkills: string[];
  topMissingSkills: string[];
  matchedSkillNames?: string[];
  weakSkillNames?: string[];
  missingSkillNames?: string[];
  matchedSkills?: string[];
  weakSkills?: string[];
  missingRequiredSkills?: string[];
  missingOptionalSkills?: string[];
  scoringMethod?: string;
  probability?: number;
  rank?: number;
  modelVersion?: string;
  vectorSources?: string[];
  sourceStats?: Record<string, unknown>;
  summary: string;
}

export interface RepositoryRoleMatches {
  repositoryId: string;
  repoName: string;
  fullName: string;
  analyzedAt: string;
  topRole: Pick<RoleMatch, 'roleId' | 'roleName' | 'matchScore' | 'matchLevel' | 'matchLevelLabel'>;
  matches: RoleMatch[];
}

export interface RoleCatalogItem {
  roleId: string;
  roleName: string;
  description: string;
  category: string;
  level: string;
  modelRoleLabel?: string;
  modelVersion?: string;
  isSupportedByModel?: boolean;
  scoringMethod?: string;
  requiredSkillCount?: number;
  optionalSkillCount?: number;
}

export interface SkillCatalogItem {
  name: string;
  category: string;
  aliases: string[];
  defaultLevel: string;
  tags: string[];
}


