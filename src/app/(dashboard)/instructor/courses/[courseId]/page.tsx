import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  BookOpen,
  List,
  Settings,
  Eye,
  EyeOff,
  LayoutDashboard,
  FileText,
  Video,
  Box,
} from "lucide-react";
import { CourseEditForm } from "@/components/editor/course-edit-form";
import { ChaptersList } from "@/components/editor/chapters-list";
import { CourseActions } from "@/components/editor/course-actions";
import { AutoGradeToggle } from "@/components/editor/auto-grade-toggle";

interface CourseEditorPageProps {
  params: Promise<{ courseId: string }>;
}

async function getCourse(courseId: string, userId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        include: {
          lessons: true,
          quiz: true,
        },
        orderBy: { position: "asc" },
      },
      category: true,
    },
  });

  if (!course) {
    return null;
  }

  // Check if user is the owner or admin
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (course.instructorId !== userId && user?.role !== "ADMIN") {
    return null;
  }

  return course;
}

async function getCategories() {
  return db.category.findMany({
    orderBy: { name: "asc" },
  });
}

export default async function CourseEditorPage({ params }: CourseEditorPageProps) {
  const session = await auth();
  const { courseId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const [course, categories] = await Promise.all([
    getCourse(courseId, session.user.id),
    getCategories(),
  ]);

  if (!course) {
    notFound();
  }

  // Calculate completion stats
  const totalChapters = course.chapters.length;
  const publishedChapters = course.chapters.filter((c) => c.isPublished).length;
  const totalLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.length,
    0
  );

  const completionFields = [
    { label: "Title", completed: !!course.title },
    { label: "Description", completed: !!course.description },
    { label: "Image", completed: !!course.imageUrl },
    { label: "Category", completed: !!course.categoryId },
    { label: "Chapters", completed: totalChapters > 0 },
    { label: "Published chapter", completed: publishedChapters > 0 },
  ];

  const completedFields = completionFields.filter((f) => f.completed).length;
  const completionPercentage = Math.round(
    (completedFields / completionFields.length) * 100
  );

  const canPublish = completionPercentage === 100;

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/instructor">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  course.isPublished
                    ? "bg-green-500/20 text-green-600"
                    : "bg-yellow-500/20 text-yellow-600"
                }`}
              >
                {course.isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Course setup: {completedFields}/{completionFields.length} fields completed
            </p>
          </div>
        </div>
        <CourseActions
          courseId={course.id}
          courseTitle={course.title}
          isPublished={course.isPublished}
          canPublish={canPublish}
        />
      </div>

      {/* Completion Banner */}
      {!course.isPublished && (
        <Card className={canPublish ? "border-green-500/50 bg-green-500/5" : "border-yellow-500/50 bg-yellow-500/5"}>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              {canPublish ? (
                <Eye className="h-5 w-5 text-green-600" />
              ) : (
                <EyeOff className="h-5 w-5 text-yellow-600" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {canPublish
                    ? "Ready to publish!"
                    : `Complete all fields to publish your course`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {canPublish
                    ? "Your course is complete and ready for students"
                    : `${completionFields.length - completedFields} field(s) remaining`}
                </p>
              </div>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    canPublish ? "bg-green-500" : "bg-yellow-500"
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Course Details */}
        <div className="space-y-6">
          <Card className="animate-fade-in-up">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle>Course Details</CardTitle>
              </div>
              <CardDescription>
                Basic information about your course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseEditForm course={course} categories={categories} />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                <CardTitle>Course Overview</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <List className="h-6 w-6 mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold">{totalChapters}</div>
                  <div className="text-xs text-muted-foreground">Chapters</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <FileText className="h-6 w-6 mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold">{totalLessons}</div>
                  <div className="text-xs text-muted-foreground">Lessons</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Video className="h-6 w-6 mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold">
                    {course.chapters.reduce(
                      (acc, ch) => acc + ch.lessons.filter((l) => l.type === "VIDEO").length,
                      0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Videos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Chapters & Settings */}
        <div className="space-y-6">
          {/* Grading Settings */}
          <AutoGradeToggle courseId={course.id} initialValue={course.autoGradeSync} />

          <Card className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Course Content</CardTitle>
              </div>
              <CardDescription>
                Organize your course with chapters and lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChaptersList courseId={course.id} chapters={course.chapters} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
