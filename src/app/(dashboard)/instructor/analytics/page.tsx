import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInstructorAnalytics } from "@/lib/analytics";
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InstructorAnalyticsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const analytics = await getInstructorAnalytics(session.user.id);

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold">Instructor Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your courses performance and student engagement
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalCourses}</p>
                <p className="text-xs text-muted-foreground">Published Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalStudents}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalCompletions}</p>
                <p className="text-xs text-muted-foreground">Course Completions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.averageCompletionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Course Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No published courses yet</p>
              <p className="text-sm mt-1">Create and publish courses to see analytics</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.courses.map((course) => {
                const completionRate = course.enrollments > 0
                  ? Math.round((course.completions / course.enrollments) * 100)
                  : 0;

                return (
                  <Link
                    key={course.id}
                    href={`/instructor/courses/${course.id}`}
                    className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm truncate flex-1 mr-4">
                        {course.title}
                      </h4>
                      <span className="text-sm font-medium text-primary shrink-0">
                        {completionRate}%
                      </span>
                    </div>
                    <Progress value={completionRate} className="h-2 mb-2" />
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{course.enrollments} student{course.enrollments !== 1 ? "s" : ""}</span>
                      <span>{course.completions} completion{course.completions !== 1 ? "s" : ""}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
