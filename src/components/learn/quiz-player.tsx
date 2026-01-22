"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Question {
  id: string;
  text: string;
  options: unknown;
  correctAnswer: number;
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passingScore: number;
  questions: Question[];
}

interface QuizPlayerProps {
  courseId: string;
  chapterId: string;
  quiz: Quiz;
  onComplete: () => void;
  onBack: () => void;
}

interface QuizResult {
  score: number;
  passed: boolean;
  totalPoints: number;
  earnedPoints: number;
}

export function QuizPlayer({
  courseId,
  chapterId,
  quiz,
  onComplete,
  onBack,
}: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, number>>(
    new Map()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const options = (currentQuestion?.options as string[]) || [];
  const totalQuestions = quiz.questions.length;
  const answeredQuestions = selectedAnswers.size;

  const handleSelectAnswer = (optionIndex: number) => {
    if (result) return; // Don't allow changes after submission

    const newAnswers = new Map(selectedAnswers);
    newAnswers.set(currentQuestion.id, optionIndex);
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (answeredQuestions < totalQuestions) {
      if (
        !confirm(
          `You haven't answered all questions. Submit anyway? (${answeredQuestions}/${totalQuestions} answered)`
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Calculate score
      let earnedPoints = 0;
      const totalPoints = quiz.questions.reduce((acc, q) => acc + q.points, 0);

      const answers: Record<string, number> = {};
      quiz.questions.forEach((question) => {
        const selectedAnswer = selectedAnswers.get(question.id);
        answers[question.id] = selectedAnswer ?? -1;

        if (selectedAnswer === question.correctAnswer) {
          earnedPoints += question.points;
        }
      });

      const score = Math.round((earnedPoints / totalPoints) * 100);
      const passed = score >= quiz.passingScore;

      // Submit to API
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/quiz/attempt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId: quiz.id,
            answers,
            score,
            passed,
          }),
        }
      );

      if (response.ok) {
        setResult({ score, passed, totalPoints, earnedPoints });
        setShowAnswers(true);
      }
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers(new Map());
    setResult(null);
    setShowAnswers(false);
    setCurrentQuestionIndex(0);
  };

  // Result Screen
  if (result) {
    return (
      <Card className="animate-scale-in">
        <CardContent className="pt-6 text-center">
          <div
            className={`inline-flex p-4 rounded-full mb-4 ${
              result.passed ? "bg-green-500/10" : "bg-destructive/10"
            }`}
          >
            {result.passed ? (
              <Trophy className="h-12 w-12 text-green-500" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive" />
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {result.passed ? "Congratulations!" : "Keep Trying!"}
          </h2>

          <p className="text-muted-foreground mb-6">
            {result.passed
              ? "You've passed this quiz!"
              : `You need ${quiz.passingScore}% to pass. Keep learning and try again!`}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold text-primary">{result.score}%</p>
              <p className="text-sm text-muted-foreground">Your Score</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold">
                {result.earnedPoints}/{result.totalPoints}
              </p>
              <p className="text-sm text-muted-foreground">Points Earned</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            {!result.passed && (
              <Button onClick={handleRetry} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button onClick={onComplete}>
              {result.passed ? "Continue" : "Back to Lesson"}
            </Button>
          </div>

          {/* Show Answers Review */}
          {showAnswers && (
            <div className="mt-8 text-left space-y-4">
              <h3 className="font-semibold">Answer Review</h3>
              {quiz.questions.map((question, index) => {
                const selectedAnswer = selectedAnswers.get(question.id);
                const isCorrect = selectedAnswer === question.correctAnswer;
                const questionOptions = question.options as string[];

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border ${
                      isCorrect
                        ? "border-green-500/50 bg-green-500/5"
                        : "border-destructive/50 bg-destructive/5"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">
                          Q{index + 1}: {question.text}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your answer:{" "}
                          {selectedAnswer !== undefined
                            ? questionOptions[selectedAnswer]
                            : "Not answered"}
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-green-600 mt-1">
                            Correct answer: {questionOptions[question.correctAnswer]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Quiz Interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lesson
        </Button>
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{
            width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
          }}
        />
      </div>

      {/* Question Card */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestionIndex + 1}. {currentQuestion.text}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {currentQuestion.points} point{currentQuestion.points !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {options.map((option, index) => {
            const isSelected = selectedAnswers.get(currentQuestion.id) === index;

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-input hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    {isSelected && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          {answeredQuestions}/{totalQuestions} answered
        </div>

        {currentQuestionIndex < totalQuestions - 1 ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-hover-lift"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Quiz
          </Button>
        )}
      </div>

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2 justify-center pt-4 border-t">
        {quiz.questions.map((question, index) => {
          const isAnswered = selectedAnswers.has(question.id);
          const isCurrent = index === currentQuestionIndex;

          return (
            <button
              key={question.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isAnswered
                  ? "bg-green-500/20 text-green-600 hover:bg-green-500/30"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
