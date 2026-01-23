import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Users,
  ChevronRight,
  Play,
  FileText,
  Video,
  Box,
  CheckCircle,
  Lock,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnrollButton } from "@/components/courses/enroll-button";
import { CourseReviews } from "@/components/courses/course-reviews";
import { CourseJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  if (!course) {
    return {
      title: "Course Not Found",
    };
  }

  const description = course.description
    ? course.description.slice(0, 160)
    : `Learn ${course.title} on CiviLabs LMS`;

  return {
    title: `${course.title} | CiviLabs`,
    description,
    openGraph: {
      title: course.title,
      description,
      type: "website",
      images: course.imageUrl ? [{ url: course.imageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description,
      images: course.imageUrl ? [course.imageUrl] : [],
    },
    other: {
      "course:instructor": course.instructor?.name || "CiviLabs Instructor",
      "course:category": course.category?.name || "General",
    },
  };
}

async function getCourse(courseId: string) {
  return db.course.findUnique({
    where: {
      id: courseId,
      isPublished: true,
    },
    include: {
      category: true,
      instructor: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
        },
      },
      chapters: {
        where: { isPublished: true },
        include: {
          lessons: {
            orderBy: { position: "asc" },
          },
          quiz: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
      prerequisites: {
        include: {
          prerequisiteCourse: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });
}

async function getEnrollment(userId: string, courseId: string) {
  return db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });
}

async function getUserProgress(userId: string, lessonIds: string[]) {
  const progress = await db.userProgress.findMany({
    where: {
      userId,
      lessonId: { in: lessonIds },
      isCompleted: true,
    },
    select: { lessonId: true },
  });
  return new Set(progress.map((p) => p.lessonId));
}

const lessonTypeIcons = {
  VIDEO: Video,
  PDF: FileText,
  DOCUMENT: FileText,
  POWERPOINT: FileText,
  SCENE_3D: Box,
  TEXT: FileText,
};

export default async function CoursePage({ params }: CoursePageProps) {
  const session = await auth();
  const { courseId } = await params;

  const course = await getCourse(courseId);

  if (!course) {
    notFound();
  }

  const enrollment = session?.user
    ? await getEnrollment(session.user.id, courseId)
    : null;

  const isEnrolled = !!enrollment;

  // Get all lesson IDs
  const allLessonIds = course.chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => lesson.id)
  );

  // Get user progress if enrolled
  const completedLessons = isEnrolled && session?.user
    ? await getUserProgress(session.user.id, allLessonIds)
    : new Set<string>();

  // Calculate stats
  const totalLessons = allLessonIds.length;
  const completedCount = completedLessons.size;
  const progressPercentage = totalLessons > 0
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  // Check prerequisite completion
  const prerequisiteStatus = await Promise.all(
    (course.prerequisites || []).map(async (prereq) => {
      if (!session?.user) return { ...prereq, completed: false };
      const enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: prereq.prerequisiteCourseId,
          },
        },
        select: { completedAt: true },
      });
      return { ...prereq, completed: !!enrollment?.completedAt };
    })
  );
  const hasUnmetPrerequisites = prerequisiteStatus.some((p) => !p.completed);

  // Find first incomplete lesson for "Continue" button
  let firstIncompleteLessonId: string | null = null;
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      if (!completedLessons.has(lesson.id)) {
        firstIncompleteLessonId = lesson.id;
        break;
      }
    }
    if (firstIncompleteLessonId) break;
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://civilabsreview.com";

  return (
    <>
      {/* JSON-LD Structured Data */}
      <CourseJsonLd
        name={course.title}
        description={course.description || `Learn ${course.title} on CiviLabs LMS`}
        url={`${APP_URL}/courses/${courseId}`}
        imageUrl={course.imageUrl || undefined}
        instructorName={course.instructor.name || undefined}
        numberOfLessons={totalLessons}
        enrollmentCount={course._count.enrollments}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Courses", url: "/courses" },
          { name: course.title, url: `/courses/${courseId}` },
        ]}
      />

      <div className="space-y-6 page-transition">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild>
        <Link href="/courses">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Link>
      </Button>

      {/* Course Header */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Image */}
          <div className="aspect-video rounded-xl overflow-hidden bg-muted animate-fade-in-up">
            {course.imageUrl ? (
              <img
                src={course.imageUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-blue">
                <BookOpen className="h-20 w-20 text-white/50" />
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="animate-fade-in-up" style={{ animationDelay: "50ms" }}>
            {course.category && (
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-3">
                {course.category.name}
              </span>
            )}
            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {course.description || "No description available."}
            </p>
          </div>

          {/* Stats */}
          <div
            className="flex flex-wrap gap-6 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-5 w-5" />
              <span>{totalLessons} lessons</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span>{course._count.enrollments} students enrolled</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-5 w-5" />
              <span>{course.chapters.length} chapters</span>
            </div>
          </div>

          {/* Instructor */}
          <Card className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <CardHeader>
              <CardTitle className="text-lg">Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {course.instructor.image ? (
                    <img
                      src={course.instructor.image}
                      alt={course.instructor.name || "Instructor"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {course.instructor.name?.charAt(0) || "I"}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {course.instructor.name || "Instructor"}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {course.instructor.bio || "Course instructor"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <CourseReviews
              courseId={courseId}
              isEnrolled={isEnrolled}
              userId={session?.user?.id}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Prerequisites Warning */}
          {!isEnrolled && prerequisiteStatus.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 animate-fade-in-up">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Prerequisites Required</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Complete these courses first
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {prerequisiteStatus.map((prereq) => (
                    <Link
                      key={prereq.prerequisiteCourseId}
                      href={`/courses/${prereq.prerequisiteCourse.id}`}
                      className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
                    >
                      {prereq.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                      )}
                      <span className={prereq.completed ? "line-through text-muted-foreground" : ""}>
                        {prereq.prerequisiteCourse.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enrollment Card */}
          <Card className="sticky top-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <CardContent className="pt-6">
              {isEnrolled ? (
                <div className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progressPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {completedCount} of {totalLessons} lessons completed
                    </p>
                  </div>

                  <Button asChild className="w-full btn-hover-lift">
                    <Link
                      href={
                        firstIncompleteLessonId
                          ? `/courses/${courseId}/learn?lesson=${firstIncompleteLessonId}`
                          : `/courses/${courseId}/learn`
                      }
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {progressPercentage === 100
                        ? "Review Course"
                        : progressPercentage > 0
                        ? "Continue Learning"
                        : "Start Learning"}
                    </Link>
                  </Button>

                  {progressPercentage === 100 && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/courses/${courseId}/certificate`}>
                        Get Certificate
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-2xl font-bold text-primary mb-1">Free</p>
                    <p className="text-sm text-muted-foreground">
                      Enroll to start learning
                    </p>
                  </div>
                  <EnrollButton courseId={courseId} />
                  <p className="text-xs text-center text-muted-foreground">
                    Get instant access to all course content
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Content */}
          <Card className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <CardHeader>
              <CardTitle className="text-lg">Course Content</CardTitle>
              <CardDescription>
                {course.chapters.length} chapters • {totalLessons} lessons
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {course.chapters.map((chapter, chapterIndex) => (
                  <div key={chapter.id} className="cascade-item" style={{ animationDelay: `${chapterIndex * 30}ms` }}>
                    {/* Chapter Header */}
                    <div className="px-6 py-3 bg-muted/30">
                      <h4 className="font-medium text-sm">
                        Chapter {chapterIndex + 1}: {chapter.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {chapter.lessons.length} lessons
                        {chapter.quiz && " + quiz"}
                      </p>
                    </div>

                    {/* Lessons */}
                    <div className="divide-y">
                      {chapter.lessons.map((lesson) => {
                        const LessonIcon =
                          lessonTypeIcons[lesson.type as keyof typeof lessonTypeIcons] ||
                          FileText;
                        const isCompleted = completedLessons.has(lesson.id);
                        const canAccess = isEnrolled || chapter.isFree;

                        return (
                          <div
                            key={lesson.id}
                            className={`flex items-center gap-3 px-6 py-3 text-sm ${
                              canAccess
                                ? "hover:bg-muted/50 cursor-pointer"
                                : "opacity-60"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            ) : canAccess ? (
                              <LessonIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="flex-1 truncate">{lesson.title}</span>
                            {lesson.duration && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round(lesson.duration / 60)}m
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {/* Quiz */}
                      {chapter.quiz && (
                        <div className="flex items-center gap-3 px-6 py-3 text-sm bg-primary/5">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="flex-1">Quiz: {chapter.quiz.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
