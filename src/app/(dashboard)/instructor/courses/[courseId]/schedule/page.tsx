"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  type: string;
  availableFrom: string | null;
  availableUntil: string | null;
}

interface Chapter {
  id: string;
  title: string;
  position: number;
  availableFrom: string | null;
  availableUntil: string | null;
  lessons: Lesson[];
}

export default function ScheduleEditorPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchChapters = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/chapters`);
      if (res.ok) {
        const data = await res.json();
        setChapters(data);
      }
    } catch {
      setError("Failed to load course content");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  function formatDateForInput(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 16);
  }

  async function updateChapterSchedule(
    chapterId: string,
    availableFrom: string | null,
    availableUntil: string | null
  ) {
    setSaving(chapterId);
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availableFrom: availableFrom || null,
          availableUntil: availableUntil || null,
        }),
      });

      if (res.ok) {
        setSuccessMessage("Schedule updated");
        setTimeout(() => setSuccessMessage(""), 2000);
        setChapters((prev) =>
          prev.map((ch) =>
            ch.id === chapterId ? { ...ch, availableFrom, availableUntil } : ch
          )
        );
      } else {
        const data = await res.json();
        setError(data.message || "Failed to update schedule");
      }
    } catch {
      setError("Failed to update schedule");
    } finally {
      setSaving(null);
    }
  }

  async function updateLessonSchedule(
    chapterId: string,
    lessonId: string,
    availableFrom: string | null,
    availableUntil: string | null
  ) {
    setSaving(lessonId);
    setError("");
    try {
      const res = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            availableFrom: availableFrom || null,
            availableUntil: availableUntil || null,
          }),
        }
      );

      if (res.ok) {
        setSuccessMessage("Schedule updated");
        setTimeout(() => setSuccessMessage(""), 2000);
        setChapters((prev) =>
          prev.map((ch) =>
            ch.id === chapterId
              ? {
                  ...ch,
                  lessons: ch.lessons.map((l) =>
                    l.id === lessonId ? { ...l, availableFrom, availableUntil } : l
                  ),
                }
              : ch
          )
        );
      } else {
        const data = await res.json();
        setError(data.message || "Failed to update schedule");
      }
    } catch {
      setError("Failed to update schedule");
    } finally {
      setSaving(null);
    }
  }

  function clearChapterSchedule(chapterId: string) {
    updateChapterSchedule(chapterId, null, null);
  }

  function clearLessonSchedule(chapterId: string, lessonId: string) {
    updateLessonSchedule(chapterId, lessonId, null, null);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set availability windows for chapters and lessons. Content outside its window will be hidden from students.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-500 font-medium">
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {chapters.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500">No chapters found in this course.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Chapter Header with Schedule */}
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {index + 1}. {chapter.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {(chapter.availableFrom || chapter.availableUntil) && (
                    <button
                      onClick={() => clearChapterSchedule(chapter.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                      title="Clear chapter schedule"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Available From
                    </label>
                    <input
                      type="datetime-local"
                      value={formatDateForInput(chapter.availableFrom)}
                      onChange={(e) =>
                        updateChapterSchedule(
                          chapter.id,
                          e.target.value || null,
                          chapter.availableUntil
                        )
                      }
                      disabled={saving === chapter.id}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Available Until
                    </label>
                    <input
                      type="datetime-local"
                      value={formatDateForInput(chapter.availableUntil)}
                      onChange={(e) =>
                        updateChapterSchedule(
                          chapter.id,
                          chapter.availableFrom,
                          e.target.value || null
                        )
                      }
                      disabled={saving === chapter.id}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm disabled:opacity-50"
                    />
                  </div>
                </div>

                {chapter.availableFrom || chapter.availableUntil ? (
                  <div className="mt-2 text-xs text-blue-600">
                    {chapter.availableFrom && !chapter.availableUntil && (
                      <span>Opens: {new Date(chapter.availableFrom).toLocaleString()}</span>
                    )}
                    {!chapter.availableFrom && chapter.availableUntil && (
                      <span>Closes: {new Date(chapter.availableUntil).toLocaleString()}</span>
                    )}
                    {chapter.availableFrom && chapter.availableUntil && (
                      <span>
                        {new Date(chapter.availableFrom).toLocaleString()} — {new Date(chapter.availableUntil).toLocaleString()}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Lessons */}
              {chapter.lessons.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {chapter.lessons.map((lesson) => (
                    <div key={lesson.id} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              {lesson.type}
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {lesson.title}
                            </span>
                          </div>
                        </div>
                        {(lesson.availableFrom || lesson.availableUntil) && (
                          <button
                            onClick={() => clearLessonSchedule(chapter.id, lesson.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                            title="Clear lesson schedule"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <input
                            type="datetime-local"
                            value={formatDateForInput(lesson.availableFrom)}
                            onChange={(e) =>
                              updateLessonSchedule(
                                chapter.id,
                                lesson.id,
                                e.target.value || null,
                                lesson.availableUntil
                              )
                            }
                            disabled={saving === lesson.id}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs disabled:opacity-50"
                            placeholder="Available from..."
                          />
                        </div>
                        <div>
                          <input
                            type="datetime-local"
                            value={formatDateForInput(lesson.availableUntil)}
                            onChange={(e) =>
                              updateLessonSchedule(
                                chapter.id,
                                lesson.id,
                                lesson.availableFrom,
                                e.target.value || null
                              )
                            }
                            disabled={saving === lesson.id}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs disabled:opacity-50"
                            placeholder="Available until..."
                          />
                        </div>
                      </div>

                      {(lesson.availableFrom || lesson.availableUntil) && (
                        <div className="mt-1 text-xs text-blue-600">
                          {lesson.availableFrom && !lesson.availableUntil && (
                            <span>Opens: {new Date(lesson.availableFrom).toLocaleString()}</span>
                          )}
                          {!lesson.availableFrom && lesson.availableUntil && (
                            <span>Closes: {new Date(lesson.availableUntil).toLocaleString()}</span>
                          )}
                          {lesson.availableFrom && lesson.availableUntil && (
                            <span>
                              {new Date(lesson.availableFrom).toLocaleString()} — {new Date(lesson.availableUntil).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">How Content Scheduling Works</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li><strong>Available From</strong>: Content is hidden before this date.</li>
          <li><strong>Available Until</strong>: Content is hidden after this date.</li>
          <li>Chapter-level schedules apply to all lessons within the chapter.</li>
          <li>Lesson-level schedules can further restrict within a chapter&apos;s window.</li>
          <li>No dates set means content is always available (when published).</li>
        </ul>
      </div>
    </div>
  );
}
