"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CourseCloneDialogProps {
  courseId: string;
  courseTitle: string;
  open: boolean;
  onClose: () => void;
}

export function CourseCloneDialog({
  courseId,
  courseTitle,
  open,
  onClose,
}: CourseCloneDialogProps) {
  const router = useRouter();
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(`${courseTitle} (Copy)`);
  const [dateShiftDays, setDateShiftDays] = useState(0);
  const [includeAssignments, setIncludeAssignments] = useState(true);
  const [includeAssessments, setIncludeAssessments] = useState(true);
  const [includeRubrics, setIncludeRubrics] = useState(true);
  const [includeReleaseConditions, setIncludeReleaseConditions] = useState(true);
  const [includeAnnouncements, setIncludeAnnouncements] = useState(false);

  async function handleClone() {
    if (!title.trim()) return;

    setCloning(true);
    setError("");

    try {
      const res = await fetch(`/api/courses/${courseId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          dateShiftDays: dateShiftDays || undefined,
          includeAssignments,
          includeAssessments,
          includeRubrics,
          includeReleaseConditions,
          includeAnnouncements,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onClose();
        router.push(`/instructor/courses/${data.id}`);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to clone course");
      }
    } catch {
      setError("Failed to clone course");
    } finally {
      setCloning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clone Course</DialogTitle>
          <DialogDescription>
            Create a copy of &ldquo;{courseTitle}&rdquo; with all its content. The new course will start as a draft.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Course Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter course title..."
            />
          </div>

          {/* Date Shift */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift Dates (days)
            </label>
            <input
              type="number"
              value={dateShiftDays}
              onChange={(e) => setDateShiftDays(parseInt(e.target.value) || 0)}
              className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Shift all due dates and availability windows by this many days. Use positive values for future dates.
            </p>
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include in Clone
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeAssignments}
                  onChange={(e) => setIncludeAssignments(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm">Assignments</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeAssessments}
                  onChange={(e) => setIncludeAssessments(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm">Assessments (Quizzes)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeRubrics}
                  onChange={(e) => setIncludeRubrics(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm">Rubrics</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeReleaseConditions}
                  onChange={(e) => setIncludeReleaseConditions(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm">Release Conditions</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeAnnouncements}
                  onChange={(e) => setIncludeAnnouncements(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm">Announcements</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={cloning}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={cloning || !title.trim()}>
            {cloning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {cloning ? "Cloning..." : "Clone Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
