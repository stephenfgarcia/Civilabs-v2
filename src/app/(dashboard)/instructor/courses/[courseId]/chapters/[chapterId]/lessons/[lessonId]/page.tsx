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
  Settings,
  Video,
  FileText,
  File,
  Box,
  Type,
} from "lucide-react";
import { LessonEditForm } from "@/components/editor/lesson-edit-form";
import { LessonContentEditor } from "@/components/editor/lesson-content-editor";
import { LessonActions } from "@/components/editor/lesson-actions";

interface LessonEditorPageProps {
  params: Promise<{ courseId: string; chapterId: string; lessonId: string }>;
}

async function getLesson(
  courseId: string,
  chapterId: string,
  lessonId: string,
  userId: string
) {
  const lesson = await db.lesson.findUnique({
    where: {
      id: lessonId,
      chapterId,
    },
    include: {
      chapter: {
        select: {
          id: true,
          title: true,
          course: {
            select: {
              id: true,
              title: true,
              instructorId: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    return null;
  }

  // Verify the chapter belongs to the course
  if (lesson.chapter.course.id !== courseId) {
    return null;
  }

  // Check if user is the owner or admin
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (lesson.chapter.course.instructorId !== userId && user?.role !== "ADMIN") {
    return null;
  }

  return lesson;
}

const lessonTypeInfo = {
  VIDEO: {
    label: "Video Lesson",
    icon: Video,
    description: "Upload or embed a video for students to watch",
  },
  PDF: {
    label: "PDF Document",
    icon: FileText,
    description: "Upload a PDF document for students to read",
  },
  DOCUMENT: {
    label: "Document",
    icon: File,
    description: "Upload a document (Word, Excel, etc.)",
  },
  POWERPOINT: {
    label: "PowerPoint",
    icon: File,
    description: "Upload a PowerPoint presentation",
  },
  SCENE_3D: {
    label: "3D Scene",
    icon: Box,
    description: "Configure an interactive 3D scene",
  },
  TEXT: {
    label: "Text Content",
    icon: Type,
    description: "Write rich text content for students",
  },
};

export default async function LessonEditorPage({
  params,
}: LessonEditorPageProps) {
  const session = await auth();
  const { courseId, chapterId, lessonId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const lesson = await getLesson(courseId, chapterId, lessonId, session.user.id);

  if (!lesson) {
    notFound();
  }

  const typeInfo = lessonTypeInfo[lesson.type as keyof typeof lessonTypeInfo];
  const TypeIcon = typeInfo?.icon || FileText;

  // Check if lesson has content
  const hasContent =
    lesson.content ||
    lesson.videoUrl ||
    lesson.attachmentUrl ||
    (lesson.sceneConfig && Object.keys(lesson.sceneConfig as object).length > 0);

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/instructor/courses/${courseId}/chapters/${chapterId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">
              {lesson.chapter.course.title} / {lesson.chapter.title}
            </p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{lesson.title}</h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                <TypeIcon className="h-3 w-3" />
                {typeInfo?.label || lesson.type}
              </span>
            </div>
          </div>
        </div>
        <LessonActions
          courseId={courseId}
          chapterId={chapterId}
          lessonId={lessonId}
        />
      </div>

      {/* Content Status Banner */}
      {!hasContent && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <TypeIcon className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium">Add content to this lesson</p>
                <p className="text-sm text-muted-foreground">
                  {typeInfo?.description || "Configure your lesson content below"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Lesson Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="animate-fade-in-up">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle>Lesson Details</CardTitle>
              </div>
              <CardDescription>Basic information about this lesson</CardDescription>
            </CardHeader>
            <CardContent>
              <LessonEditForm
                courseId={courseId}
                chapterId={chapterId}
                lesson={lesson}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Content Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TypeIcon className="h-5 w-5 text-primary" />
                <CardTitle>{typeInfo?.label || "Content"}</CardTitle>
              </div>
              <CardDescription>{typeInfo?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <LessonContentEditor
                courseId={courseId}
                chapterId={chapterId}
                lesson={lesson}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
