"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Video,
  FileText,
  Box,
  File,
  Loader2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Lesson {
  id: string;
  title: string;
  type: string;
  position: number;
}

interface LessonsListProps {
  courseId: string;
  chapterId: string;
  lessons: Lesson[];
}

const lessonTypes = [
  { value: "VIDEO", label: "Video", icon: Video },
  { value: "PDF", label: "PDF", icon: FileText },
  { value: "DOCUMENT", label: "Document", icon: File },
  { value: "SCENE_3D", label: "3D Scene", icon: Box },
  { value: "TEXT", label: "Text", icon: Type },
];

export function LessonsList({ courseId, chapterId, lessons }: LessonsListProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonType, setNewLessonType] = useState("VIDEO");

  const handleCreateLesson = async () => {
    if (!newLessonTitle.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/lessons`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newLessonTitle,
            type: newLessonType,
            position: lessons.length,
          }),
        }
      );

      if (response.ok) {
        setNewLessonTitle("");
        setNewLessonType("VIDEO");
        setIsCreating(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create lesson:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete lesson:", error);
    }
  };

  const getLessonIcon = (type: string) => {
    const lessonType = lessonTypes.find((t) => t.value === type);
    const Icon = lessonType?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Lessons List */}
      <div className="space-y-2">
        {lessons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lessons yet</p>
            <p className="text-sm">Add your first lesson to this chapter</p>
          </div>
        ) : (
          lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors cascade-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div className="text-primary">{getLessonIcon(lesson.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{lesson.title}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {lesson.type.toLowerCase().replace("_", " ")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={`/instructor/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteLesson(lesson.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Lesson Form */}
      {isCreating ? (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="lessonTitle">Lesson Title</Label>
            <Input
              id="lessonTitle"
              placeholder="Enter lesson title..."
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateLesson()}
              disabled={isLoading}
              autoFocus
              className="focus-glow"
            />
          </div>

          <div className="space-y-2">
            <Label>Lesson Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {lessonTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setNewLessonType(type.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                      newLessonType === type.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateLesson} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Lesson
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setNewLessonTitle("");
                setNewLessonType("VIDEO");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
      )}
    </div>
  );
}
