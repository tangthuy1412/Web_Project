import { useParams, Link } from 'react-router'
import { ArrowLeft, TrendingUp, AlertCircle, CheckCircle2, Code2, BookOpen, GitCommit, FileCode } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import * as Progress from '@radix-ui/react-progress'
import { useRepositoryStore } from '../../stores/repositoryStore'
import { formatDate, formatPortfolioImportance, formatPriority, getScoreColor, getScoreBgColor, getPriorityColor } from '../../lib/utils'

export const AnalysisResultPage = () => {
  const { id } = useParams()
  const { getAnalysisById } = useRepositoryStore()
  const analysis = getAnalysisById(id!)

  if (!analysis) {
    return (
      <div className="max-w-6xl">
        <p className="text-slate-500">Không tìm thấy kết quả phân tích</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <Link to="/repositories" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách repository
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {analysis.repositoryName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Hoàn tất phân tích vào {formatDate(analysis.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(analysis.scores.overall)}`}>
              {analysis.scores.overall}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Điểm tổng quan</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="info">{analysis.projectType}</Badge>
        {analysis.techStack.slice(0, 6).map((tech) => (
          <Badge key={tech} variant="default">{tech}</Badge>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Kiến trúc
              </p>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.scores.architecture)}`}>
              {analysis.scores.architecture}
            </div>
            <Progress.Root
              className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-full w-full h-2 mt-3"
              value={analysis.scores.architecture}
            >
              <Progress.Indicator
                className={`h-full transition-transform duration-300 ${getScoreBgColor(analysis.scores.architecture)}`}
                style={{ transform: `translateX(-${100 - analysis.scores.architecture}%)` }}
              />
            </Progress.Root>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Độ hoàn thiện
              </p>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.scores.completeness)}`}>
              {analysis.scores.completeness}
            </div>
            <Progress.Root
              className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-full w-full h-2 mt-3"
              value={analysis.scores.completeness}
            >
              <Progress.Indicator
                className={`h-full transition-transform duration-300 ${getScoreBgColor(analysis.scores.completeness)}`}
                style={{ transform: `translateX(-${100 - analysis.scores.completeness}%)` }}
              />
            </Progress.Root>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <GitCommit className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Chất lượng commit
              </p>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.scores.commitQuality)}`}>
              {analysis.scores.commitQuality}
            </div>
            <Progress.Root
              className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-full w-full h-2 mt-3"
              value={analysis.scores.commitQuality}
            >
              <Progress.Indicator
                className={`h-full transition-transform duration-300 ${getScoreBgColor(analysis.scores.commitQuality)}`}
                style={{ transform: `translateX(-${100 - analysis.scores.commitQuality}%)` }}
              />
            </Progress.Root>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Tài liệu
              </p>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.scores.documentation)}`}>
              {analysis.scores.documentation}
            </div>
            <Progress.Root
              className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-full w-full h-2 mt-3"
              value={analysis.scores.documentation}
            >
              <Progress.Indicator
                className={`h-full transition-transform duration-300 ${getScoreBgColor(analysis.scores.documentation)}`}
                style={{ transform: `translateX(-${100 - analysis.scores.documentation}%)` }}
              />
            </Progress.Root>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileCode className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Quy ước code
              </p>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.scores.codeConvention)}`}>
              {analysis.scores.codeConvention}
            </div>
            <Progress.Root
              className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-full w-full h-2 mt-3"
              value={analysis.scores.codeConvention}
            >
              <Progress.Indicator
                className={`h-full transition-transform duration-300 ${getScoreBgColor(analysis.scores.codeConvention)}`}
                style={{ transform: `translateX(-${100 - analysis.scores.codeConvention}%)` }}
              />
            </Progress.Root>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Điểm mạnh
            </CardTitle>
            <CardDescription>Những điểm dự án đang làm tốt</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Điểm cần cải thiện
            </CardTitle>
            <CardDescription>Những phần có thể nâng cấp thêm</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Đề xuất từ AI</CardTitle>
          <CardDescription>Các cải thiện được ưu tiên cho dự án của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                    {rec.title}
                  </h4>
                  <Badge className={getPriorityColor(rec.priority)}>
                    {formatPriority(rec.priority)}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {rec.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{rec.category}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Định hướng nghề nghiệp</CardTitle>
          <CardDescription>Phân tích lộ trình nghề nghiệp bằng AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                  Hướng chính
                </h4>
                <Badge variant="success">{analysis.careerDirection.confidence}% tin cậy</Badge>
              </div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-3">
                {analysis.careerDirection.primary}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {analysis.careerDirection.reasoning}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Hướng thay thế
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.careerDirection.secondary.map((path) => (
                  <Badge key={path} variant="info">{path}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mức độ sẵn sàng portfolio</CardTitle>
          <CardDescription>
            {analysis.portfolioReadiness.overallReadiness}% sẵn sàng đưa vào portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.portfolioReadiness.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                  )}
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.label}
                  </span>
                </div>
                <Badge
                  variant={
                    item.importance === 'critical'
                      ? 'danger'
                      : item.importance === 'important'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {formatPortfolioImportance(item.importance)}
                </Badge>
              </div>
            ))}
          </div>
          <Progress.Root
            className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-full w-full h-3 mt-6"
            value={analysis.portfolioReadiness.overallReadiness}
          >
            <Progress.Indicator
              className="h-full transition-transform duration-300 bg-gradient-to-r from-indigo-600 to-purple-600"
              style={{ transform: `translateX(-${100 - analysis.portfolioReadiness.overallReadiness}%)` }}
            />
          </Progress.Root>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link to="/chat" className="flex-1">
          <Button className="w-full">
            <TrendingUp className="mr-2 h-4 w-4" />
            Trao đổi với AI Mentor
          </Button>
        </Link>
        <Button variant="outline">
          Xuất báo cáo
        </Button>
      </div>
    </div>
  )
}
