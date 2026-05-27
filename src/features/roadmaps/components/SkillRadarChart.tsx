import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../app/components/ui/Card'
import type { SkillProgress } from '../types'

interface SkillRadarChartProps {
  skills: SkillProgress[]
}

export const SkillRadarChart = ({ skills }: SkillRadarChartProps) => {
  const data = skills.map((skill) => ({
    skill: skill.skill.replace(' ', '\n'),
    current: skill.current,
    target: skill.target
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill Growth Radar</CardTitle>
        <CardDescription>Current capability against target career level</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid stroke="#cbd5e1" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip />
            <Radar name="Current" dataKey="current" stroke="#6366f1" fill="#6366f1" fillOpacity={0.45} />
            <Radar name="Target" dataKey="target" stroke="#22c55e" fill="#22c55e" fillOpacity={0.16} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
