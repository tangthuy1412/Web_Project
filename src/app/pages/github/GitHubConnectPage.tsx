import { useState } from 'react'
import { Github, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/authStore'

export const GitHubConnectPage = () => {
  const { user, connectGitHub, disconnectGitHub } = useAuthStore()
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    connectGitHub(username || 'alexjohnson')
    setIsConnecting(false)
  }

  const handleDisconnect = () => {
    disconnectGitHub()
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          GitHub Integration
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Connect your GitHub account to analyze your repositories
        </p>
      </div>

      {user?.githubConnected ? (
        <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                  GitHub Connected
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                  Your GitHub account <strong>@{user.githubUsername}</strong> is successfully connected.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Active</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    className="border-emerald-300 dark:border-emerald-700"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  GitHub Not Connected
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Please connect your GitHub account to start analyzing your repositories.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              OAuth Connection
            </CardTitle>
            <CardDescription>
              Recommended method for secure authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Connect via GitHub OAuth to automatically grant access to your repositories.
              This is the most secure and convenient method.
            </p>
            <Button className="w-full" onClick={handleConnect} isLoading={isConnecting}>
              <Github className="mr-2 h-5 w-5" />
              Connect with GitHub
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Access Token</CardTitle>
            <CardDescription>
              Advanced users can use a PAT for integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="GitHub Username"
              placeholder="your-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              label="Personal Access Token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button variant="outline" className="w-full" onClick={handleConnect}>
              Connect with Token
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to Create a Personal Access Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-300">
                Go to{' '}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  GitHub Settings → Developer Settings → Personal Access Tokens
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-300">
                Click "Generate new token" and select "Generate new token (classic)"
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-300">
                Give your token a name and select these scopes: <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">repo</code>, <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">user</code>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold">
              4
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-300">
                Click "Generate token" and copy the token value
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold">
              5
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-300">
                Paste the token in the field above to connect
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-slate-700 dark:text-slate-300">
              Your tokens are encrypted and stored securely
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-slate-700 dark:text-slate-300">
              We only request read-only access to your repositories
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-slate-700 dark:text-slate-300">
              You can revoke access at any time from GitHub settings
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-slate-700 dark:text-slate-300">
              We never modify or push code to your repositories
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
