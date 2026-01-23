import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  BookOpen,
  Award,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch student analytics
  const [enrollments, quizAttempts, certificates, recentProgress] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          include: {
            chapters: {
              where: { isPublished: true },
              include: {
                lessons: { select: { id: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.quizAttempt.findMany({
      where: { userId: session.user.id },
      select: { score: true, passed: true, completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
    db.certificate.count({ where: { userId: session.user.id } }),
    db.userProgress.findMany({
      where: { userId: session.user.id, isCompleted: true },
      select: { lessonId: true, completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 50,
    }),
  ]);

  // Calculate per-course progress
  const courseProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const lessonIds = enrollment.course.chapters.flatMap((ch) =>
        ch.lessons.map((l) => l.id)
      );
      const completedCount = await db.userProgress.count({
        where: {
          userId: session.user.id,
          lessonId: { in: lessonIds },
          isCompleted: true,
        },
      });
      const totalLessons = lessonIds.length;
      const percentage = totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0;

      return {
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        completedLessons: completedCount,
        totalLessons,
        percentage,
        isCompleted: !!enrollment.completedAt,
        enrolledAt: enrollment.createdAt,
      };
    })
  );

  // Summary stats
  const totalEnrolled = enrollments.length;
  const coursesCompleted = enrollments.filter((e) => e.completedAt).length;
  const averageProgress = courseProgress.length > 0
    ? Math.round(courseProgress.reduce((sum, c) => sum + c.percentage, 0) / courseProgress.length)
    : 0;
  const quizzesPassed = quizAttempts.filter((q) => q.passed).length;
  const averageQuizScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length)
    : 0;

  // Learning streak (days with activity in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentDays = new Set(
    recentProgress
      .filter((p) => p.completedAt && p.completedAt > sevenDaysAgo)
      .map((p) => p.completedAt!.toISOString().split("T")[0])
  );
  const streakDays = recentDays.size;

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold">My Progress</h1>
        <p className="text-muted-foreground mt-1">
          Track your learning journey and achievements
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEnrolled}</p>
                <p className="text-xs text-muted-foreground">Courses Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coursesCompleted}</p>
                <p className="text-xs text-muted-foreground">Courses Completed</p>
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
                <p className="text-2xl font-bold">{certificates}</p>
                <p className="text-xs text-muted-foreground">Certificates Earned</p>
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
                <p className="text-2xl font-bold">{averageProgress}%</p>
                <p className="text-xs text-muted-foreground">Average Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Performance & Streak */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Quiz Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{quizAttempts.length}</p>
                <p className="text-xs text-muted-foreground">Attempts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{quizzesPassed}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{averageQuizScore}%</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Learning Activity (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-bold text-primary">{streakDays}</p>
              <div>
                <p className="text-sm font-medium">Active Days</p>
                <p className="text-xs text-muted-foreground">
                  {recentProgress.length} lessons completed recently
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Course Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courseProgress.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No courses enrolled yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courseProgress.map((course) => (
                <Link
                  key={course.courseId}
                  href={`/courses/${course.courseId}`}
                  className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {course.isCompleted && (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                      <h4 className="font-medium text-sm truncate">
                        {course.courseTitle}
                      </h4>
                    </div>
                    <span className="text-sm font-medium text-primary shrink-0 ml-2">
                      {course.percentage}%
                    </span>
                  </div>
                  <Progress value={course.percentage} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    {course.completedLessons} of {course.totalLessons} lessons completed
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
