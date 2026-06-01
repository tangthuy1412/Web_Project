import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import type { SkillGapAnalysis } from '../types'

interface SkillGapChartProps {
  gaps: SkillGapAnalysis[]
}

export const SkillGapChart = ({ gaps }: SkillGapChartProps) => {
  const data = gaps.map((gap) => ({
    skill: gap.skill,
    current: gap.currentScore,
    target: gap.targetScore,
    gap: gap.targetScore - gap.currentScore
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biểu đồ khoảng trống kỹ năng</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11 }} angle={-18} textAnchor="end" height={58} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="current" fill="#6366f1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="target" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
