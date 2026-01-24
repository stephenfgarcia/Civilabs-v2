import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ courseId: string; chapterId: string; attemptId: string }>;
}

// PATCH /api/courses/[courseId]/chapters/[chapterId]/quiz/attempt/[attemptId]
// Manual grading for essay/short-answer questions
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, attemptId } = await params;

    // Verify instructor/admin access
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ message: "Attempt not found" }, { status: 404 });
    }

    const body = await req.json();
    const { questionGrades } = body;

    // questionGrades: { [questionId]: { points: number, feedback?: string } }
    if (!questionGrades || typeof questionGrades !== "object") {
      return NextResponse.json(
        { message: "questionGrades object required" },
        { status: 400 }
      );
    }

    // Recalculate total score with manual grades
    let earnedPoints = 0;
    let totalPoints = 0;

    for (const question of attempt.quiz.questions) {
      totalPoints += question.points;
      const manualGrade = questionGrades[question.id];

      if (manualGrade && typeof manualGrade.points === "number") {
        // Use manual grade for this question
        earnedPoints += Math.min(manualGrade.points, question.points);
      } else if (question.type !== "ESSAY") {
        // Use auto-graded score from the original answers
        const answers = attempt.answers as Record<string, unknown>;
        const userAnswer = answers[question.id];
        if (question.type === "MULTIPLE_CHOICE" && userAnswer === question.correctAnswer) {
          earnedPoints += question.points;
        } else if (question.type === "TRUE_FALSE" && userAnswer === question.correctBoolAnswer) {
          earnedPoints += question.points;
        }
        // For other auto-gradeable types, keep the original earned points ratio
        // This is a simplified approach; the original attempt already has the auto-scored portion
      }
    }

    // Use the attempt's existing auto-graded earnedPoints for non-manually-graded questions
    // and add the manually graded points
    const autoGradedPoints = attempt.earnedPoints || 0;
    const manualQuestionIds = Object.keys(questionGrades);
    let manualTotal = 0;
    for (const qId of manualQuestionIds) {
      manualTotal += Math.min(
        questionGrades[qId].points || 0,
        attempt.quiz.questions.find((q) => q.id === qId)?.points || 0
      );
    }

    // Calculate: auto-graded portion stays, manual portion replaces 0s for essays
    const finalEarned = autoGradedPoints + manualTotal;
    const score = totalPoints > 0 ? Math.round((finalEarned / totalPoints) * 100) : 0;
    const passed = score >= attempt.quiz.passingScore;

    const updatedAttempt = await db.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        passed,
        earnedPoints: finalEarned,
        needsManualGrading: false,
        manualGradedAt: new Date(),
        manualGradedBy: session.user.id,
      },
    });

    return NextResponse.json(updatedAttempt);
  } catch (error) {
    console.error("Error grading attempt:", error);
    return NextResponse.json(
      { message: "Failed to grade attempt" },
      { status: 500 }
    );
  }
}
