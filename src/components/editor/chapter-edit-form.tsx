"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { chapterSchema, type ChapterInput } from "@/lib/validations";

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  isFree: boolean;
}

interface ChapterEditFormProps {
  courseId: string;
  chapter: Chapter;
}

export function ChapterEditForm({ courseId, chapter }: ChapterEditFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ChapterInput>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: chapter.title,
      description: chapter.description || "",
      isFree: chapter.isFree,
    },
  });

  const onSubmit = async (data: ChapterInput) => {
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapter.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update chapter");
        return;
      }

      setSuccess(true);
      router.refresh();

      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Chapter Title *</Label>
        <Input
          id="title"
          {...register("title")}
          disabled={isSubmitting}
          className="focus-glow"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register("description")}
          disabled={isSubmitting}
          rows={3}
          className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 focus-glow transition-all duration-200"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isFree"
          {...register("isFree")}
          disabled={isSubmitting}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
        />
        <Label htmlFor="isFree" className="text-sm font-normal">
          Make this chapter free for preview
        </Label>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-fade-in">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-sm animate-fade-in">
          Chapter updated successfully!
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="btn-hover-lift"
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
