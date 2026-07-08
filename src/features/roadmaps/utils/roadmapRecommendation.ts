import type { AnalysisResult } from '../../../app/types'
import { roadmapTargetRoles } from '../constants/roadmapTargetRoles'

type Role = typeof roadmapTargetRoles[number]

export type RoadmapRoleRecommendation = {
  role: Role
  title: string
  reason: string
  focus: string
}

const includesAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword))

const scoreRoles = (analyses: AnalysisResult[]) => {
  const text = collectAnalysisText(analyses)
  const scores = new Map<Role, number>(roadmapTargetRoles.map((role) => [role, 0]))
  const add = (role: Role, value: number) => scores.set(role, (scores.get(role) ?? 0) + value)

  if (includesAny(text, ['react', 'vue', 'frontend', 'css', 'html', 'ui', 'web-vitals'])) add('Frontend Developer', 4)
  if (includesAny(text, ['node', 'express', 'mongodb', 'mongoose', 'jwt', 'api', 'backend', 'server'])) add('Backend Developer', 4)
  if (includesAny(text, ['mobile', 'react native', 'flutter', 'android', 'ios'])) add('Mobile Developer', 5)
  if (includesAny(text, ['docker', 'ci/cd', 'deployment', 'deploy', 'github actions', 'devops', 'cloud'])) add('DevOps Engineer', 4)
  if (includesAny(text, ['data', 'dashboard', 'analytics', 'python', 'pandas', 'sql', 'ai', 'machine learning', 'ml', 'model', 'gemini', 'llm'])) add('Data Scientist', 4)

  if (includesAny(text, ['react', 'frontend']) && includesAny(text, ['node', 'express', 'mongodb', 'api', 'backend'])) {
    add('Frontend Developer', 2)
    add('Backend Developer', 2)
  }

  analyses.forEach((analysis) => {
    const missing = analysis.missingSkills.map((skill) => skill.name.toLowerCase()).join(' ')
    if (includesAny(missing, ['docker', 'deployment', 'ci/cd', 'cloud'])) add('DevOps Engineer', 2)
    if (includesAny(missing, ['testing', 'test', 'api', 'node'])) add('Backend Developer', 1)
    if (includesAny(missing, ['data', 'python', 'sql', 'machine learning', 'ai'])) add('Data Scientist', 2)
  })

  return scores
}

export const getSuggestedRoadmapRoles = (analyses: AnalysisResult[], limit = 3): Role[] => {
  if (analyses.length === 0) return roadmapTargetRoles.slice(0, limit)

  return Array.from(scoreRoles(analyses).entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([role]) => role)
}

const collectAnalysisText = (analyses: AnalysisResult[]) =>
  analyses
    .flatMap((analysis) => [
      analysis.projectType,
      analysis.careerDirection?.primary,
      ...(analysis.careerDirection?.secondary ?? []),
      ...(analysis.languages ?? []),
      ...(analysis.frameworks ?? []),
      ...(analysis.techStack ?? []),
      ...(analysis.skillSignals ?? []),
      ...(analysis.careerSignals ?? []),
      ...analysis.strengths,
      ...analysis.weaknesses,
      ...analysis.missingSkills.map((skill) => skill.name)
    ])
    .join(' ')
    .toLowerCase()

const reasonByRole: Record<Role, string> = {
  'Backend Developer': 'Hệ thống thấy nhiều tín hiệu về API, dữ liệu, xác thực hoặc cấu trúc backend trong các dự án đã phân tích.',
  'Frontend Developer': 'Hệ thống thấy nhiều tín hiệu về giao diện, React hoặc trải nghiệm người dùng trong các dự án đã phân tích.',
  'Mobile Developer': 'Hệ thống thấy tín hiệu liên quan đến mobile hoặc framework mobile trong dữ liệu phân tích.',
  'DevOps Engineer': 'Hệ thống thấy Docker, triển khai, CI/CD hoặc hạ tầng là phần nên ưu tiên để dự án sẵn sàng hơn.',
  'Data Scientist': 'Hệ thống thấy tín hiệu về dữ liệu, Python, SQL, AI hoặc mô hình học máy trong dữ liệu phân tích.'
}

export const recommendRoadmapRole = (analyses: AnalysisResult[]): RoadmapRoleRecommendation | null => {
  if (analyses.length === 0) return null

  const [role, score] = Array.from(scoreRoles(analyses).entries()).sort((a, b) => b[1] - a[1])[0]

  if (!role || score <= 0) {
    return {
      role: 'Backend Developer',
      title: 'Đề xuất chính theo dự án',
      reason: 'Hệ thống chưa thấy tín hiệu đủ rõ, nên chọn Backend Developer làm hướng nền tảng để bạn củng cố API, dữ liệu và cấu trúc hệ thống.',
      focus: 'Nền tảng API, database, xác thực và cấu trúc backend.'
    }
  }

  return {
    role,
    title: 'Đề xuất chính theo dự án',
    reason: reasonByRole[role],
    focus: 'Tập trung vào hướng nghề nghiệp nổi bật nhất từ các dự án đã phân tích.'
  }
}

export const recommendJobReadinessRoadmaps = (analyses: AnalysisResult[]): RoadmapRoleRecommendation[] => {
  if (analyses.length === 0) return []

  const text = collectAnalysisText(analyses)
  const suggestions: RoadmapRoleRecommendation[] = []

  if (includesAny(text, ['docker', 'deployment', 'ci/cd', 'github actions', 'environment configuration', '.env', 'cloud'])) {
    suggestions.push({
      role: 'DevOps Engineer',
      title: 'Đề xuất phụ: sẵn sàng triển khai',
      reason: 'Các phân tích cho thấy Docker, CI/CD hoặc cấu hình môi trường là điểm nên cải thiện để dự án dễ chạy và dễ demo.',
      focus: 'Dockerfile, docker-compose, GitHub Actions, biến môi trường và hướng dẫn deploy.'
    })
  }

  if (suggestions.length < 2 && includesAny(text, ['data', 'dashboard', 'analytics', 'python', 'pandas', 'sql', 'ai', 'machine learning', 'llm'])) {
    suggestions.push({
      role: 'Data Scientist',
      title: 'Đề xuất phụ: khai thác dữ liệu tốt hơn',
      reason: 'Dữ liệu phân tích có tín hiệu về xử lý dữ liệu hoặc AI, phù hợp để bổ sung năng lực phân tích và mô hình hóa.',
      focus: 'Python, SQL, phân tích dữ liệu, mô hình cơ bản và cách trình bày kết quả.'
    })
  }

  if (suggestions.length < 2 && includesAny(text, ['react', 'frontend', 'ui', 'css', 'html'])) {
    suggestions.push({
      role: 'Frontend Developer',
      title: 'Đề xuất phụ: hoàn thiện trải nghiệm sản phẩm',
      reason: 'Bạn có tín hiệu frontend rõ, nên lộ trình phụ có thể giúp giao diện dễ dùng và dễ trình bày hơn.',
      focus: 'Component, state, responsive UI, accessibility và tài liệu demo.'
    })
  }

  if (suggestions.length < 2) {
    suggestions.push({
      role: 'Backend Developer',
      title: 'Đề xuất phụ: củng cố nền tảng kỹ thuật',
      reason: 'Backend là nền tảng tốt để chứng minh năng lực API, dữ liệu, xác thực và cấu trúc hệ thống khi ứng tuyển.',
      focus: 'REST API, database, validation, authentication và tài liệu kỹ thuật.'
    })
  }

  return suggestions.slice(0, 2)
}
