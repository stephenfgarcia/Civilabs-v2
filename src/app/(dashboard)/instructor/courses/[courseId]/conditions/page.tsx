"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface ReleaseCondition {
  id: string;
  targetType: string;
  targetId: string;
  conditionType: string;
  conditionValue: Record<string, unknown>;
  operator: string;
  position: number;
}

interface ContentItem {
  id: string;
  title: string;
  type: "CHAPTER" | "LESSON" | "ASSIGNMENT" | "ASSESSMENT";
  parentTitle?: string;
}

const CONDITION_TYPES = [
  { value: "DATE_AFTER", label: "Date After", description: "Available after a specific date" },
  { value: "LESSON_COMPLETED", label: "Lesson Completed", description: "Requires a lesson to be completed" },
  { value: "CHAPTER_COMPLETED", label: "Chapter Completed", description: "Requires all lessons in a chapter to be completed" },
  { value: "ASSESSMENT_PASSED", label: "Assessment Passed", description: "Requires passing an assessment" },
  { value: "ASSESSMENT_SCORE_ABOVE", label: "Assessment Score Above", description: "Requires a minimum score on an assessment" },
  { value: "ASSIGNMENT_SUBMITTED", label: "Assignment Submitted", description: "Requires submitting an assignment" },
  { value: "ASSIGNMENT_GRADED", label: "Assignment Graded", description: "Requires an assignment to be graded" },
];

const TARGET_TYPES = [
  { value: "CHAPTER", label: "Chapter" },
  { value: "LESSON", label: "Lesson" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "ASSESSMENT", label: "Assessment" },
];

export default function ReleaseConditionsPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [conditions, setConditions] = useState<ReleaseCondition[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formTargetType, setFormTargetType] = useState("CHAPTER");
  const [formTargetId, setFormTargetId] = useState("");
  const [formConditionType, setFormConditionType] = useState("DATE_AFTER");
  const [formOperator, setFormOperator] = useState("AND");

  // Condition value fields
  const [formDate, setFormDate] = useState("");
  const [formLessonId, setFormLessonId] = useState("");
  const [formChapterId, setFormChapterId] = useState("");
  const [formAssessmentId, setFormAssessmentId] = useState("");
  const [formMinScore, setFormMinScore] = useState(70);
  const [formAssignmentId, setFormAssignmentId] = useState("");

  const fetchConditions = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/release-conditions`);
      if (res.ok) {
        const data = await res.json();
        setConditions(data);
      }
    } catch {
      setError("Failed to load conditions");
    }
  }, [courseId]);

  const fetchCourseContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/chapters`);
      if (res.ok) {
        const chapters = await res.json();
        const items: ContentItem[] = [];

        for (const chapter of chapters) {
          items.push({ id: chapter.id, title: chapter.title, type: "CHAPTER" });
          if (chapter.lessons) {
            for (const lesson of chapter.lessons) {
              items.push({
                id: lesson.id,
                title: lesson.title,
                type: "LESSON",
                parentTitle: chapter.title,
              });
            }
          }
        }

        // Fetch assignments
        const assignRes = await fetch(`/api/courses/${courseId}/assignments`);
        if (assignRes.ok) {
          const assignments = await assignRes.json();
          for (const a of assignments) {
            items.push({ id: a.id, title: a.title, type: "ASSIGNMENT" });
          }
        }

        // Fetch assessments (quizzes)
        const quizRes = await fetch(`/api/courses/${courseId}/quizzes`);
        if (quizRes.ok) {
          const quizzes = await quizRes.json();
          for (const q of quizzes) {
            items.push({ id: q.id, title: q.title, type: "ASSESSMENT" });
          }
        }

        setContentItems(items);
      }
    } catch {
      // Content fetch is best-effort
    }
  }, [courseId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchConditions(), fetchCourseContent()]);
      setLoading(false);
    }
    load();
  }, [fetchConditions, fetchCourseContent]);

  function resetForm() {
    setFormTargetType("CHAPTER");
    setFormTargetId("");
    setFormConditionType("DATE_AFTER");
    setFormOperator("AND");
    setFormDate("");
    setFormLessonId("");
    setFormChapterId("");
    setFormAssessmentId("");
    setFormMinScore(70);
    setFormAssignmentId("");
  }

  function buildConditionValue(): Record<string, unknown> {
    switch (formConditionType) {
      case "DATE_AFTER":
        return { date: formDate };
      case "LESSON_COMPLETED":
        return { lessonId: formLessonId };
      case "CHAPTER_COMPLETED":
        return { chapterId: formChapterId };
      case "ASSESSMENT_PASSED":
        return { assessmentId: formAssessmentId };
      case "ASSESSMENT_SCORE_ABOVE":
        return { assessmentId: formAssessmentId, minScore: formMinScore };
      case "ASSIGNMENT_SUBMITTED":
        return { assignmentId: formAssignmentId };
      case "ASSIGNMENT_GRADED":
        return { assignmentId: formAssignmentId };
      default:
        return {};
    }
  }

  function isFormValid(): boolean {
    if (!formTargetId) return false;
    switch (formConditionType) {
      case "DATE_AFTER":
        return !!formDate;
      case "LESSON_COMPLETED":
        return !!formLessonId;
      case "CHAPTER_COMPLETED":
        return !!formChapterId;
      case "ASSESSMENT_PASSED":
        return !!formAssessmentId;
      case "ASSESSMENT_SCORE_ABOVE":
        return !!formAssessmentId && formMinScore > 0 && formMinScore <= 100;
      case "ASSIGNMENT_SUBMITTED":
      case "ASSIGNMENT_GRADED":
        return !!formAssignmentId;
      default:
        return false;
    }
  }

  async function handleAddCondition(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid()) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/release-conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: formTargetType,
          targetId: formTargetId,
          conditionType: formConditionType,
          conditionValue: buildConditionValue(),
          operator: formOperator,
        }),
      });

      if (res.ok) {
        await fetchConditions();
        resetForm();
        setShowForm(false);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to add condition");
      }
    } catch {
      setError("Failed to add condition");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCondition(conditionId: string) {
    if (!confirm("Remove this release condition?")) return;

    try {
      const res = await fetch(
        `/api/courses/${courseId}/release-conditions?id=${conditionId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setConditions((prev) => prev.filter((c) => c.id !== conditionId));
      }
    } catch {
      setError("Failed to delete condition");
    }
  }

  function getTargetItems(type: string): ContentItem[] {
    return contentItems.filter((item) => item.type === type);
  }

  function getTargetLabel(targetType: string, targetId: string): string {
    const item = contentItems.find((i) => i.id === targetId);
    if (item) {
      return item.parentTitle ? `${item.parentTitle} → ${item.title}` : item.title;
    }
    return `${targetType}: ${targetId.substring(0, 8)}...`;
  }

  function getConditionLabel(condition: ReleaseCondition): string {
    const value = condition.conditionValue as Record<string, unknown>;
    switch (condition.conditionType) {
      case "DATE_AFTER":
        return `After ${value.date ? new Date(value.date as string).toLocaleDateString() : "unknown date"}`;
      case "LESSON_COMPLETED": {
        const lesson = contentItems.find((i) => i.id === value.lessonId);
        return `Complete "${lesson?.title || "Lesson"}"`;
      }
      case "CHAPTER_COMPLETED": {
        const chapter = contentItems.find((i) => i.id === value.chapterId);
        return `Complete all of "${chapter?.title || "Chapter"}"`;
      }
      case "ASSESSMENT_PASSED": {
        const quiz = contentItems.find((i) => i.id === value.assessmentId);
        return `Pass "${quiz?.title || "Assessment"}"`;
      }
      case "ASSESSMENT_SCORE_ABOVE": {
        const assessment = contentItems.find((i) => i.id === value.assessmentId);
        return `Score ≥ ${value.minScore}% on "${assessment?.title || "Assessment"}"`;
      }
      case "ASSIGNMENT_SUBMITTED": {
        const assignment = contentItems.find((i) => i.id === value.assignmentId);
        return `Submit "${assignment?.title || "Assignment"}"`;
      }
      case "ASSIGNMENT_GRADED": {
        const graded = contentItems.find((i) => i.id === value.assignmentId);
        return `"${graded?.title || "Assignment"}" graded`;
      }
      default:
        return condition.conditionType;
    }
  }

  // Group conditions by target
  function getGroupedConditions(): Map<string, ReleaseCondition[]> {
    const groups = new Map<string, ReleaseCondition[]>();
    for (const condition of conditions) {
      const key = `${condition.targetType}:${condition.targetId}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(condition);
    }
    return groups;
  }

  function renderConditionValueFields() {
    const lessons = contentItems.filter((i) => i.type === "LESSON");
    const chapters = contentItems.filter((i) => i.type === "CHAPTER");
    const assessments = contentItems.filter((i) => i.type === "ASSESSMENT");
    const assignments = contentItems.filter((i) => i.type === "ASSIGNMENT");

    switch (formConditionType) {
      case "DATE_AFTER":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available After Date
            </label>
            <input
              type="datetime-local"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        );

      case "LESSON_COMPLETED":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Lesson
            </label>
            <select
              value={formLessonId}
              onChange={(e) => setFormLessonId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select a lesson...</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.parentTitle ? `${l.parentTitle} → ` : ""}{l.title}
                </option>
              ))}
            </select>
          </div>
        );

      case "CHAPTER_COMPLETED":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Chapter
            </label>
            <select
              value={formChapterId}
              onChange={(e) => setFormChapterId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select a chapter...</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        );

      case "ASSESSMENT_PASSED":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Assessment
            </label>
            <select
              value={formAssessmentId}
              onChange={(e) => setFormAssessmentId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select an assessment...</option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
        );

      case "ASSESSMENT_SCORE_ABOVE":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Assessment
              </label>
              <select
                value={formAssessmentId}
                onChange={(e) => setFormAssessmentId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select an assessment...</option>
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Score (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={formMinScore}
                onChange={(e) => setFormMinScore(parseInt(e.target.value) || 0)}
                className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        );

      case "ASSIGNMENT_SUBMITTED":
      case "ASSIGNMENT_GRADED":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Assignment
            </label>
            <select
              value={formAssignmentId}
              onChange={(e) => setFormAssignmentId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select an assignment...</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const grouped = getGroupedConditions();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Release Conditions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Control when content becomes available to students based on prerequisites and dates.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + Add Condition
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-500 font-medium">×</button>
        </div>
      )}

      {/* Add Condition Form */}
      {showForm && (
        <div className="mb-6 border border-blue-200 rounded-lg bg-blue-50 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Release Condition</h2>
          <form onSubmit={handleAddCondition} className="space-y-4">
            {/* Target Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apply To (Type)
                </label>
                <select
                  value={formTargetType}
                  onChange={(e) => { setFormTargetType(e.target.value); setFormTargetId(""); }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {TARGET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apply To (Item)
                </label>
                <select
                  value={formTargetId}
                  onChange={(e) => setFormTargetId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select an item...</option>
                  {getTargetItems(formTargetType).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.parentTitle ? `${item.parentTitle} → ` : ""}{item.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Condition Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition Type
              </label>
              <select
                value={formConditionType}
                onChange={(e) => setFormConditionType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {CONDITION_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label} — {ct.description}</option>
                ))}
              </select>
            </div>

            {/* Condition Value Fields (dynamic) */}
            {renderConditionValueFields()}

            {/* Operator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logic Operator
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="operator"
                    value="AND"
                    checked={formOperator === "AND"}
                    onChange={(e) => setFormOperator(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">
                    <strong>AND</strong> — Must be met along with all other AND conditions
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="operator"
                    value="OR"
                    checked={formOperator === "OR"}
                    onChange={(e) => setFormOperator(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">
                    <strong>OR</strong> — At least one OR condition must be met
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving || !isFormValid()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Condition"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Conditions List - Grouped by Target */}
      {grouped.size === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No release conditions configured.</p>
          <p className="text-xs text-gray-400 mt-1">
            Add conditions to control when content becomes available to students.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([key, groupConditions]) => {
            const [targetType, targetId] = key.split(":");
            const targetLabel = getTargetLabel(targetType, targetId);
            const typeLabel = TARGET_TYPES.find((t) => t.value === targetType)?.label || targetType;

            const andConditions = groupConditions.filter((c) => c.operator === "AND");
            const orConditions = groupConditions.filter((c) => c.operator === "OR");

            return (
              <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Target Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      {typeLabel}
                    </span>
                    <span className="font-medium text-gray-900">{targetLabel}</span>
                  </div>
                </div>

                {/* Condition Tree */}
                <div className="p-4 space-y-3">
                  {/* AND conditions */}
                  {andConditions.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        ALL of these must be met (AND)
                      </div>
                      <div className="space-y-2">
                        {andConditions.map((condition) => (
                          <div
                            key={condition.id}
                            className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-amber-200 text-amber-800">
                                AND
                              </span>
                              <span className="text-sm text-gray-800">
                                {getConditionLabel(condition)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteCondition(condition.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                              title="Remove condition"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OR conditions */}
                  {orConditions.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        At least ONE of these must be met (OR)
                      </div>
                      <div className="space-y-2">
                        {orConditions.map((condition) => (
                          <div
                            key={condition.id}
                            className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-green-200 text-green-800">
                                OR
                              </span>
                              <span className="text-sm text-gray-800">
                                {getConditionLabel(condition)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteCondition(condition.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                              title="Remove condition"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Logic explanation */}
                  {andConditions.length > 0 && orConditions.length > 0 && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                      Students must satisfy <strong>all AND conditions</strong> plus{" "}
                      <strong>at least one OR condition</strong> to access this content.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {grouped.size > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">How Release Conditions Work</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>
              <strong className="text-amber-700">AND conditions</strong>: All must be satisfied for content to unlock.
            </li>
            <li>
              <strong className="text-green-700">OR conditions</strong>: At least one must be satisfied.
            </li>
            <li>
              When both AND and OR conditions exist, students must meet <em>all</em> AND conditions <em>and</em> at least one OR condition.
            </li>
            <li>Content with no conditions is always accessible.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
