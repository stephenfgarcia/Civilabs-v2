"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const lessonDetailsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
});

type LessonDetailsInput = z.infer<typeof lessonDetailsSchema>;

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  type: string;
}

interface LessonEditFormProps {
  courseId: string;
  chapterId: string;
  lesson: Lesson;
}

export function LessonEditForm({
  courseId,
  chapterId,
  lesson,
}: LessonEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<LessonDetailsInput>({
    resolver: zodResolver(lessonDetailsSchema),
    defaultValues: {
      title: lesson.title,
      description: lesson.description || "",
    },
  });

  const onSubmit = async (data: LessonDetailsInput) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update lesson:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Lesson Title</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Enter lesson title..."
          className="focus-glow"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Brief description of this lesson..."
          rows={3}
          className="focus-glow resize-none"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Lesson Type</Label>
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <span className="capitalize">{lesson.type.toLowerCase().replace("_", " ")}</span>
          <p className="text-xs text-muted-foreground mt-1">
            Lesson type cannot be changed after creation
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isLoading || !isDirty} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
