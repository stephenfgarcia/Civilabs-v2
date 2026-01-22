"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  GripVertical,
  CheckCircle,
  Circle,
  Loader2,
  HelpCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  points: number;
  position: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passingScore: number;
  questions: Question[];
}

interface QuizBuilderProps {
  courseId: string;
  chapterId: string;
  quiz: Quiz | null;
}

export function QuizBuilder({ courseId, chapterId, quiz }: QuizBuilderProps) {
  const router = useRouter();
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Quiz settings state
  const [quizTitle, setQuizTitle] = useState(quiz?.title || "Chapter Quiz");
  const [quizDescription, setQuizDescription] = useState(quiz?.description || "");
  const [passingScore, setPassingScore] = useState(quiz?.passingScore || 70);

  // Question creation state
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 1,
  });

  const handleCreateQuiz = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: quizTitle,
            description: quizDescription || undefined,
            passingScore,
          }),
        }
      );

      if (response.ok) {
        setIsCreatingQuiz(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create quiz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuiz = async () => {
    if (!quiz) return;
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/quiz`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: quizTitle,
            description: quizDescription || undefined,
            passingScore,
          }),
        }
      );

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update quiz:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) return;
    if (!confirm("Are you sure you want to delete this quiz? All questions will be lost.")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/quiz`,
        { method: "DELETE" }
      );

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete quiz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!quiz) return;
    if (!newQuestion.text.trim()) return;

    const validOptions = newQuestion.options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      alert("Please add at least 2 options");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/quiz/questions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: newQuestion.text,
            options: validOptions,
            correctAnswer: newQuestion.correctAnswer,
            points: newQuestion.points,
          }),
        }
      );

      if (response.ok) {
        setNewQuestion({
          text: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
          points: 1,
        });
        setIsAddingQuestion(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to add question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/quiz/questions/${questionId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  // No quiz exists - show create form
  if (!quiz) {
    if (isCreatingQuiz) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="quizTitle">Quiz Title</Label>
            <Input
              id="quizTitle"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Enter quiz title..."
              className="focus-glow"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quizDescription">Description (Optional)</Label>
            <Textarea
              id="quizDescription"
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              placeholder="Brief description of this quiz..."
              rows={2}
              className="focus-glow resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passingScore">Passing Score (%)</Label>
            <Input
              id="passingScore"
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              className="focus-glow w-24"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateQuiz} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Quiz
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsCreatingQuiz(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <p className="text-muted-foreground mb-4">No quiz for this chapter</p>
        <Button onClick={() => setIsCreatingQuiz(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>
    );
  }

  // Quiz exists - show quiz editor
  return (
    <div className="space-y-6">
      {/* Quiz Settings */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Quiz Settings</CardTitle>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteQuiz}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Quiz
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="editQuizTitle">Quiz Title</Label>
              <Input
                id="editQuizTitle"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="focus-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPassingScore">Passing Score (%)</Label>
              <Input
                id="editPassingScore"
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="focus-glow w-24"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editQuizDescription">Description</Label>
            <Textarea
              id="editQuizDescription"
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              rows={2}
              className="focus-glow resize-none"
            />
          </div>
          <Button onClick={handleUpdateQuiz} disabled={isSaving} size="sm">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle>Questions ({quiz.questions.length})</CardTitle>
          </div>
          <CardDescription>
            Total points:{" "}
            {quiz.questions.reduce((acc, q) => acc + q.points, 0)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.questions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No questions yet</p>
              <p className="text-sm">Add your first question below</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quiz.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border rounded-lg p-4 bg-card cascade-item"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-primary">
                          Q{index + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {question.points} point{question.points !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="font-medium mb-3">{question.text}</p>
                      <div className="space-y-1">
                        {(question.options as string[]).map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 text-sm p-2 rounded ${
                              optIndex === question.correctAnswer
                                ? "bg-green-500/10 text-green-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {optIndex === question.correctAnswer ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Question Form */}
          {isAddingQuestion ? (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <Textarea
                  value={newQuestion.text}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, text: e.target.value })
                  }
                  placeholder="Enter your question..."
                  rows={2}
                  className="focus-glow resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Answer Options (select the correct one)</Label>
                <div className="space-y-2">
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setNewQuestion({ ...newQuestion, correctAnswer: index })
                        }
                        className={`p-1 rounded transition-colors ${
                          newQuestion.correctAnswer === index
                            ? "text-green-600"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {newQuestion.correctAnswer === index ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="focus-glow"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click the circle to mark the correct answer
                </p>
              </div>

              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  min={1}
                  value={newQuestion.points}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, points: Number(e.target.value) })
                  }
                  className="focus-glow w-24"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddQuestion} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Question
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsAddingQuestion(false);
                    setNewQuestion({
                      text: "",
                      options: ["", "", "", ""],
                      correctAnswer: 0,
                      points: 1,
                    });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAddingQuestion(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
