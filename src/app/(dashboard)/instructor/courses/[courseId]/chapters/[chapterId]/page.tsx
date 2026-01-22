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
import { ArrowLeft, Settings, List, Eye, EyeOff, HelpCircle } from "lucide-react";
import { ChapterEditForm } from "@/components/editor/chapter-edit-form";
import { LessonsList } from "@/components/editor/lessons-list";
import { ChapterActions } from "@/components/editor/chapter-actions";
import { QuizBuilder } from "@/components/editor/quiz-builder";

interface ChapterEditorPageProps {
  params: Promise<{ courseId: string; chapterId: string }>;
}

async function getChapter(courseId: string, chapterId: string, userId: string) {
  const chapter = await db.chapter.findUnique({
    where: {
      id: chapterId,
      courseId,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          instructorId: true,
        },
      },
      lessons: {
        orderBy: { position: "asc" },
      },
      quiz: {
        include: {
          questions: true,
        },
      },
    },
  });

  if (!chapter) {
    return null;
  }

  // Check if user is the owner or admin
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (chapter.course.instructorId !== userId && user?.role !== "ADMIN") {
    return null;
  }

  return chapter;
}

export default async function ChapterEditorPage({
  params,
}: ChapterEditorPageProps) {
  const session = await auth();
  const { courseId, chapterId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const chapter = await getChapter(courseId, chapterId, session.user.id);

  if (!chapter) {
    notFound();
  }

  // Check if chapter can be published
  const canPublish = chapter.lessons.length > 0;

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/instructor/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">
              {chapter.course.title}
            </p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{chapter.title}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  chapter.isPublished
                    ? "bg-green-500/20 text-green-600"
                    : "bg-yellow-500/20 text-yellow-600"
                }`}
              >
                {chapter.isPublished ? "Published" : "Draft"}
              </span>
            </div>
          </div>
        </div>
        <ChapterActions
          courseId={courseId}
          chapterId={chapterId}
          isPublished={chapter.isPublished}
          canPublish={canPublish}
        />
      </div>

      {/* Completion Banner */}
      {!chapter.isPublished && (
        <Card
          className={
            canPublish
              ? "border-green-500/50 bg-green-500/5"
              : "border-yellow-500/50 bg-yellow-500/5"
          }
        >
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
                    : "Add at least one lesson to publish"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {canPublish
                    ? "This chapter is ready to be published"
                    : "Students won't see this chapter until it's published"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Chapter Details */}
        <div className="space-y-6">
          <Card className="animate-fade-in-up">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle>Chapter Details</CardTitle>
              </div>
              <CardDescription>
                Basic information about this chapter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChapterEditForm
                courseId={courseId}
                chapter={chapter}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Lessons */}
        <div className="space-y-6">
          <Card className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <List className="h-5 w-5 text-primary" />
                <CardTitle>Lessons</CardTitle>
              </div>
              <CardDescription>
                Add and manage lessons in this chapter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LessonsList
                courseId={courseId}
                chapterId={chapterId}
                lessons={chapter.lessons}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quiz Section */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle>Chapter Quiz</CardTitle>
          </div>
          <CardDescription>
            Add a quiz to test student understanding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuizBuilder
            courseId={courseId}
            chapterId={chapterId}
            quiz={chapter.quiz ? {
              ...chapter.quiz,
              questions: chapter.quiz.questions.map(q => ({
                ...q,
                options: q.options as string[],
              })),
            } : null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
