"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FileText, MessageSquare, CheckCircle, Clock, User, Grid3X3,
} from "lucide-react";

interface AssessmentAttempt {
  id: string;
  score: number;
  answers: Record<string, unknown>;
  completedAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  quiz: {
    id: string;
    title: string;
    assessmentType: string;
    chapter: { id: string; title: string };
    questions: Array<{ id: string; text: string; type: string; points: number }>;
  };
}

interface RubricLevel {
  label: string;
  description: string;
  points: number;
}

interface RubricCriterion {
  id: string;
  title: string;
  description: string | null;
  maxPoints: number;
  levels: RubricLevel[];
}

interface RubricData {
  id: string;
  title: string;
  criteria: RubricCriterion[];
}

interface AssignmentSubmission {
  id: string;
  status: string;
  submittedAt: string | null;
  textContent: string | null;
  fileUrl: string | null;
  fileName: string | null;
  urlLink: string | null;
  isLate: boolean;
  user: { id: string; name: string | null; email: string; image: string | null };
  assignment: {
    id: string;
    title: string;
    type: string;
    points: number;
    dueDate: string | null;
    rubricId: string | null;
  };
}

export default function GradingQueuePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assignments" | "assessments">("assignments");
  const [gradingItem, setGradingItem] = useState<string | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rubricData, setRubricData] = useState<RubricData | null>(null);
  const [rubricScores, setRubricScores] = useState<Record<string, { levelIndex: number; points: number; comment: string }>>({});

  useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    try {
      const res = await fetch(`/api/courses/${courseId}/grading-queue`);
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.assessmentAttempts);
        setSubmissions(data.assignmentSubmissions);
      }
    } catch {
      toast.error("Failed to load grading queue");
    } finally {
      setLoading(false);
    }
  }

  async function startGrading(sub: AssignmentSubmission) {
    setGradingItem(sub.id);
    setGrade("");
    setFeedback("");
    setRubricData(null);
    setRubricScores({});

    // Load rubric if assignment has one
    if (sub.assignment.rubricId) {
      try {
        const res = await fetch(`/api/courses/${courseId}/rubrics/${sub.assignment.rubricId}`);
        if (res.ok) {
          const data = await res.json();
          setRubricData(data);
        }
      } catch {
        // Rubric loading failed, fallback to simple grading
      }
    }
  }

  function selectRubricLevel(criterionId: string, levelIndex: number, points: number) {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], levelIndex, points, comment: prev[criterionId]?.comment || "" },
    }));
    // Auto-calculate total grade from rubric
    if (rubricData) {
      const newScores = { ...rubricScores, [criterionId]: { levelIndex, points, comment: rubricScores[criterionId]?.comment || "" } };
      const total = Object.values(newScores).reduce((sum, s) => sum + s.points, 0);
      setGrade(String(total));
    }
  }

  function setRubricComment(criterionId: string, comment: string) {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], levelIndex: prev[criterionId]?.levelIndex ?? -1, points: prev[criterionId]?.points ?? 0, comment },
    }));
  }

  async function gradeSubmission(submissionId: string, assignmentPoints: number) {
    const gradeNum = parseFloat(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > assignmentPoints) {
      toast.error(`Grade must be between 0 and ${assignmentPoints}`);
      return;
    }

    try {
      // Find the assignment ID for this submission
      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) return;

      const payload: Record<string, unknown> = {
        grade: gradeNum,
        feedback: feedback || undefined,
      };
      if (rubricData && Object.keys(rubricScores).length > 0) {
        payload.rubricScores = rubricScores;
      }

      const res = await fetch(
        `/api/courses/${courseId}/assignments/${submission.assignment.id}/submissions/${submissionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        toast.success("Graded successfully");
        setGradingItem(null);
        setGrade("");
        setFeedback("");
        fetchQueue();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to grade");
      }
    } catch {
      toast.error("Error grading submission");
    }
  }

  async function gradeAttempt(attemptId: string, chapterId: string, questionGrades: Record<string, { points: number }>) {
    try {
      // Find the chapter for this attempt
      const attempt = attempts.find((a) => a.id === attemptId);
      if (!attempt) return;

      const res = await fetch(
        `/api/courses/${courseId}/chapters/${attempt.quiz.chapter.id}/quiz/attempt/${attemptId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionGrades }),
        }
      );

      if (res.ok) {
        toast.success("Graded successfully");
        fetchQueue();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to grade");
      }
    } catch {
      toast.error("Error grading attempt");
    }
  }

  if (loading) return <div className="p-6">Loading grading queue...</div>;

  const totalPending = attempts.length + submissions.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grading Queue</h1>
        <p className="text-muted-foreground">
          {totalPending} item{totalPending !== 1 ? "s" : ""} pending review
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "assignments" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
          onClick={() => setActiveTab("assignments")}
        >
          <FileText className="w-4 h-4 inline mr-1" />
          Assignments ({submissions.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "assessments" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
          onClick={() => setActiveTab("assessments")}
        >
          <MessageSquare className="w-4 h-4 inline mr-1" />
          Assessments ({attempts.length})
        </button>
      </div>

      {/* Assignment Submissions */}
      {activeTab === "assignments" && (
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No assignment submissions pending grading</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{sub.assignment.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {sub.user.name || sub.user.email}
                      </span>
                      {sub.submittedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                      )}
                      {sub.isLate && (
                        <span className="text-red-600 font-medium">LATE</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{sub.assignment.points} pts</span>
                </div>

                {/* Submission content preview */}
                {sub.textContent && (
                  <div className="p-3 bg-muted/50 rounded text-sm max-h-32 overflow-y-auto">
                    {sub.textContent}
                  </div>
                )}
                {sub.fileUrl && (
                  <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    {sub.fileName || "View attached file"}
                  </a>
                )}
                {sub.urlLink && (
                  <a href={sub.urlLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    {sub.urlLink}
                  </a>
                )}

                {/* Grade form */}
                {gradingItem === sub.id ? (
                  <div className="pt-2 border-t space-y-3">
                    {/* Rubric Grid (if rubric loaded) */}
                    {rubricData && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Grid3X3 className="w-3 h-3" />
                          Rubric: {rubricData.title}
                        </div>
                        <div className="overflow-x-auto border rounded">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="border-r px-2 py-1.5 text-left w-28">Criteria</th>
                                {rubricData.criteria[0]?.levels.map((l, i) => (
                                  <th key={i} className="border-r last:border-r-0 px-2 py-1.5 text-center">{l.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rubricData.criteria.map((criterion) => (
                                <tr key={criterion.id}>
                                  <td className="border-r border-t px-2 py-1.5">
                                    <div className="font-medium">{criterion.title}</div>
                                    {criterion.description && <div className="text-muted-foreground mt-0.5">{criterion.description}</div>}
                                  </td>
                                  {criterion.levels.map((level, li) => {
                                    const isSelected = rubricScores[criterion.id]?.levelIndex === li;
                                    return (
                                      <td
                                        key={li}
                                        className={`border-r border-t last:border-r-0 px-2 py-1.5 text-center cursor-pointer transition-colors ${
                                          isSelected ? "bg-blue-100 ring-2 ring-blue-400 ring-inset" : "hover:bg-muted/50"
                                        }`}
                                        onClick={() => selectRubricLevel(criterion.id, li, level.points)}
                                      >
                                        <div className="font-medium">{level.points} pts</div>
                                        {level.description && <div className="text-muted-foreground mt-0.5">{level.description}</div>}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Per-criterion comments */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {rubricData.criteria.map((criterion) => (
                            rubricScores[criterion.id]?.levelIndex >= 0 && (
                              <div key={criterion.id} className="text-xs">
                                <label className="text-muted-foreground">{criterion.title} comment:</label>
                                <input
                                  type="text"
                                  className="w-full border rounded px-2 py-0.5 mt-0.5 text-xs"
                                  placeholder="Optional comment..."
                                  value={rubricScores[criterion.id]?.comment || ""}
                                  onChange={(e) => setRubricComment(criterion.id, e.target.value)}
                                />
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grade + Feedback row */}
                    <div className="flex items-end gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Grade (/{sub.assignment.points})</Label>
                        <Input
                          type="number"
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          min={0}
                          max={sub.assignment.points}
                          className="w-24"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Feedback</Label>
                        <Input
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Optional feedback..."
                        />
                      </div>
                      <Button size="sm" onClick={() => gradeSubmission(sub.id, sub.assignment.points)}>
                        Submit Grade
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setGradingItem(null); setGrade(""); setFeedback(""); setRubricData(null); setRubricScores({}); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => startGrading(sub)}>
                    {sub.assignment.rubricId ? <><Grid3X3 className="w-3 h-3 mr-1" />Grade with Rubric</> : "Grade"}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Assessment Attempts */}
      {activeTab === "assessments" && (
        <div className="space-y-3">
          {attempts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No assessment attempts pending manual grading</p>
            </div>
          ) : (
            attempts.map((attempt) => (
              <div key={attempt.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{attempt.quiz.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {attempt.user.name || attempt.user.email}
                      </span>
                      <span>{attempt.quiz.chapter.title}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(attempt.completedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm">Auto-score: {attempt.score}%</span>
                </div>

                {/* Essay/Short answer questions needing grading */}
                <div className="space-y-2">
                  {attempt.quiz.questions.map((q) => {
                    const answer = attempt.answers[q.id];
                    return (
                      <div key={q.id} className="p-3 bg-muted/50 rounded space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{q.text}</span>
                          <span className="text-muted-foreground">{q.points} pts</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {typeof answer === "string" ? answer : "No response"}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Input
                            type="number"
                            placeholder="Points"
                            min={0}
                            max={q.points}
                            className="w-20 h-7 text-xs"
                            id={`grade-${attempt.id}-${q.id}`}
                          />
                          <span className="text-xs text-muted-foreground">/ {q.points}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    const questionGrades: Record<string, { points: number }> = {};
                    for (const q of attempt.quiz.questions) {
                      const input = document.getElementById(`grade-${attempt.id}-${q.id}`) as HTMLInputElement;
                      if (input?.value) {
                        questionGrades[q.id] = { points: parseFloat(input.value) };
                      }
                    }
                    if (Object.keys(questionGrades).length === 0) {
                      toast.error("Please enter at least one grade");
                      return;
                    }
                    gradeAttempt(attempt.id, attempt.quiz.chapter.id, questionGrades);
                  }}
                >
                  Submit Grades
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
