import { StatGridSkeleton, CourseGridSkeleton } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome section skeleton */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats skeleton */}
      <StatGridSkeleton count={4} />

      {/* Continue Learning section */}
      <div>
        <Skeleton className="h-6 w-40 mb-4" />
        <CourseGridSkeleton count={3} />
      </div>
    </div>
  );
}
