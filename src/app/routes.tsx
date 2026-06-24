import { createBrowserRouter } from 'react-router'
import { MainLayout } from './layouts/MainLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminRoute } from './components/auth/AdminRoute'
import { StudentRoute } from './components/auth/StudentRoute'
import { PublicHomeRoute } from './components/auth/PublicHomeRoute'

import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { HomePage } from './pages/home/HomePage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { GitHubConnectPage } from './pages/github/GitHubConnectPage'
import { GitHubCallbackPage } from './pages/github/GitHubCallbackPage'
import { RepositoriesPage } from './pages/repositories/RepositoriesPage'
import { RepositoryDetailPage } from './pages/repositories/RepositoryDetailPage'
import { AnalysisResultPage } from './pages/analysis/AnalysisResultPage'
import { ChatPage } from './pages/chat/ChatPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { NotificationsPage } from './pages/notifications/NotificationsPage'
import { RepositoryProgressPage } from './pages/progress/RepositoryProgressPage'
import { AdminAiFeedbackDetailPage } from './pages/admin/AdminAiFeedbackDetailPage'
import { AdminAiFeedbackPage } from './pages/admin/AdminAiFeedbackPage'
import { AdminAnalysisDetailPage } from './pages/admin/AdminAnalysisDetailPage'
import { AdminAnalysisPage } from './pages/admin/AdminAnalysisPage'
import { AdminPage } from './pages/admin/AdminPage'
import { AdminReportDetailPage } from './pages/admin/AdminReportDetailPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { AdminRoadmapDetailPage } from './pages/admin/AdminRoadmapDetailPage'
import { AdminRoadmapsPage } from './pages/admin/AdminRoadmapsPage'
import { AdminRepositoriesPage } from './pages/admin/AdminRepositoriesPage'
import { AdminRepositoryDetailPage } from './pages/admin/AdminRepositoryDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AIRoadmapPage } from '../features/roadmaps/pages/AIRoadmapPage'
import { RoadmapDetailPage } from '../features/roadmaps/pages/RoadmapDetailPage'
import { RoadmapsPage } from '../features/roadmaps/pages/RoadmapsPage'
import { SkillLearningDetailPage } from '../features/roadmaps/pages/SkillLearningDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicHomeRoute />
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginPage /> }
    ]
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [
      { index: true, element: <RegisterPage /> }
    ]
  },
  {
    path: '/github/oauth/callback',
    element: <GitHubCallbackPage />
  },
  {
    path: '/github/callback',
    element: <GitHubCallbackPage />
  },
  {
    path: '/api/github/oauth/callback',
    element: <GitHubCallbackPage />
  },
  {
    path: '/auth/github/callback',
    element: <GitHubCallbackPage />
  },
  {
    path: '/api/auth/github/callback',
    element: <GitHubCallbackPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            element: <StudentRoute />,
            children: [
              { path: 'home', element: <HomePage /> },
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'github/connect', element: <GitHubConnectPage /> },
              { path: 'repositories', element: <RepositoriesPage /> },
              { path: 'repositories/:id', element: <RepositoryDetailPage /> },
              { path: 'repositories/:id/analysis', element: <AnalysisResultPage /> },
              { path: 'analysis/:id', element: <AnalysisResultPage /> },
              { path: 'chat', element: <ChatPage /> },
              { path: 'roadmaps', element: <RoadmapsPage /> },
              { path: 'roadmaps/ai', element: <AIRoadmapPage /> },
              { path: 'roadmaps/:id', element: <RoadmapDetailPage /> },
              { path: 'roadmaps/:id/skills/:skillName', element: <SkillLearningDetailPage /> },
              { path: 'progress', element: <RepositoryProgressPage /> }
            ]
          },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: 'admin', element: <AdminPage /> },
              { path: 'admin/roadmaps', element: <AdminRoadmapsPage /> },
              { path: 'admin/roadmaps/:roadmapId', element: <AdminRoadmapDetailPage /> },
              { path: 'admin/repositories', element: <AdminRepositoriesPage /> },
              { path: 'admin/repositories/:repositoryId', element: <AdminRepositoryDetailPage /> },
              { path: 'admin/analysis', element: <AdminAnalysisPage /> },
              { path: 'admin/analysis/:analysisId', element: <AdminAnalysisDetailPage /> },
              { path: 'admin/ai-feedback', element: <AdminAiFeedbackPage /> },
              { path: 'admin/ai-feedback/:feedbackId', element: <AdminAiFeedbackDetailPage /> },
              { path: 'admin/reports', element: <AdminReportsPage /> },
              { path: 'admin/reports/:reportId', element: <AdminReportDetailPage /> }
            ]
          },
          { path: '*', element: <NotFoundPage /> }
        ]
      }
    ]
  }
])
