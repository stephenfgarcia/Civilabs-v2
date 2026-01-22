import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Metadata } from "next";
import { BookOpen, Search, Filter, Users, Clock, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Browse Courses",
  description: "Explore our collection of engineering courses with interactive 3D content, video lessons, quizzes, and certificates.",
  openGraph: {
    title: "Browse Courses | CiviLabs LMS",
    description: "Explore our collection of engineering courses with interactive 3D content, video lessons, quizzes, and certificates.",
  },
};
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CourseFilters } from "@/components/courses/course-filters";

interface CoursesPageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

async function getCourses(categorySlug?: string, search?: string) {
  const where: Record<string, unknown> = {
    isPublished: true,
  };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  return db.course.findMany({
    where,
    include: {
      category: true,
      instructor: {
        select: {
          name: true,
          image: true,
        },
      },
      chapters: {
        where: { isPublished: true },
        include: {
          lessons: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getCategories() {
  return db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          courses: {
            where: { isPublished: true },
          },
        },
      },
    },
  });
}

async function getUserEnrollments(userId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    select: { courseId: true },
  });
  return new Set(enrollments.map((e) => e.courseId));
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const session = await auth();
  const { category, search } = await searchParams;

  const [courses, categories] = await Promise.all([
    getCourses(category, search),
    getCategories(),
  ]);

  const enrolledCourseIds = session?.user
    ? await getUserEnrollments(session.user.id)
    : new Set<string>();

  // Calculate total lessons for each course
  const coursesWithStats = courses.map((course) => {
    const totalLessons = course.chapters.reduce(
      (acc, chapter) => acc + chapter.lessons.length,
      0
    );
    const totalDuration = course.chapters.reduce(
      (acc, chapter) =>
        acc +
        chapter.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0),
      0
    );

    return {
      ...course,
      totalLessons,
      totalDuration,
      isEnrolled: enrolledCourseIds.has(course.id),
    };
  });

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Explore Courses</h1>
        <p className="text-muted-foreground mt-1">
          Browse our collection of courses and start learning today
        </p>
      </div>

      {/* Filters */}
      <CourseFilters
        categories={categories}
        selectedCategory={category}
        searchQuery={search}
      />

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {coursesWithStats.length} course{coursesWithStats.length !== 1 ? "s" : ""} found
          {category && ` in ${categories.find((c) => c.slug === category)?.name}`}
          {search && ` matching "${search}"`}
        </p>
      </div>

      {/* Course Grid */}
      {coursesWithStats.length === 0 ? (
        <Card className="animate-fade-in-up">
          <CardContent className="py-16 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No courses found</h2>
            <p className="text-muted-foreground mb-6">
              {search
                ? "Try a different search term"
                : "Check back later for new courses"}
            </p>
            {(category || search) && (
              <Button asChild variant="outline">
                <Link href="/courses">Clear Filters</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coursesWithStats.map((course, index) => (
            <Card
              key={course.id}
              hover
              className="overflow-hidden cascade-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Course Image */}
              <div className="aspect-video relative overflow-hidden bg-muted">
                {course.imageUrl ? (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-blue-subtle">
                    <BookOpen className="h-12 w-12 text-primary/50" />
                  </div>
                )}
                {course.isEnrolled && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                    Enrolled
                  </div>
                )}
                {course.category && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/90 backdrop-blur-sm text-xs font-medium rounded">
                    {course.category.name}
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description || "No description available"}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-2">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.totalLessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course._count.enrollments} students</span>
                  </div>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {course.instructor.image ? (
                      <img
                        src={course.instructor.image}
                        alt={course.instructor.name || "Instructor"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-primary">
                        {course.instructor.name?.charAt(0) || "I"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {course.instructor.name || "Instructor"}
                  </span>
                </div>
              </CardContent>

              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/courses/${course.id}`}>
                    {course.isEnrolled ? "Continue Learning" : "View Course"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
