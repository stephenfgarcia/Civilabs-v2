import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  Play,
  ChevronRight,
  Target,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StudentTodo } from "@/components/dashboard/student-todo";
import { UpcomingDeadlines } from "@/components/calendar/upcoming-deadlines";

async function getDashboardData(userId: string) {
  // Get enrollments with course data
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          instructor: {
            select: { name: true },
          },
          chapters: {
            where: { isPublished: true },
            include: {
              lessons: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Get progress for each course
  const coursesWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const lessonIds = enrollment.course.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => lesson.id)
      );

      const completedCount = await db.userProgress.count({
        where: {
          userId,
          lessonId: { in: lessonIds },
          isCompleted: true,
        },
      });

      const totalLessons = lessonIds.length;
      const progressPercentage =
        totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        ...enrollment,
        progress: {
          completed: completedCount,
          total: totalLessons,
          percentage: progressPercentage,
        },
      };
    })
  );

  // Get certificates
  const certificates = await db.certificate.findMany({
    where: { userId },
    include: {
      course: {
        select: { title: true },
      },
    },
    orderBy: { issuedAt: "desc" },
    take: 5,
  });

  // Calculate stats
  const totalCourses = enrollments.length;
  const completedCourses = coursesWithProgress.filter(
    (c) => c.progress.percentage === 100
  ).length;
  const inProgressCourses = coursesWithProgress.filter(
    (c) => c.progress.percentage > 0 && c.progress.percentage < 100
  ).length;
  const totalCertificates = certificates.length;

  return {
    enrollments: coursesWithProgress,
    certificates,
    stats: {
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalCertificates,
    },
  };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { enrollments, certificates, stats } = await getDashboardData(
    session.user.id
  );

  // Get in-progress and recent courses
  const inProgressCourses = enrollments.filter(
    (e) => e.progress.percentage > 0 && e.progress.percentage < 100
  );
  const recentCourses = enrollments.slice(0, 4);

  return (
    <div className="space-y-6 page-transition">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {session.user.name?.split(" ")[0] || "Student"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your progress and continue learning
        </p>
      </div>

      {/* To-Do Section - Only for students */}
      {session.user.role === "STUDENT" && (
        <div className="animate-fade-in-up">
          <StudentTodo />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 dashboard-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                <p className="text-3xl font-bold">{stats.totalCourses}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold">{stats.inProgressCourses}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{stats.completedCourses}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificates</p>
                <p className="text-3xl font-bold">{stats.totalCertificates}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Award className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-6">
          {inProgressCourses.length > 0 && (
            <Card className="animate-fade-in-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <CardTitle>Continue Learning</CardTitle>
                  </div>
                </div>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inProgressCourses.slice(0, 3).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    {/* Course Image */}
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {enrollment.course.imageUrl ? (
                        <img
                          src={enrollment.course.imageUrl}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-blue-subtle">
                          <BookOpen className="h-6 w-6 text-primary/50" />
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {enrollment.course.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${enrollment.progress.percentage}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {enrollment.progress.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <Button size="sm" asChild>
                      <Link href={`/courses/${enrollment.course.id}/learn`}>
                        <Play className="h-4 w-4 mr-1" />
                        Continue
                      </Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* My Courses */}
          <Card className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle>My Courses</CardTitle>
                </div>
                {enrollments.length > 4 && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/my-courses">
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    You haven't enrolled in any courses yet
                  </p>
                  <Button asChild>
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {recentCourses.map((enrollment, index) => (
                    <Link
                      key={enrollment.id}
                      href={`/courses/${enrollment.course.id}`}
                      className="group block p-4 rounded-lg border hover:border-primary/50 transition-colors cascade-item"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-3">
                        {enrollment.course.imageUrl ? (
                          <img
                            src={enrollment.course.imageUrl}
                            alt={enrollment.course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-blue-subtle">
                            <BookOpen className="h-8 w-8 text-primary/50" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {enrollment.course.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {enrollment.course.instructor.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              enrollment.progress.percentage === 100
                                ? "bg-green-500"
                                : "bg-primary"
                            }`}
                            style={{
                              width: `${enrollment.progress.percentage}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {enrollment.progress.percentage}%
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Certificates */}
          <Card className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle>Recent Certificates</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <div className="text-center py-6">
                  <Award className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Complete courses to earn certificates
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <Link
                      key={cert.id}
                      href={`/certificates/${cert.uniqueCode}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Award className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {cert.course.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {certificates.length > 0 && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/certificates">View All Certificates</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines - Only for students */}
          {session.user.role === "STUDENT" && (
            <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <UpcomingDeadlines />
            </div>
          )}

          {/* Quick Actions */}
          <Card className="animate-fade-in-up" style={{ animationDelay: "250ms" }}>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Link>
              </Button>
              {session.user.role === "STUDENT" && (
                <>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/calendar">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Calendar
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/progress">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      My Progress
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
