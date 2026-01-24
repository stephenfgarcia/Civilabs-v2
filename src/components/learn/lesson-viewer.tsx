"use client";

import { useState, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Loader2,
  Video,
  FileText,
  Box,
  Type,
  ExternalLink,
} from "lucide-react";
import { BookmarkButton } from "@/components/learn/bookmark-button";
import { NoteEditor } from "@/components/learn/note-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizPlayer } from "@/components/learn/quiz-player";
import { SceneConfig } from "@/types/scene";

// Lazy load the 3D viewer for better performance
const SceneViewer = lazy(() =>
  import("@/components/3d/scene-viewer").then((mod) => ({
    default: mod.SceneViewer,
  }))
);

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  type: string;
  content: string | null;
  videoUrl: string | null;
  attachmentUrl: string | null;
  sceneConfig: unknown;
}

interface Question {
  id: string;
  text: string;
  options: unknown;
  correctAnswer: number | null;
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passingScore: number;
  questions: Question[];
}

interface Chapter {
  id: string;
  title: string;
}

interface LessonViewerProps {
  courseId: string;
  chapter: Chapter;
  lesson: Lesson;
  isCompleted: boolean;
  isBookmarked: boolean;
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  quiz: Quiz | null;
  quizPassed: boolean;
}

export function LessonViewer({
  courseId,
  chapter,
  lesson,
  isCompleted,
  isBookmarked,
  previousLesson,
  nextLesson,
  quiz,
  quizPassed,
}: LessonViewerProps) {
  const router = useRouter();
  const [isMarking, setIsMarking] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleMarkComplete = async () => {
    setIsMarking(true);

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          isCompleted: !completed,
        }),
      });

      if (response.ok) {
        setCompleted(!completed);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    } finally {
      setIsMarking(false);
    }
  };

  const navigateToLesson = (lessonId: string) => {
    router.push(`/courses/${courseId}/learn?lesson=${lessonId}`);
  };

  const renderContent = () => {
    switch (lesson.type) {
      case "VIDEO":
        return renderVideoContent();
      case "TEXT":
        return renderTextContent();
      case "PDF":
      case "DOCUMENT":
      case "POWERPOINT":
        return renderDocumentContent();
      case "SCENE_3D":
        return renderSceneContent();
      default:
        return (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Content type not supported</p>
          </div>
        );
    }
  };

  const renderVideoContent = () => {
    if (!lesson.videoUrl) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">No video available</p>
        </div>
      );
    }

    // YouTube embed
    if (lesson.videoUrl.includes("youtube.com") || lesson.videoUrl.includes("youtu.be")) {
      const videoId = extractYouTubeId(lesson.videoUrl);
      return (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Vimeo embed
    if (lesson.videoUrl.includes("vimeo.com")) {
      const videoId = lesson.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
      return (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Direct video URL
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <video src={lesson.videoUrl} controls className="w-full h-full">
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  const renderTextContent = () => {
    if (!lesson.content) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Type className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>No content available</p>
        </div>
      );
    }

    return (
      <div className="prose prose-blue dark:prose-invert max-w-none">
        {/* Simple markdown-like rendering */}
        <div className="whitespace-pre-wrap leading-relaxed">
          {lesson.content}
        </div>
      </div>
    );
  };

  const renderDocumentContent = () => {
    if (!lesson.attachmentUrl) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>No document available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* PDF Embed attempt */}
        {lesson.attachmentUrl.toLowerCase().endsWith(".pdf") && (
          <div className="aspect-[4/3] rounded-lg overflow-hidden border">
            <iframe
              src={lesson.attachmentUrl}
              className="w-full h-full"
              title={lesson.title}
            />
          </div>
        )}

        <Button asChild variant="outline" className="w-full">
          <a
            href={lesson.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Document in New Tab
          </a>
        </Button>
      </div>
    );
  };

  const renderSceneContent = () => {
    const sceneConfig = lesson.sceneConfig as SceneConfig | null;

    if (!sceneConfig) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Box className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
            <p className="text-muted-foreground mb-2">3D Scene</p>
            <p className="text-sm text-muted-foreground">
              No 3D scene configured for this lesson
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <SceneViewer config={sceneConfig} editorMode={false} />
        </Suspense>
      </div>
    );
  };

  if (showQuiz && quiz) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <QuizPlayer
          courseId={courseId}
          chapterId={chapter.id}
          quiz={quiz}
          onComplete={() => {
            setShowQuiz(false);
            router.refresh();
          }}
          onBack={() => setShowQuiz(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{chapter.title}</p>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-muted-foreground mt-2">{lesson.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <BookmarkButton lessonId={lesson.id} isBookmarked={isBookmarked} />
            <NoteEditor lessonId={lesson.id} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in-up">{renderContent()}</div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t animate-fade-in-up">
        <Button
          variant={completed ? "outline" : "default"}
          onClick={handleMarkComplete}
          disabled={isMarking}
          className="w-full sm:w-auto"
        >
          {isMarking ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : completed ? (
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 mr-2" />
          )}
          {completed ? "Completed" : "Mark as Complete"}
        </Button>

        <div className="flex gap-2 w-full sm:w-auto">
          {previousLesson && (
            <Button
              variant="outline"
              onClick={() => navigateToLesson(previousLesson.id)}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          )}
          {nextLesson && (
            <Button
              onClick={() => navigateToLesson(nextLesson.id)}
              className="flex-1 sm:flex-none"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Quiz Section */}
      {quiz && (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {quizPassed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              Chapter Quiz: {quiz.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {quizPassed
                ? "Congratulations! You've passed this quiz."
                : `Complete this quiz to finish the chapter. Passing score: ${quiz.passingScore}%`}
            </p>
            <Button onClick={() => setShowQuiz(true)}>
              {quizPassed ? "Retake Quiz" : "Start Quiz"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : "";
}
