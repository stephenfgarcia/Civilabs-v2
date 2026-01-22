import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Users, BarChart3, PlusCircle, Eye, Edit } from "lucide-react";

async function getInstructorStats(userId: string) {
  const [courses, totalEnrollments, publishedCourses] = await Promise.all([
    db.course.findMany({
      where: { instructorId: userId },
      include: {
        chapters: {
          include: {
            lessons: true,
          },
        },
        enrollments: true,
        _count: {
          select: {
            enrollments: true,
            chapters: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.enrollment.count({
      where: {
        course: {
          instructorId: userId,
        },
      },
    }),
    db.course.count({
      where: {
        instructorId: userId,
        isPublished: true,
      },
    }),
  ]);

  return {
    courses,
    totalCourses: courses.length,
    totalEnrollments,
    publishedCourses,
    draftCourses: courses.length - publishedCourses,
  };
}

export default async function InstructorDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is instructor or admin
  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
    redirect("/student");
  }

  const stats = await getInstructorStats(session.user.id);

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your courses and track student progress
          </p>
        </div>
        <Button asChild className="btn-hover-lift">
          <Link href="/instructor/courses/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 dashboard-grid">
        <Card hover>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedCourses} published, {stats.draftCourses} drafts
            </p>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedCourses}</div>
            <Progress
              value={stats.totalCourses > 0 ? (stats.publishedCourses / stats.totalCourses) * 100 : 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Enrollment</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCourses > 0
                ? Math.round(stats.totalEnrollments / stats.totalCourses)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Students per course
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Courses</h2>
          <Button variant="outline" asChild>
            <Link href="/instructor/courses">View All</Link>
          </Button>
        </div>

        {stats.courses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.courses.slice(0, 6).map((course, index) => (
              <Card
                key={course.id}
                hover
                className="cascade-item overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="aspect-video bg-gradient-blue-subtle relative">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.isPublished
                          ? "bg-green-500/20 text-green-600"
                          : "bg-yellow-500/20 text-yellow-600"
                      }`}
                    >
                      {course.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{course._count.chapters} chapters</span>
                    <span>{course._count.enrollments} students</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/instructor/courses/${course.id}`}>
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/instructor/courses/${course.id}/analytics`}>
                        <BarChart3 className="mr-1 h-3 w-3" />
                        Stats
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first course to start teaching
              </p>
              <Button asChild>
                <Link href="/instructor/courses/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Course
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
