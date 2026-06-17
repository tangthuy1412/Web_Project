import { useEffect, useRef, useState } from 'react'
import { Github } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../stores/authStore'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              width?: number
            }
          ) => void
        }
      }
    }
  }
}

type SocialLoginPanelProps = {
  onSuccess: () => void
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

const loadGoogleScript = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src^="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Không thể tải đăng nhập Google.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client?hl=vi'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Không thể tải đăng nhập Google.'))
    document.head.appendChild(script)
  })
}

export const SocialLoginPanel = ({ onSuccess }: SocialLoginPanelProps) => {
  const { loginWithGoogle, startGitHubLogin } = useAuthStore()
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const googleButtonShellRef = useRef<HTMLDivElement | null>(null)
  const [notice, setNotice] = useState('')
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)

  useEffect(() => {
    if (!googleClientId) return

    let isMounted = true
    let resizeObserver: ResizeObserver | null = null

    const renderGoogleButton = () => {
      if (!isMounted || !googleButtonRef.current || !window.google?.accounts?.id) return

      const width = Math.max(220, Math.min(420, googleButtonShellRef.current?.clientWidth ?? 320))

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          setNotice('')

          if (!response.credential) {
            setNotice('Không nhận được xác thực từ Google. Vui lòng thử lại.')
            return
          }

          try {
            await loginWithGoogle(response.credential)
            onSuccess()
          } catch {
            setNotice('Đăng nhập Google thất bại. Vui lòng thử lại.')
          }
        }
      })

      googleButtonRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width
      })
      setIsGoogleReady(true)
    }

    loadGoogleScript()
      .then(() => {
        renderGoogleButton()

        if (googleButtonShellRef.current) {
          resizeObserver = new ResizeObserver(renderGoogleButton)
          resizeObserver.observe(googleButtonShellRef.current)
        }
      })
      .catch(() => {
        if (isMounted) setNotice('Không thể tải đăng nhập Google. Vui lòng thử lại sau.')
      })

    return () => {
      isMounted = false
      resizeObserver?.disconnect()
    }
  }, [loginWithGoogle, onSuccess])

  const handleGithubLogin = async () => {
    setNotice('')
    setIsGithubLoading(true)

    try {
      await startGitHubLogin()
    } catch {
      setNotice('Không thể mở đăng nhập GitHub. Vui lòng thử lại.')
      setIsGithubLoading(false)
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-slate-500 dark:bg-slate-900">Hoặc tiếp tục với</span>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          {notice}
        </div>
      )}

      <div className="space-y-3">
        <div
          ref={googleButtonShellRef}
          className="flex min-h-11 w-full items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-slate-900"
        >
          {googleClientId ? (
            <>
              <div ref={googleButtonRef} className="flex w-full justify-center" />
              {!isGoogleReady && <span className="text-sm text-slate-500">Đang tải Google...</span>}
            </>
          ) : (
            <span className="text-sm text-slate-500">Google chưa được cấu hình</span>
          )}
        </div>

        <Button type="button" variant="outline" className="w-full" isLoading={isGithubLoading} onClick={handleGithubLogin}>
          <Github className="mr-2 h-5 w-5" />
          Tiếp tục với GitHub
        </Button>
      </div>
    </div>
  )
}
