"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock, Trophy, XCircle, ChevronLeft, ChevronRight,
  CheckCircle, AlertTriangle, Shield, Lock,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: string;
  options: string[] | null;
  points: number;
  matchingPairs: Array<{ left: string; right: string }> | null;
  orderingItems: string[] | null;
  blanks: Array<{ position: number; acceptedAnswers: string[] }> | null;
  essayWordLimit: number | null;
  explanation: string | null;
}

interface AssessmentConfig {
  timeLimit: number | null;
  attemptLimit: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: string | null;
  honorCodeRequired: boolean;
  passwordProtected: boolean;
  assessmentType: string;
}

interface Props {
  courseId: string;
  chapterId: string;
  assessmentTitle: string;
  passingScore: number;
  onComplete?: () => void;
}

export function AssessmentPlayer({ courseId, chapterId, assessmentTitle, passingScore, onComplete }: Props) {
  const [phase, setPhase] = useState<"loading" | "pre-start" | "password" | "honor-code" | "active" | "result">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<{ score: number; passed: boolean; earnedPoints: number; totalPoints: number; needsManualGrading: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const apiBase = `/api/courses/${courseId}/chapters/${chapterId}/quiz`;

  useEffect(() => {
    loadAttemptInfo();
  }, []);

  async function loadAttemptInfo() {
    try {
      const res = await fetch(`${apiBase}/attempt`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data.assessmentConfig);
        setAttemptsRemaining(data.attemptsRemaining);

        if (data.attemptsRemaining === 0) {
          setResult({
            score: data.bestAttempt?.score || 0,
            passed: data.passed,
            earnedPoints: data.bestAttempt?.earnedPoints || 0,
            totalPoints: data.bestAttempt?.totalPoints || 0,
            needsManualGrading: false,
          });
          setPhase("result");
          return;
        }
      }
    } catch {
      console.error("Error loading attempt info");
    }
    setPhase("pre-start");
  }

  async function loadQuestions() {
    try {
      const res = await fetch(`${apiBase}/questions`);
      if (res.ok) {
        let qs = await res.json();
        if (config?.shuffleQuestions) {
          qs = shuffleArray(qs);
        }
        if (config?.shuffleOptions) {
          qs = qs.map((q: Question) => {
            if (q.options && (q.type === "MULTIPLE_CHOICE" || q.type === "MULTI_SELECT")) {
              return { ...q, options: shuffleArray([...q.options]) };
            }
            return q;
          });
        }
        setQuestions(qs);
      }
    } catch {
      console.error("Error loading questions");
    }
  }

  function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async function startAssessment() {
    if (config?.passwordProtected) {
      setPhase("password");
      return;
    }
    if (config?.honorCodeRequired) {
      setPhase("honor-code");
      return;
    }
    await beginAttempt();
  }

  async function beginAttempt() {
    await loadQuestions();
    setStartedAt(new Date().toISOString());
    if (config?.timeLimit) {
      setTimeRemaining(config.timeLimit * 60);
    }
    setPhase("active");
  }

  // Timer
  useEffect(() => {
    if (phase !== "active" || timeRemaining === null) return;
    if (timeRemaining <= 0) {
      submitAssessment();
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, timeRemaining]);

  const submitAssessment = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          startedAt,
          honorCodeAccepted: true,
          password: password || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({
          score: data.score,
          passed: data.passed,
          earnedPoints: data.earnedPoints || 0,
          totalPoints: data.totalPoints || 0,
          needsManualGrading: data.needsManualGrading,
        });
        setPhase("result");
        onComplete?.();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to submit");
      }
    } catch {
      alert("Error submitting assessment");
    } finally {
      setSubmitting(false);
    }
  }, [answers, startedAt, password, submitting]);

  function setAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // Pre-start screen
  if (phase === "loading") {
    return <div className="p-4 text-sm text-muted-foreground">Loading...</div>;
  }

  if (phase === "pre-start") {
    return (
      <div className="border rounded-lg p-6 space-y-4 text-center">
        <h3 className="font-semibold text-lg">{assessmentTitle}</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          {config?.timeLimit && <p><Clock className="w-4 h-4 inline mr-1" />Time Limit: {config.timeLimit} minutes</p>}
          {config?.attemptLimit && <p>Attempts: {attemptsRemaining !== null ? `${attemptsRemaining} remaining` : `${config.attemptLimit} allowed`}</p>}
          <p>Passing Score: {passingScore}%</p>
          {config?.honorCodeRequired && <p><Shield className="w-4 h-4 inline mr-1" />Honor code required</p>}
          {config?.passwordProtected && <p><Lock className="w-4 h-4 inline mr-1" />Password required</p>}
        </div>
        <Button onClick={startAssessment} size="lg">
          Start Assessment
        </Button>
      </div>
    );
  }

  if (phase === "password") {
    return (
      <div className="border rounded-lg p-6 space-y-4 max-w-sm mx-auto">
        <h3 className="font-semibold text-lg text-center">Enter Password</h3>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Assessment password"
        />
        <Button onClick={() => {
          if (config?.honorCodeRequired) {
            setPhase("honor-code");
          } else {
            beginAttempt();
          }
        }} disabled={!password.trim()} className="w-full">
          Continue
        </Button>
      </div>
    );
  }

  if (phase === "honor-code") {
    return (
      <div className="border rounded-lg p-6 space-y-4 max-w-md mx-auto">
        <h3 className="font-semibold text-lg text-center">Academic Integrity Agreement</h3>
        <div className="text-sm text-muted-foreground space-y-2 p-4 bg-muted/50 rounded-lg">
          <p>By proceeding, I acknowledge that:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>This work is entirely my own</li>
            <li>I will not use unauthorized materials or assistance</li>
            <li>I understand that violations may result in academic penalties</li>
          </ul>
        </div>
        <Button onClick={beginAttempt} className="w-full">
          <Shield className="w-4 h-4 mr-2" />
          I Agree - Begin Assessment
        </Button>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="border rounded-lg p-6 space-y-4 text-center">
        {result.needsManualGrading ? (
          <>
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="font-semibold text-lg">Submitted for Review</h3>
            <p className="text-sm text-muted-foreground">
              Some questions require manual grading. Your instructor will review your responses.
            </p>
            <p className="text-sm">Auto-graded score so far: <span className="font-bold">{result.score}%</span></p>
          </>
        ) : result.passed ? (
          <>
            <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="font-semibold text-lg text-green-600">Congratulations! You Passed!</h3>
            <p className="text-3xl font-bold">{result.score}%</p>
            <p className="text-sm text-muted-foreground">
              {result.earnedPoints}/{result.totalPoints} points
            </p>
          </>
        ) : (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="font-semibold text-lg text-red-600">Not Passed</h3>
            <p className="text-3xl font-bold">{result.score}%</p>
            <p className="text-sm text-muted-foreground">
              Required: {passingScore}% &middot; {result.earnedPoints}/{result.totalPoints} points
            </p>
            {attemptsRemaining !== 0 && (
              <Button onClick={() => { setPhase("pre-start"); setAnswers({}); setResult(null); }}>
                Try Again
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  // Active assessment
  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== null).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="border rounded-lg p-6 space-y-4">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {questions.length}
        </span>
        {timeRemaining !== null && (
          <span className={`text-sm font-mono font-bold ${timeRemaining < 60 ? "text-red-600" : ""}`}>
            <Clock className="w-4 h-4 inline mr-1" />
            {formatTime(timeRemaining)}
          </span>
        )}
      </div>

      <Progress value={progress} className="h-2" />

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-1">
        {questions.map((q, i) => (
          <button
            key={q.id}
            className={`w-8 h-8 text-xs rounded border ${
              i === currentIndex
                ? "border-primary bg-primary text-primary-foreground"
                : answers[q.id] !== undefined
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-300"
            }`}
            onClick={() => setCurrentIndex(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <p className="font-medium">{currentQ.text}</p>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">{currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}</span>
        </div>

        {/* Answer input based on type */}
        {currentQ.type === "MULTIPLE_CHOICE" && currentQ.options && (
          <div className="space-y-2">
            {currentQ.options.map((opt, i) => (
              <button
                key={i}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  answers[currentQ.id] === i
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                onClick={() => setAnswer(currentQ.id, i)}
              >
                <span className="text-sm">{opt}</span>
              </button>
            ))}
          </div>
        )}

        {currentQ.type === "TRUE_FALSE" && (
          <div className="flex gap-4">
            <Button
              variant={answers[currentQ.id] === true ? "default" : "outline"}
              className="flex-1"
              onClick={() => setAnswer(currentQ.id, true)}
            >
              True
            </Button>
            <Button
              variant={answers[currentQ.id] === false ? "default" : "outline"}
              className="flex-1"
              onClick={() => setAnswer(currentQ.id, false)}
            >
              False
            </Button>
          </div>
        )}

        {currentQ.type === "MULTI_SELECT" && currentQ.options && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Select all that apply</p>
            {currentQ.options.map((opt, i) => {
              const selected = Array.isArray(answers[currentQ.id]) && (answers[currentQ.id] as number[]).includes(i);
              return (
                <button
                  key={i}
                  className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-2 ${
                    selected ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-400"
                  }`}
                  onClick={() => {
                    const current = (answers[currentQ.id] as number[]) || [];
                    setAnswer(currentQ.id, selected ? current.filter((x) => x !== i) : [...current, i]);
                  }}
                >
                  <div className={`w-4 h-4 rounded border ${selected ? "bg-primary border-primary" : "border-gray-400"}`}>
                    {selected && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {currentQ.type === "SHORT_ANSWER" && (
          <Input
            value={(answers[currentQ.id] as string) || ""}
            onChange={(e) => setAnswer(currentQ.id, e.target.value)}
            placeholder="Type your answer..."
          />
        )}

        {currentQ.type === "MATCHING" && currentQ.matchingPairs && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Match each item on the left with its pair on the right</p>
            {currentQ.matchingPairs.map((pair) => {
              const currentAnswers = (answers[currentQ.id] as Record<string, string>) || {};
              const shuffledRights = currentQ.matchingPairs!.map((p) => p.right);
              return (
                <div key={pair.left} className="flex items-center gap-2">
                  <span className="text-sm flex-1 p-2 bg-muted rounded">{pair.left}</span>
                  <span className="text-muted-foreground">→</span>
                  <select
                    className="flex-1 p-2 border rounded text-sm"
                    value={currentAnswers[pair.left] || ""}
                    onChange={(e) => setAnswer(currentQ.id, { ...currentAnswers, [pair.left]: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {shuffledRights.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {currentQ.type === "ORDERING" && currentQ.orderingItems && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Drag items into the correct order (use buttons to reorder)</p>
            {(() => {
              const currentOrder = (answers[currentQ.id] as string[]) || [...currentQ.orderingItems!].sort(() => Math.random() - 0.5);
              if (!answers[currentQ.id]) {
                setAnswer(currentQ.id, currentOrder);
              }
              return currentOrder.map((item, i) => (
                <div key={`${item}-${i}`} className="flex items-center gap-2 p-2 border rounded">
                  <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
                  <span className="text-sm flex-1">{item}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0}
                      onClick={() => {
                        const newOrder = [...currentOrder];
                        [newOrder[i - 1], newOrder[i]] = [newOrder[i], newOrder[i - 1]];
                        setAnswer(currentQ.id, newOrder);
                      }}>↑</Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === currentOrder.length - 1}
                      onClick={() => {
                        const newOrder = [...currentOrder];
                        [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
                        setAnswer(currentQ.id, newOrder);
                      }}>↓</Button>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {currentQ.type === "ESSAY" && (
          <div className="space-y-2">
            <textarea
              className="w-full min-h-[200px] p-3 border rounded-md text-sm resize-y"
              value={(answers[currentQ.id] as string) || ""}
              onChange={(e) => setAnswer(currentQ.id, e.target.value)}
              placeholder="Write your response..."
            />
            {currentQ.essayWordLimit && (
              <p className="text-xs text-muted-foreground">
                Word count: {((answers[currentQ.id] as string) || "").split(/\s+/).filter(Boolean).length} / {currentQ.essayWordLimit}
              </p>
            )}
          </div>
        )}

        {currentQ.type === "FILL_IN_BLANK" && currentQ.blanks && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Fill in each blank</p>
            {currentQ.blanks.map((blank) => {
              const currentBlanks = (answers[currentQ.id] as Record<string, string>) || {};
              return (
                <div key={blank.position} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Blank {blank.position + 1}:</span>
                  <Input
                    value={currentBlanks[blank.position] || ""}
                    onChange={(e) => setAnswer(currentQ.id, { ...currentBlanks, [blank.position]: e.target.value })}
                    placeholder="Your answer"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>

        {currentIndex === questions.length - 1 ? (
          <Button onClick={() => setShowSubmitConfirm(true)} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Assessment"}
          </Button>
        ) : (
          <Button onClick={() => setCurrentIndex(currentIndex + 1)}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Submit confirmation */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < questions.length
                ? `You have answered ${answeredCount} of ${questions.length} questions. Unanswered questions will be scored as 0.`
                : "All questions answered. Ready to submit?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={submitAssessment}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
