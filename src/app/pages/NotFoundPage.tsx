import { Link } from 'react-router'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'

export const NotFoundPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-slate-200 dark:text-slate-800">404</h1>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Không tìm thấy trang
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Về bảng điều khiển
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </div>
      </div>
    </div>
  )
}
