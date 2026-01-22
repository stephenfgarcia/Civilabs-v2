import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questionSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; chapterId: string }>;
}

// GET /api/courses/[courseId]/chapters/[chapterId]/quiz/questions
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { chapterId } = await params;

    const quiz = await db.quiz.findUnique({
      where: { chapterId },
      include: {
        questions: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz.questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { message: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/chapters/[chapterId]/quiz/questions
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { courseId, chapterId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Check ownership or admin
    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const quiz = await db.quiz.findUnique({
      where: { chapterId },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = questionSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { text, options, correctAnswer, points } = validatedData.data;

    // Validate correctAnswer is within options range
    if (correctAnswer >= options.length) {
      return NextResponse.json(
        { message: "Correct answer index is out of range" },
        { status: 400 }
      );
    }

    const position = quiz.questions.length;

    const question = await db.question.create({
      data: {
        text,
        options,
        correctAnswer,
        points,
        position,
        quizId: quiz.id,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { message: "Failed to create question" },
      { status: 500 }
    );
  }
}
