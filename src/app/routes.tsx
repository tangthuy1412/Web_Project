import { createBrowserRouter } from 'react-router'
import { MainLayout } from './layouts/MainLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
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
import { ProgressPage } from './pages/progress/ProgressPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AIRoadmapPage } from '../features/roadmaps/pages/AIRoadmapPage'
import { RoadmapDetailPage } from '../features/roadmaps/pages/RoadmapDetailPage'
import { RoadmapsPage } from '../features/roadmaps/pages/RoadmapsPage'

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
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
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
          { path: 'settings', element: <SettingsPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'progress', element: <ProgressPage /> },
          { path: '*', element: <NotFoundPage /> }
        ]
      }
    ]
  }
])
