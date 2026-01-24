import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendQuizResultEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ courseId: string; chapterId: string }>;
}

// Score a single question based on its type
function scoreQuestion(
  question: {
    id: string;
    type: string;
    correctAnswer: number | null;
    correctBoolAnswer: boolean | null;
    acceptedAnswers: unknown;
    multiSelectAnswers: unknown;
    matchingPairs: unknown;
    orderingItems: unknown;
    blanks: unknown;
    points: number;
    partialCreditEnabled: boolean;
  },
  userAnswer: unknown
): { earned: number; needsManualGrading: boolean } {
  if (userAnswer === undefined || userAnswer === null) {
    return { earned: 0, needsManualGrading: false };
  }

  switch (question.type) {
    case "MULTIPLE_CHOICE": {
      const correct = userAnswer === question.correctAnswer;
      return { earned: correct ? question.points : 0, needsManualGrading: false };
    }

    case "TRUE_FALSE": {
      const correct = userAnswer === question.correctBoolAnswer;
      return { earned: correct ? question.points : 0, needsManualGrading: false };
    }

    case "SHORT_ANSWER": {
      const accepted = question.acceptedAnswers as Array<{ text: string; matchMode: string }> | null;
      if (!accepted || !Array.isArray(accepted)) {
        return { earned: 0, needsManualGrading: true };
      }
      const answer = String(userAnswer).trim();
      const isCorrect = accepted.some((a) => {
        switch (a.matchMode) {
          case "exact":
            return answer.toLowerCase() === a.text.toLowerCase();
          case "contains":
            return answer.toLowerCase().includes(a.text.toLowerCase());
          case "regex":
            try {
              return new RegExp(a.text, "i").test(answer);
            } catch {
              return false;
            }
          default:
            return answer.toLowerCase() === a.text.toLowerCase();
        }
      });
      return { earned: isCorrect ? question.points : 0, needsManualGrading: false };
    }

    case "MULTI_SELECT": {
      const correctIndices = question.multiSelectAnswers as number[] | null;
      if (!correctIndices || !Array.isArray(correctIndices)) {
        return { earned: 0, needsManualGrading: false };
      }
      const selected = Array.isArray(userAnswer) ? userAnswer : [];
      const correctSet = new Set(correctIndices);
      const selectedSet = new Set(selected);

      if (question.partialCreditEnabled) {
        const correctSelections = selected.filter((i: number) => correctSet.has(i)).length;
        const incorrectSelections = selected.filter((i: number) => !correctSet.has(i)).length;
        const ratio = Math.max(0, (correctSelections - incorrectSelections) / correctIndices.length);
        return { earned: Math.round(question.points * ratio * 100) / 100, needsManualGrading: false };
      }

      // All-or-nothing: must match exactly
      const allCorrect = correctIndices.length === selected.length &&
        correctIndices.every((i: number) => selectedSet.has(i));
      return { earned: allCorrect ? question.points : 0, needsManualGrading: false };
    }

    case "MATCHING": {
      const pairs = question.matchingPairs as Array<{ left: string; right: string }> | null;
      if (!pairs || !Array.isArray(pairs)) {
        return { earned: 0, needsManualGrading: false };
      }
      const userPairs = userAnswer as Record<string, string>;
      if (typeof userPairs !== "object") {
        return { earned: 0, needsManualGrading: false };
      }
      let correctCount = 0;
      for (const pair of pairs) {
        if (userPairs[pair.left] === pair.right) {
          correctCount++;
        }
      }
      const ratio = correctCount / pairs.length;
      return { earned: Math.round(question.points * ratio * 100) / 100, needsManualGrading: false };
    }

    case "ORDERING": {
      const correctOrder = question.orderingItems as string[] | null;
      if (!correctOrder || !Array.isArray(correctOrder)) {
        return { earned: 0, needsManualGrading: false };
      }
      const userOrder = Array.isArray(userAnswer) ? userAnswer : [];
      let correctPositions = 0;
      for (let i = 0; i < correctOrder.length; i++) {
        if (userOrder[i] === correctOrder[i]) {
          correctPositions++;
        }
      }
      const ratio = correctPositions / correctOrder.length;
      return { earned: Math.round(question.points * ratio * 100) / 100, needsManualGrading: false };
    }

    case "FILL_IN_BLANK": {
      const blanks = question.blanks as Array<{ position: number; acceptedAnswers: string[] }> | null;
      if (!blanks || !Array.isArray(blanks)) {
        return { earned: 0, needsManualGrading: false };
      }
      const userBlanks = userAnswer as Record<string, string>;
      if (typeof userBlanks !== "object") {
        return { earned: 0, needsManualGrading: false };
      }
      let correctBlanks = 0;
      for (const blank of blanks) {
        const userVal = String(userBlanks[blank.position] || "").trim().toLowerCase();
        const isCorrect = blank.acceptedAnswers.some(
          (a) => a.toLowerCase() === userVal
        );
        if (isCorrect) correctBlanks++;
      }
      const ratio = correctBlanks / blanks.length;
      return { earned: Math.round(question.points * ratio * 100) / 100, needsManualGrading: false };
    }

    case "ESSAY": {
      // Essays always need manual grading
      return { earned: 0, needsManualGrading: true };
    }

    default:
      return { earned: 0, needsManualGrading: false };
  }
}

// POST /api/courses/[courseId]/chapters/[chapterId]/quiz/attempt
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { courseId, chapterId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: "You are not enrolled in this course" },
        { status: 403 }
      );
    }

    // Get the quiz with full config
    const quiz = await db.quiz.findUnique({
      where: { chapterId },
    });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    // Check availability window
    const now = new Date();
    if (quiz.availableFrom && now < quiz.availableFrom) {
      return NextResponse.json(
        { message: "This assessment is not yet available" },
        { status: 403 }
      );
    }
    if (quiz.availableUntil && now > quiz.availableUntil) {
      // Check for grace period
      if (!quiz.lateGracePeriod || now > new Date(quiz.availableUntil.getTime() + quiz.lateGracePeriod * 60000)) {
        return NextResponse.json(
          { message: "This assessment is no longer available" },
          { status: 403 }
        );
      }
    }

    // Check attempt limit
    if (quiz.attemptLimit) {
      const previousAttempts = await db.quizAttempt.count({
        where: {
          userId: session.user.id,
          quizId: quiz.id,
        },
      });
      if (previousAttempts >= quiz.attemptLimit) {
        return NextResponse.json(
          { message: `Maximum attempts (${quiz.attemptLimit}) reached` },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { answers, startedAt, honorCodeAccepted, password } = body;

    // Verify password if required
    if (quiz.passwordProtected && password !== quiz.passwordProtected) {
      return NextResponse.json(
        { message: "Incorrect assessment password" },
        { status: 403 }
      );
    }

    // Verify honor code if required
    if (quiz.honorCodeRequired && !honorCodeAccepted) {
      return NextResponse.json(
        { message: "Honor code acknowledgment required" },
        { status: 400 }
      );
    }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { message: "Invalid submission" },
        { status: 400 }
      );
    }

    // Fetch quiz questions for server-side score calculation
    const questions = await db.question.findMany({
      where: { quizId: quiz.id },
      orderBy: { position: "asc" },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { message: "Assessment has no questions" },
        { status: 400 }
      );
    }

    // Calculate score server-side with multi-type support
    let earnedPoints = 0;
    let totalPoints = 0;
    let needsManualGrading = false;

    for (const question of questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      const result = scoreQuestion(question, userAnswer);
      earnedPoints += result.earned;
      if (result.needsManualGrading) {
        needsManualGrading = true;
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = !needsManualGrading && score >= quiz.passingScore;

    // Determine if submission is late
    let isLate = false;
    if (quiz.availableUntil && now > quiz.availableUntil) {
      isLate = true;
    }

    // Calculate time spent
    let timeSpentSeconds: number | null = null;
    if (startedAt) {
      timeSpentSeconds = Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000);
    }

    // Check time limit compliance
    if (quiz.timeLimit && timeSpentSeconds && timeSpentSeconds > (quiz.timeLimit * 60 + (quiz.lateGracePeriod || 0) * 60)) {
      // Over time limit + grace period: mark as late
      isLate = true;
    }

    // Get chapter info for the email
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      select: { title: true },
    });

    // Get IP address from request headers
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                      request.headers.get("x-real-ip") || null;

    // Create quiz attempt with extended fields
    const attempt = await db.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId: quiz.id,
        score,
        passed,
        answers: answers || {},
        startedAt: startedAt ? new Date(startedAt) : null,
        timeSpentSeconds,
        isLate,
        honorCodeAccepted: honorCodeAccepted || false,
        ipAddress,
        earnedPoints: Math.round(earnedPoints * 100) / 100,
        totalPoints,
        needsManualGrading,
      },
    });

    // Send quiz result email (non-blocking, only if auto-gradeable)
    if (session.user.email && !needsManualGrading) {
      sendQuizResultEmail(
        session.user.email,
        session.user.name || "Student",
        chapter?.title || "Assessment",
        score,
        passed,
        courseId,
        chapterId
      ).catch((error) => {
        console.error("Failed to send assessment result email:", error);
      });
    }

    return NextResponse.json({
      ...attempt,
      needsManualGrading,
      message: needsManualGrading
        ? "Submitted. Some questions require manual grading."
        : passed
          ? "Congratulations! You passed."
          : "You did not pass. Please try again.",
    }, { status: 201 });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json(
      { message: "Failed to submit assessment" },
      { status: 500 }
    );
  }
}

// GET /api/courses/[courseId]/chapters/[chapterId]/quiz/attempt
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { courseId, chapterId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: "You are not enrolled in this course" },
        { status: 403 }
      );
    }

    const quiz = await db.quiz.findUnique({
      where: { chapterId },
    });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    // Get user's attempts
    const attempts = await db.quizAttempt.findMany({
      where: {
        userId: session.user.id,
        quizId: quiz.id,
      },
      orderBy: { completedAt: "desc" },
    });

    const bestAttempt = attempts.length > 0
      ? attempts.reduce((best, a) => a.score > best.score ? a : best)
      : null;
    const passedAttempt = attempts.find((a) => a.passed) || null;

    return NextResponse.json({
      attempts: attempts.length,
      attemptLimit: quiz.attemptLimit,
      attemptsRemaining: quiz.attemptLimit ? Math.max(0, quiz.attemptLimit - attempts.length) : null,
      bestAttempt,
      passed: !!passedAttempt,
      allAttempts: attempts,
      assessmentConfig: {
        timeLimit: quiz.timeLimit,
        attemptLimit: quiz.attemptLimit,
        shuffleQuestions: quiz.shuffleQuestions,
        shuffleOptions: quiz.shuffleOptions,
        showAnswersAfter: quiz.showAnswersAfter,
        honorCodeRequired: quiz.honorCodeRequired,
        passwordProtected: !!quiz.passwordProtected,
        isProctored: quiz.isProctored,
        assessmentType: quiz.assessmentType,
        availableFrom: quiz.availableFrom,
        availableUntil: quiz.availableUntil,
      },
    });
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return NextResponse.json(
      { message: "Failed to fetch quiz attempts" },
      { status: 500 }
    );
  }
}
