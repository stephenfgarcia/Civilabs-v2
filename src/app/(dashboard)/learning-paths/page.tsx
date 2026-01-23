import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BookOpen, Users, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LearningPathEnrollButton } from "@/components/courses/learning-path-enroll-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LearningPathsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const learningPaths = await db.learningPath.findMany({
    where: { isPublished: true },
    include: {
      courses: {
        orderBy: { position: "asc" },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              _count: {
                select: { enrollments: true, chapters: true },
              },
            },
          },
        },
      },
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { position: "asc" },
  });

  // Get user's enrollments
  const userEnrollments = await db.learningPathEnrollment.findMany({
    where: { userId: session.user.id },
    select: { learningPathId: true },
  });
  const enrolledPathIds = new Set(userEnrollments.map((e) => e.learningPathId));

  // Get user's course enrollments for progress
  const userCourseEnrollments = await db.enrollment.findMany({
    where: { userId: session.user.id },
    select: { courseId: true, completedAt: true },
  });
  const courseCompletionMap = new Map(
    userCourseEnrollments.map((e) => [e.courseId, !!e.completedAt])
  );

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold">Learning Paths</h1>
        <p className="text-muted-foreground mt-1">
          Structured course sequences to guide your learning journey
        </p>
      </div>

      {learningPaths.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">No learning paths available</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              Learning paths will be available soon. Browse individual courses in the meantime.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {learningPaths.map((path) => {
            const isEnrolled = enrolledPathIds.has(path.id);
            const completedCourses = path.courses.filter(
              (pc) => courseCompletionMap.get(pc.courseId)
            ).length;
            const totalCourses = path.courses.length;
            const progressPercent = totalCourses > 0
              ? Math.round((completedCourses / totalCourses) * 100)
              : 0;

            return (
              <Card key={path.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">{path.title}</CardTitle>
                      {path.description && (
                        <p className="text-muted-foreground mt-2 text-sm">
                          {path.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {totalCourses} course{totalCourses !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {path._count.enrollments} enrolled
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isEnrolled ? (
                        <Badge variant="secondary">
                          {progressPercent === 100 ? "Completed" : `${progressPercent}% Complete`}
                        </Badge>
                      ) : (
                        <LearningPathEnrollButton pathId={path.id} />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress Bar for enrolled users */}
                  {isEnrolled && (
                    <div className="mb-4">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {completedCourses} of {totalCourses} courses completed
                      </p>
                    </div>
                  )}

                  {/* Course List */}
                  <div className="space-y-2">
                    {path.courses.map((pc, index) => {
                      const isCompleted = courseCompletionMap.get(pc.courseId);
                      return (
                        <Link
                          key={pc.id}
                          href={`/courses/${pc.courseId}`}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{pc.course.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {pc.course._count.chapters} chapter{pc.course._count.chapters !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {isCompleted ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 shrink-0">
                              Completed
                            </Badge>
                          ) : isEnrolled ? (
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
