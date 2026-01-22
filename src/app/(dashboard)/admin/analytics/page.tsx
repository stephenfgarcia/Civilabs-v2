import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

// Infer types from the getAnalytics function
type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
type TopCourse = Analytics["topCourses"][number];
type TopInstructor = Analytics["topInstructors"][number];
type Category = Analytics["categories"][number];

import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Target,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

async function getAnalytics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    newUsers,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    recentEnrollments,
    totalCertificates,
    recentCertificates,
    completedEnrollments,
    quizAttempts,
    passedQuizzes,
    forumThreads,
    forumReplies,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.course.count(),
    db.course.count({ where: { isPublished: true } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.certificate.count(),
    db.certificate.count({ where: { issuedAt: { gte: thirtyDaysAgo } } }),
    db.enrollment.count({ where: { completedAt: { not: null } } }),
    db.quizAttempt.count(),
    db.quizAttempt.count({ where: { passed: true } }),
    db.forumThread.count(),
    db.forumReply.count(),
  ]);

  // Top courses
  const topCourses = await db.course.findMany({
    where: { isPublished: true },
    orderBy: {
      enrollments: { _count: "desc" },
    },
    take: 5,
    include: {
      instructor: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
  });

  // Top instructors
  const topInstructors = await db.user.findMany({
    where: {
      role: "INSTRUCTOR",
      courses: { some: { isPublished: true } },
    },
    take: 5,
    select: {
      id: true,
      name: true,
      image: true,
      courses: {
        where: { isPublished: true },
        select: {
          _count: { select: { enrollments: true } },
        },
      },
      _count: { select: { courses: true } },
    },
  });

  // Category distribution
  const categories = await db.category.findMany({
    include: {
      _count: { select: { courses: true } },
    },
  });

  return {
    totalUsers,
    newUsers,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    recentEnrollments,
    totalCertificates,
    recentCertificates,
    completionRate:
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0,
    quizPassRate:
      quizAttempts > 0 ? Math.round((passedQuizzes / quizAttempts) * 100) : 0,
    quizAttempts,
    forumActivity: forumThreads + forumReplies,
    topCourses,
    topInstructors: topInstructors.map((i) => ({
      ...i,
      totalStudents: i.courses.reduce(
        (acc, c) => acc + c._count.enrollments,
        0
      ),
    })),
    categories,
  };
}

export default async function AdminAnalyticsPage() {
  const analytics = await getAnalytics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Platform Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Overview of platform performance and engagement
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{analytics.totalUsers}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{analytics.newUsers} this month
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enrollments</p>
                <p className="text-3xl font-bold">{analytics.totalEnrollments}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{analytics.recentEnrollments} this month
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold">{analytics.completionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  of enrollments completed
                </p>
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
                <p className="text-sm text-muted-foreground">Quiz Pass Rate</p>
                <p className="text-3xl font-bold">{analytics.quizPassRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.quizAttempts} total attempts
                </p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">{analytics.publishedCourses}</p>
                <p className="text-sm text-muted-foreground">
                  Published Courses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">{analytics.totalCertificates}</p>
                <p className="text-sm text-muted-foreground">
                  Certificates Issued
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">{analytics.forumActivity}</p>
                <p className="text-sm text-muted-foreground">Forum Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">
                  {analytics.categories.length}
                </p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Courses by Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCourses.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No published courses yet
                </p>
              ) : (
                analytics.topCourses.map((course: TopCourse, index: number) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-3"
                  >
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        by {course.instructor.name}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {course._count.enrollments} students
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Instructors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Instructors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topInstructors.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No instructors yet
                </p>
              ) : (
                analytics.topInstructors.map((instructor: TopInstructor, index: number) => (
                  <div
                    key={instructor.id}
                    className="flex items-center gap-3"
                  >
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={instructor.image || undefined} />
                      <AvatarFallback>
                        {instructor.name?.[0] || "I"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {instructor.name || "Unnamed"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {instructor._count.courses} courses
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {instructor.totalStudents} students
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Course Distribution by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No categories created yet
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {analytics.categories.map((category: Category) => (
                <div
                  key={category.id}
                  className="p-4 rounded-lg border bg-muted/50"
                >
                  <p className="font-medium">{category.name}</p>
                  <p className="text-2xl font-bold mt-1">
                    {category._count.courses}
                  </p>
                  <p className="text-sm text-muted-foreground">courses</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
