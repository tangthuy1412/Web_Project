import { Card, CardContent } from '../../../app/components/ui/Card'
import { Skeleton } from '../../../app/components/ui/skeleton'

export const RoadmapSkeleton = () => (
  <Card>
    <CardContent className="p-5">
      <Skeleton className="mb-4 h-5 w-28" />
      <Skeleton className="mb-2 h-6 w-3/4" />
      <Skeleton className="mb-5 h-4 w-full" />
      <Skeleton className="mb-4 h-2 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </CardContent>
  </Card>
)
