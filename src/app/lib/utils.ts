import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatRelativeTime(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return formatDate(date)
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 60) return 'text-cyan-600 dark:text-cyan-400'
  if (score >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-cyan-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950'
    case 'medium':
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950'
    case 'low':
      return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950'
  }
}

export function formatPriority(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'Cao'
    case 'medium':
      return 'Trung bình'
    case 'low':
      return 'Thấp'
  }
}

export function formatPortfolioImportance(importance: 'critical' | 'important' | 'nice-to-have'): string {
  switch (importance) {
    case 'critical':
      return 'Bắt buộc'
    case 'important':
      return 'Quan trọng'
    case 'nice-to-have':
      return 'Nên có'
  }
}
