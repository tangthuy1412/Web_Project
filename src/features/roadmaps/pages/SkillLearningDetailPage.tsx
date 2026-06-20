import { useParams } from 'react-router'

export const SkillLearningDetailPage = () => {
  const { id, skillName } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Trang học kỹ năng: {skillName}</h1>
      <p className="text-slate-500">ID Lộ trình: {id}</p>
    </div>
  )
}
