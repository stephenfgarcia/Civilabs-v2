"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FileText, MessageSquare, CheckCircle, Clock, User,
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

      const res = await fetch(
        `/api/courses/${courseId}/assignments/${submission.assignment.id}/submissions/${submissionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grade: gradeNum,
            feedback: feedback || undefined,
          }),
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
                  <div className="flex items-end gap-3 pt-2 border-t">
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
                    <Button size="sm" variant="outline" onClick={() => { setGradingItem(null); setGrade(""); setFeedback(""); }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setGradingItem(sub.id)}>
                    Grade
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
