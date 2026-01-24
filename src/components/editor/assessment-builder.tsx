"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus, Trash2, GripVertical, Settings2, Clock,
  Shield, Lock, CheckCircle, XCircle,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: string;
  options: string[] | null;
  correctAnswer: number | null;
  correctBoolAnswer: boolean | null;
  acceptedAnswers: Array<{ text: string; matchMode: string }> | null;
  multiSelectAnswers: number[] | null;
  matchingPairs: Array<{ left: string; right: string }> | null;
  orderingItems: string[] | null;
  blanks: Array<{ position: number; acceptedAnswers: string[] }> | null;
  points: number;
  position: number;
  explanation: string | null;
  partialCreditEnabled: boolean;
  essayWordLimit: number | null;
}

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  passingScore: number;
  assessmentType: string;
  timeLimit: number | null;
  attemptLimit: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfter: string | null;
  honorCodeRequired: boolean;
  passwordProtected: string | null;
  isProctored: boolean;
  questions: Question[];
}

interface Props {
  courseId: string;
  chapterId: string;
}

const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "MULTI_SELECT", label: "Select All That Apply" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "MATCHING", label: "Matching" },
  { value: "ORDERING", label: "Ordering" },
  { value: "FILL_IN_BLANK", label: "Fill in the Blank" },
  { value: "ESSAY", label: "Essay" },
];

export function AssessmentBuilder({ courseId, chapterId }: Props) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Assessment form state
  const [title, setTitle] = useState("Chapter Assessment");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [assessmentType, setAssessmentType] = useState("QUIZ");
  const [timeLimit, setTimeLimit] = useState<string>("");
  const [attemptLimit, setAttemptLimit] = useState<string>("");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [honorCodeRequired, setHonorCodeRequired] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState("");

  // New question form state
  const [questionType, setQuestionType] = useState("MULTIPLE_CHOICE");
  const [questionText, setQuestionText] = useState("");
  const [questionPoints, setQuestionPoints] = useState(1);
  const [questionExplanation, setQuestionExplanation] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [correctBoolAnswer, setCorrectBoolAnswer] = useState(true);
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<number[]>([]);
  const [acceptedAnswers, setAcceptedAnswers] = useState<Array<{ text: string; matchMode: string }>>([{ text: "", matchMode: "exact" }]);
  const [matchingPairs, setMatchingPairs] = useState<Array<{ left: string; right: string }>>([{ left: "", right: "" }, { left: "", right: "" }]);
  const [orderingItems, setOrderingItems] = useState<string[]>(["", ""]);
  const [essayWordLimit, setEssayWordLimit] = useState<string>("");

  const apiBase = `/api/courses/${courseId}/chapters/${chapterId}/quiz`;

  useEffect(() => {
    fetchAssessment();
  }, []);

  async function fetchAssessment() {
    try {
      const res = await fetch(apiBase);
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setPassingScore(data.passingScore);
        setAssessmentType(data.assessmentType);
        setTimeLimit(data.timeLimit?.toString() || "");
        setAttemptLimit(data.attemptLimit?.toString() || "");
        setShuffleQuestions(data.shuffleQuestions);
        setShuffleOptions(data.shuffleOptions);
        setHonorCodeRequired(data.honorCodeRequired);
        setPasswordProtected(data.passwordProtected || "");
      }
    } catch {
      console.error("Error fetching assessment");
    } finally {
      setLoading(false);
    }
  }

  async function createAssessment() {
    setCreating(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          passingScore,
          assessmentType,
          timeLimit: timeLimit ? parseInt(timeLimit) : null,
          attemptLimit: attemptLimit ? parseInt(attemptLimit) : null,
          shuffleQuestions,
          shuffleOptions,
          honorCodeRequired,
          passwordProtected: passwordProtected || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
        toast.success("Assessment created");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create assessment");
      }
    } catch {
      toast.error("Error creating assessment");
    } finally {
      setCreating(false);
    }
  }

  async function updateSettings() {
    try {
      const res = await fetch(apiBase, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          passingScore,
          assessmentType,
          timeLimit: timeLimit ? parseInt(timeLimit) : null,
          attemptLimit: attemptLimit ? parseInt(attemptLimit) : null,
          shuffleQuestions,
          shuffleOptions,
          honorCodeRequired,
          passwordProtected: passwordProtected || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
        toast.success("Settings updated");
        setShowSettings(false);
      } else {
        toast.error("Failed to update settings");
      }
    } catch {
      toast.error("Error updating settings");
    }
  }

  async function deleteAssessment() {
    try {
      const res = await fetch(apiBase, { method: "DELETE" });
      if (res.ok) {
        setAssessment(null);
        toast.success("Assessment deleted");
      }
    } catch {
      toast.error("Error deleting assessment");
    }
  }

  async function addQuestion() {
    const questionData: Record<string, unknown> = {
      text: questionText,
      type: questionType,
      points: questionPoints,
      explanation: questionExplanation || null,
    };

    switch (questionType) {
      case "MULTIPLE_CHOICE":
        questionData.options = options.filter((o) => o.trim());
        questionData.correctAnswer = correctAnswer;
        break;
      case "TRUE_FALSE":
        questionData.correctBoolAnswer = correctBoolAnswer;
        break;
      case "MULTI_SELECT":
        questionData.options = options.filter((o) => o.trim());
        questionData.multiSelectAnswers = multiSelectAnswers;
        break;
      case "SHORT_ANSWER":
        questionData.acceptedAnswers = acceptedAnswers.filter((a) => a.text.trim());
        break;
      case "MATCHING":
        questionData.matchingPairs = matchingPairs.filter((p) => p.left.trim() && p.right.trim());
        break;
      case "ORDERING":
        questionData.orderingItems = orderingItems.filter((i) => i.trim());
        break;
      case "ESSAY":
        questionData.essayWordLimit = essayWordLimit ? parseInt(essayWordLimit) : null;
        break;
    }

    try {
      const res = await fetch(`${apiBase}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });
      if (res.ok) {
        toast.success("Question added");
        fetchAssessment();
        resetQuestionForm();
        setShowAddQuestion(false);
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to add question");
      }
    } catch {
      toast.error("Error adding question");
    }
  }

  async function deleteQuestion(questionId: string) {
    try {
      const res = await fetch(`${apiBase}/questions/${questionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAssessment();
        toast.success("Question deleted");
      }
    } catch {
      toast.error("Error deleting question");
    }
  }

  function resetQuestionForm() {
    setQuestionType("MULTIPLE_CHOICE");
    setQuestionText("");
    setQuestionPoints(1);
    setQuestionExplanation("");
    setOptions(["", ""]);
    setCorrectAnswer(0);
    setCorrectBoolAnswer(true);
    setMultiSelectAnswers([]);
    setAcceptedAnswers([{ text: "", matchMode: "exact" }]);
    setMatchingPairs([{ left: "", right: "" }, { left: "", right: "" }]);
    setOrderingItems(["", ""]);
    setEssayWordLimit("");
  }

  function getQuestionTypeLabel(type: string) {
    return QUESTION_TYPES.find((t) => t.value === type)?.label || type;
  }

  function getQuestionPreview(q: Question): string {
    switch (q.type) {
      case "MULTIPLE_CHOICE":
        return `${q.options?.length || 0} options, correct: ${(q.options?.[q.correctAnswer || 0]) || "?"}`;
      case "TRUE_FALSE":
        return `Answer: ${q.correctBoolAnswer ? "True" : "False"}`;
      case "MULTI_SELECT":
        return `${q.options?.length || 0} options, ${q.multiSelectAnswers?.length || 0} correct`;
      case "SHORT_ANSWER":
        return `${q.acceptedAnswers?.length || 0} accepted answers`;
      case "MATCHING":
        return `${q.matchingPairs?.length || 0} pairs`;
      case "ORDERING":
        return `${q.orderingItems?.length || 0} items`;
      case "ESSAY":
        return q.essayWordLimit ? `Max ${q.essayWordLimit} words` : "No word limit";
      case "FILL_IN_BLANK":
        return `${q.blanks?.length || 0} blanks`;
      default:
        return "";
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading assessment...</div>;
  }

  // No assessment yet - show create form
  if (!assessment) {
    return (
      <div className="border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-lg">Chapter Assessment</h3>
        <p className="text-sm text-muted-foreground">
          Create an assessment for this chapter. Supports quizzes, exams, and practice tests.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={assessmentType} onValueChange={setAssessmentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="QUIZ">Quiz (Practice)</SelectItem>
                <SelectItem value="EXAM">Exam (High-Stakes)</SelectItem>
                <SelectItem value="PRACTICE">Practice (No Grade)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Passing Score (%)</Label>
            <Input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} min={0} max={100} />
          </div>
          <div className="space-y-2">
            <Label>Time Limit (minutes)</Label>
            <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="No limit" />
          </div>
        </div>

        <Button onClick={createAssessment} disabled={creating || !title.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          {creating ? "Creating..." : "Create Assessment"}
        </Button>
      </div>
    );
  }

  // Assessment exists - show questions and management
  const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{assessment.title}</h3>
          <p className="text-sm text-muted-foreground">
            {assessment.assessmentType} &middot; {assessment.questions.length} questions &middot; {totalPoints} points &middot; Pass: {assessment.passingScore}%
            {assessment.timeLimit && ` · ${assessment.timeLimit} min`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="w-4 h-4 mr-1" />
            Settings
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the assessment and all attempts. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAssessment}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Config Badges */}
      <div className="flex flex-wrap gap-2">
        {assessment.timeLimit && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            <Clock className="w-3 h-3" /> {assessment.timeLimit} min
          </span>
        )}
        {assessment.honorCodeRequired && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
            <Shield className="w-3 h-3" /> Honor Code
          </span>
        )}
        {assessment.passwordProtected && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
            <Lock className="w-3 h-3" /> Password
          </span>
        )}
        {assessment.shuffleQuestions && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            Shuffled
          </span>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
          <h4 className="font-medium">Assessment Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={assessmentType} onValueChange={setAssessmentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="PRACTICE">Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Passing Score (%)</Label>
              <Input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Time Limit (min)</Label>
              <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="No limit" />
            </div>
            <div className="space-y-2">
              <Label>Attempt Limit</Label>
              <Input type="number" value={attemptLimit} onChange={(e) => setAttemptLimit(e.target.value)} placeholder="Unlimited" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input value={passwordProtected} onChange={(e) => setPasswordProtected(e.target.value)} placeholder="No password" />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} />
              <Label>Shuffle Questions</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={shuffleOptions} onCheckedChange={setShuffleOptions} />
              <Label>Shuffle Options</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={honorCodeRequired} onCheckedChange={setHonorCodeRequired} />
              <Label>Honor Code</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={updateSettings}>Save Settings</Button>
            <Button size="sm" variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-2">
        {assessment.questions.map((q, index) => (
          <div key={q.id} className="flex items-start gap-3 p-3 border rounded-lg bg-background">
            <GripVertical className="w-4 h-4 mt-1 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Q{index + 1}.</span>
                <span className="text-sm text-muted-foreground px-1.5 py-0.5 bg-muted rounded text-xs">
                  {getQuestionTypeLabel(q.type)}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
              </div>
              <p className="text-sm mt-1 truncate">{q.text}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{getQuestionPreview(q)}</p>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => deleteQuestion(q.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Question */}
      {!showAddQuestion ? (
        <Button variant="outline" onClick={() => setShowAddQuestion(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      ) : (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">New Question</h4>
            <Button variant="ghost" size="sm" onClick={() => { setShowAddQuestion(false); resetQuestionForm(); }}>
              Cancel
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Question Type</Label>
              <Select value={questionType} onValueChange={(v) => { setQuestionType(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Points</Label>
              <Input type="number" value={questionPoints} onChange={(e) => setQuestionPoints(Number(e.target.value))} min={1} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Question Text</Label>
            <textarea
              className="w-full min-h-[80px] p-3 border rounded-md text-sm resize-y"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question..."
            />
          </div>

          {/* Type-specific inputs */}
          {(questionType === "MULTIPLE_CHOICE" || questionType === "MULTI_SELECT") && (
            <div className="space-y-2">
              <Label>Options</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  {questionType === "MULTIPLE_CHOICE" ? (
                    <button
                      type="button"
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${correctAnswer === i ? "border-green-500 bg-green-50" : "border-gray-300"}`}
                      onClick={() => setCorrectAnswer(i)}
                    >
                      {correctAnswer === i && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${multiSelectAnswers.includes(i) ? "border-green-500 bg-green-50" : "border-gray-300"}`}
                      onClick={() => {
                        setMultiSelectAnswers((prev) =>
                          prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                        );
                      }}
                    >
                      {multiSelectAnswers.includes(i) && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </button>
                  )}
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const updated = [...options];
                      updated[i] = e.target.value;
                      setOptions(updated);
                    }}
                    placeholder={`Option ${i + 1}`}
                  />
                  {options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setOptions([...options, ""])}>
                <Plus className="w-3 h-3 mr-1" /> Add Option
              </Button>
            </div>
          )}

          {questionType === "TRUE_FALSE" && (
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <div className="flex gap-4">
                <Button variant={correctBoolAnswer ? "default" : "outline"} size="sm" onClick={() => setCorrectBoolAnswer(true)}>True</Button>
                <Button variant={!correctBoolAnswer ? "default" : "outline"} size="sm" onClick={() => setCorrectBoolAnswer(false)}>False</Button>
              </div>
            </div>
          )}

          {questionType === "SHORT_ANSWER" && (
            <div className="space-y-2">
              <Label>Accepted Answers</Label>
              {acceptedAnswers.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={a.text}
                    onChange={(e) => {
                      const updated = [...acceptedAnswers];
                      updated[i] = { ...updated[i], text: e.target.value };
                      setAcceptedAnswers(updated);
                    }}
                    placeholder="Accepted answer"
                  />
                  <Select
                    value={a.matchMode}
                    onValueChange={(v) => {
                      const updated = [...acceptedAnswers];
                      updated[i] = { ...updated[i], matchMode: v };
                      setAcceptedAnswers(updated);
                    }}
                  >
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exact">Exact</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="regex">Regex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setAcceptedAnswers([...acceptedAnswers, { text: "", matchMode: "exact" }])}>
                <Plus className="w-3 h-3 mr-1" /> Add Answer
              </Button>
            </div>
          )}

          {questionType === "MATCHING" && (
            <div className="space-y-2">
              <Label>Matching Pairs</Label>
              {matchingPairs.map((pair, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={pair.left} onChange={(e) => { const u = [...matchingPairs]; u[i] = { ...u[i], left: e.target.value }; setMatchingPairs(u); }} placeholder="Left item" />
                  <span className="text-muted-foreground">↔</span>
                  <Input value={pair.right} onChange={(e) => { const u = [...matchingPairs]; u[i] = { ...u[i], right: e.target.value }; setMatchingPairs(u); }} placeholder="Right item" />
                  {matchingPairs.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => setMatchingPairs(matchingPairs.filter((_, j) => j !== i))}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setMatchingPairs([...matchingPairs, { left: "", right: "" }])}>
                <Plus className="w-3 h-3 mr-1" /> Add Pair
              </Button>
            </div>
          )}

          {questionType === "ORDERING" && (
            <div className="space-y-2">
              <Label>Items (in correct order)</Label>
              {orderingItems.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
                  <Input value={item} onChange={(e) => { const u = [...orderingItems]; u[i] = e.target.value; setOrderingItems(u); }} placeholder={`Item ${i + 1}`} />
                  {orderingItems.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => setOrderingItems(orderingItems.filter((_, j) => j !== i))}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setOrderingItems([...orderingItems, ""])}>
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
            </div>
          )}

          {questionType === "ESSAY" && (
            <div className="space-y-2">
              <Label>Word Limit (optional)</Label>
              <Input type="number" value={essayWordLimit} onChange={(e) => setEssayWordLimit(e.target.value)} placeholder="No limit" />
              <p className="text-xs text-muted-foreground">Essay responses require manual grading</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Explanation (shown after answer)</Label>
            <Input value={questionExplanation} onChange={(e) => setQuestionExplanation(e.target.value)} placeholder="Optional explanation..." />
          </div>

          <Button onClick={addQuestion} disabled={!questionText.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      )}
    </div>
  );
}
