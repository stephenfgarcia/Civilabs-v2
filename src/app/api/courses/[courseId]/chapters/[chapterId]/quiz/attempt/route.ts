import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendQuizResultEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ courseId: string; chapterId: string }>;
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

    // Get the quiz
    const quiz = await db.quiz.findUnique({
      where: { chapterId },
    });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    const body = await request.json();
    const { answers, score, passed } = body;

    if (typeof score !== "number" || typeof passed !== "boolean") {
      return NextResponse.json(
        { message: "Invalid quiz submission" },
        { status: 400 }
      );
    }

    // Get chapter info for the email
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      select: { title: true },
    });

    // Create quiz attempt
    const attempt = await db.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId: quiz.id,
        score,
        passed,
        answers: answers || {},
      },
    });

    // Send quiz result email (non-blocking)
    if (session.user.email) {
      sendQuizResultEmail(
        session.user.email,
        session.user.name || "Student",
        chapter?.title || "Quiz",
        score,
        passed,
        courseId,
        chapterId
      ).catch((error) => {
        console.error("Failed to send quiz result email:", error);
      });
    }

    return NextResponse.json(attempt, { status: 201 });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { message: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}

// GET /api/courses/[courseId]/chapters/[chapterId]/quiz/attempt
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { chapterId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const quiz = await db.quiz.findUnique({
      where: { chapterId },
    });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    // Get user's best attempt
    const attempts = await db.quizAttempt.findMany({
      where: {
        userId: session.user.id,
        quizId: quiz.id,
      },
      orderBy: { score: "desc" },
    });

    const bestAttempt = attempts[0] || null;
    const passedAttempt = attempts.find((a) => a.passed) || null;

    return NextResponse.json({
      attempts: attempts.length,
      bestAttempt,
      passed: !!passedAttempt,
    });
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return NextResponse.json(
      { message: "Failed to fetch quiz attempts" },
      { status: 500 }
    );
  }
}
