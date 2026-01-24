"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  Box,
  BookOpen,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Lesson {
  id: string;
  title: string;
  type: string;
  position: number;
}

interface Quiz {
  id: string;
  title: string;
}

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  lessons: Lesson[];
  quiz: Quiz | null;
}

interface ChaptersListProps {
  courseId: string;
  chapters: Chapter[];
}

export function ChaptersList({ courseId, chapters }: ChaptersListProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(chapters.map((c) => c.id))
  );

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newChapterTitle,
        }),
      });

      if (response.ok) {
        setNewChapterTitle("");
        setIsCreating(false);
        router.refresh();
      } else {
        const data = await response.json();
        console.error("Failed to create chapter:", data.message);
        alert(data.message || "Failed to create chapter");
      }
    } catch (error) {
      console.error("Failed to create chapter:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;

    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete chapter:", error);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "SCENE_3D":
        return <Box className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Chapters List */}
      <div className="space-y-2">
        {chapters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No chapters yet</p>
            <p className="text-sm">Add your first chapter to get started</p>
          </div>
        ) : (
          chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className="border rounded-lg overflow-hidden bg-card cascade-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Chapter Header */}
              <div className="flex items-center gap-2 p-3 bg-muted/30">
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  {expandedChapters.has(chapter.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{chapter.title}</span>
                    {chapter.isFree && (
                      <span className="px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded">
                        Free
                      </span>
                    )}
                    {chapter.isPublished ? (
                      <Eye className="h-3 w-3 text-green-500" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {chapter.lessons.length} lessons
                    {chapter.quiz && " + quiz"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/instructor/courses/${courseId}/chapters/${chapter.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteChapter(chapter.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Lessons List (Expanded) */}
              {expandedChapters.has(chapter.id) && (
                <div className="border-t">
                  {chapter.lessons.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No lessons in this chapter
                    </div>
                  ) : (
                    <div className="divide-y">
                      {chapter.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={`/instructor/courses/${courseId}/chapters/${chapter.id}/lessons/${lesson.id}`}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="text-muted-foreground">
                            {getLessonIcon(lesson.type)}
                          </div>
                          <span className="text-sm">{lesson.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground capitalize">
                            {lesson.type.toLowerCase().replace("_", " ")}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="p-2 border-t bg-muted/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground hover:text-foreground"
                      asChild
                    >
                      <Link href={`/instructor/courses/${courseId}/chapters/${chapter.id}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Chapter */}
      {isCreating ? (
        <div className="flex gap-2 animate-fade-in">
          <Input
            placeholder="Chapter title..."
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateChapter()}
            disabled={isLoading}
            autoFocus
            className="focus-glow"
          />
          <Button onClick={handleCreateChapter} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setIsCreating(false);
              setNewChapterTitle("");
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Chapter
        </Button>
      )}
    </div>
  );
}
