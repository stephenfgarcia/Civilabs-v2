"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Trash2, MoreVertical, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CourseCloneDialog } from "./course-clone-dialog";

interface CourseActionsProps {
  courseId: string;
  courseTitle: string;
  isPublished: boolean;
  canPublish: boolean;
}

export function CourseActions({
  courseId,
  courseTitle,
  isPublished,
  canPublish,
}: CourseActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update publish status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/instructor");
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isPublished ? "outline" : "default"}
        onClick={handlePublish}
        disabled={isLoading || (!isPublished && !canPublish)}
        className="btn-hover-lift"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : isPublished ? (
          <EyeOff className="mr-2 h-4 w-4" />
        ) : (
          <Eye className="mr-2 h-4 w-4" />
        )}
        {isPublished ? "Unpublish" : "Publish"}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={isLoading}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="dropdown-enter">
          <DropdownMenuItem
            onClick={() => window.open(`/courses/${courseId}`, "_blank")}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview Course
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowCloneDialog(true)}>
            <Copy className="mr-2 h-4 w-4" />
            Clone Course
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Course
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CourseCloneDialog
        courseId={courseId}
        courseTitle={courseTitle}
        open={showCloneDialog}
        onClose={() => setShowCloneDialog(false)}
      />
    </div>
  );
}
