"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonActionsProps {
  courseId: string;
  chapterId: string;
  lessonId: string;
}

export function LessonActions({
  courseId,
  chapterId,
  lessonId,
}: LessonActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        router.push(`/instructor/courses/${courseId}/chapters/${chapterId}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete lesson:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="mr-2 h-4 w-4" />
        )}
        Delete Lesson
      </Button>
    </div>
  );
}
