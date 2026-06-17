import { AdminRoadmapsPanel } from './AdminRoadmapsPanel'

export const AdminRoadmapsPage = () => {
  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Quản lý roadmap</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Kiểm tra, xem chi tiết và điều chỉnh trạng thái các lộ trình học của người dùng.
        </p>
      </div>

      <AdminRoadmapsPanel />
    </div>
  )
}
