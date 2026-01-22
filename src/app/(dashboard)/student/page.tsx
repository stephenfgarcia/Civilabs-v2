import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Award, TrendingUp } from "lucide-react";

async function getStudentStats(userId: string) {
  const [enrollments, certificates, recentProgress] = await Promise.all([
    db.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            chapters: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    }),
    db.certificate.count({
      where: { userId },
    }),
    db.userProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        lesson: {
          include: {
            chapter: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // Calculate overall progress
  let totalLessons = 0;
  let completedLessons = 0;

  for (const enrollment of enrollments) {
    for (const chapter of enrollment.course.chapters) {
      totalLessons += chapter.lessons.length;
    }
  }

  const progress = await db.userProgress.count({
    where: {
      userId,
      isCompleted: true,
    },
  });
  completedLessons = progress;

  return {
    enrolledCourses: enrollments.length,
    certificates,
    totalLessons,
    completedLessons,
    progressPercentage:
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    recentProgress,
    enrollments,
  };
}

export default async function StudentDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const stats = await getStudentStats(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {session.user.name?.split(" ")[0] || "Student"}!
        </h1>
        <p className="text-muted-foreground">
          Track your progress and continue learning
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrolledCourses}</div>
            <p className="text-xs text-muted-foreground">
              Active enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lessons Completed
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedLessons}/{stats.totalLessons}
            </div>
            <p className="text-xs text-muted-foreground">
              Total lessons progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Certificates Earned
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificates}</div>
            <p className="text-xs text-muted-foreground">
              Completed courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.progressPercentage}%</div>
            <Progress value={stats.progressPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.enrollments.length > 0 ? (
              <div className="space-y-4">
                {stats.enrollments.slice(0, 3).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {enrollment.course.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.course.chapters.length} chapters
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No courses enrolled yet</p>
                <p className="text-sm">Browse courses to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest learning activity</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentProgress.length > 0 ? (
              <div className="space-y-4">
                {stats.recentProgress.map((progress) => (
                  <div
                    key={progress.id}
                    className="flex items-center gap-4 text-sm"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        progress.isCompleted ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{progress.lesson.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {progress.lesson.chapter.course.title}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {progress.isCompleted ? "Completed" : "In Progress"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Start a course to see your progress</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
