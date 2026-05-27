import { useState } from 'react'
import { User, Github, Bell, Palette, LogOut } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/authStore'
import { useTheme } from '../../hooks/useTheme'
import { useNavigate } from 'react-router'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-medium">
              {user?.name?.charAt(0)}
            </div>
            <Button variant="outline" size="sm">
              Change Avatar
            </Button>
          </div>
          <div className="flex gap-2 pt-2">
            <Button>Save Changes</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>Manage your GitHub connection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <Github className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  @{user?.githubUsername}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Connected
                </p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Manage Connection
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Analysis Complete
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Get notified when repository analysis is complete
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                AI Recommendations
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Receive weekly AI-powered career recommendations
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Product Updates
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Stay updated with new features and improvements
              </p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Theme
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="w-full h-20 rounded bg-white border border-slate-200 mb-2" />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Light
                </p>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="w-full h-20 rounded bg-slate-900 border border-slate-700 mb-2" />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Dark
                </p>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <LogOut className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                Sign Out
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Sign out from your account
              </p>
            </div>
            <Button variant="destructive" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                Delete Account
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
