"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  Video,
  FileText,
  Box,
  HelpCircle,
  ArrowLeft,
  Menu,
  X,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Lesson {
  id: string;
  title: string;
  type: string;
}

interface Quiz {
  id: string;
  title: string;
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
  quiz: Quiz | null;
}

interface Course {
  id: string;
  title: string;
  chapters: Chapter[];
}

interface CourseSidebarProps {
  course: Course;
  currentLessonId?: string;
  completedLessons: Set<string>;
  passedQuizzes: Set<string>;
  progressPercentage: number;
  lockedItems?: Record<string, string[]>;
}

const lessonTypeIcons = {
  VIDEO: Video,
  PDF: FileText,
  DOCUMENT: FileText,
  POWERPOINT: FileText,
  SCENE_3D: Box,
  TEXT: FileText,
};

export function CourseSidebar({
  course,
  currentLessonId,
  completedLessons,
  passedQuizzes,
  progressPercentage,
  lockedItems = {},
}: CourseSidebarProps) {
  const router = useRouter();
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(course.chapters.map((c) => c.id))
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleLessonClick = (lessonId: string) => {
    router.push(`/courses/${course.id}/learn?lesson=${lessonId}`);
    setIsMobileOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b">
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
          <Link href={`/courses/${course.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Link>
        </Button>
        <h2 className="font-semibold line-clamp-2">{course.title}</h2>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="flex-1 overflow-y-auto">
        {course.chapters.map((chapter, chapterIndex) => (
          <div key={chapter.id} className="border-b">
            {/* Chapter Header */}
            <button
              onClick={() => toggleChapter(chapter.id)}
              className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors text-left"
            >
              {expandedChapters.has(chapter.id) ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="text-sm font-medium flex-1 line-clamp-1">
                {chapterIndex + 1}. {chapter.title}
              </span>
            </button>

            {/* Lessons */}
            {expandedChapters.has(chapter.id) && (
              <div className="pb-2">
                {/* Chapter-level lock indicator */}
                {lockedItems[chapter.id] && (
                  <div className="mx-4 mb-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 flex-shrink-0" />
                    <span className="line-clamp-1">{lockedItems[chapter.id][0]}</span>
                  </div>
                )}
                {chapter.lessons.map((lesson) => {
                  const LessonIcon =
                    lessonTypeIcons[lesson.type as keyof typeof lessonTypeIcons] ||
                    FileText;
                  const isCompleted = completedLessons.has(lesson.id);
                  const isCurrent = lesson.id === currentLessonId;
                  const isLocked = !!lockedItems[lesson.id] || !!lockedItems[chapter.id];
                  const lockReasons = lockedItems[lesson.id] || lockedItems[chapter.id];

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isLocked && handleLessonClick(lesson.id)}
                      disabled={isLocked}
                      title={isLocked ? lockReasons?.join(", ") : undefined}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        isLocked
                          ? "opacity-50 cursor-not-allowed"
                          : isCurrent
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "hover:bg-muted/50"
                      }`}
                    >
                      {isLocked ? (
                        <Lock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      ) : isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <LessonIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 text-left line-clamp-1">
                        {lesson.title}
                      </span>
                    </button>
                  );
                })}

                {/* Quiz */}
                {chapter.quiz && (
                  <div className="px-4 py-2 flex items-center gap-3 text-sm bg-primary/5">
                    {passedQuizzes.has(chapter.quiz.id) ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="flex-1 line-clamp-1">
                      Quiz: {chapter.quiz.title}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 left-4 z-50 lg:hidden shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-background border-r flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
}
