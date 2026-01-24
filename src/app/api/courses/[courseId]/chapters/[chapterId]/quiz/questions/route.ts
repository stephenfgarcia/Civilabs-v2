import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
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

    const data = validatedData.data;
    const position = quiz.questions.length;

    // Type-specific validation
    switch (data.type) {
      case "MULTIPLE_CHOICE":
        if (!data.options || data.options.length < 2) {
          return NextResponse.json(
            { message: "Multiple choice requires at least 2 options" },
            { status: 400 }
          );
        }
        if (data.correctAnswer === null || data.correctAnswer === undefined || data.correctAnswer >= data.options.length) {
          return NextResponse.json(
            { message: "Correct answer index is out of range" },
            { status: 400 }
          );
        }
        break;

      case "MULTI_SELECT":
        if (!data.options || data.options.length < 2) {
          return NextResponse.json(
            { message: "Multi-select requires at least 2 options" },
            { status: 400 }
          );
        }
        if (!data.multiSelectAnswers || data.multiSelectAnswers.length === 0) {
          return NextResponse.json(
            { message: "Multi-select requires at least 1 correct answer" },
            { status: 400 }
          );
        }
        break;

      case "TRUE_FALSE":
        if (data.correctBoolAnswer === null || data.correctBoolAnswer === undefined) {
          return NextResponse.json(
            { message: "True/False requires a correct answer (true or false)" },
            { status: 400 }
          );
        }
        break;

      case "MATCHING":
        if (!data.matchingPairs || data.matchingPairs.length < 2) {
          return NextResponse.json(
            { message: "Matching requires at least 2 pairs" },
            { status: 400 }
          );
        }
        break;

      case "ORDERING":
        if (!data.orderingItems || data.orderingItems.length < 2) {
          return NextResponse.json(
            { message: "Ordering requires at least 2 items" },
            { status: 400 }
          );
        }
        break;

      case "FILL_IN_BLANK":
        if (!data.blanks || data.blanks.length < 1) {
          return NextResponse.json(
            { message: "Fill-in-the-blank requires at least 1 blank" },
            { status: 400 }
          );
        }
        break;

      case "SHORT_ANSWER":
        if (!data.acceptedAnswers || data.acceptedAnswers.length < 1) {
          return NextResponse.json(
            { message: "Short answer requires at least 1 accepted answer" },
            { status: 400 }
          );
        }
        break;

      case "ESSAY":
        // No specific validation needed for essay
        break;
    }

    const question = await db.question.create({
      data: {
        text: data.text,
        type: data.type,
        options: data.options ? (data.options as Prisma.InputJsonValue) : undefined,
        correctAnswer: data.correctAnswer ?? undefined,
        points: data.points,
        position,
        quizId: quiz.id,
        explanation: data.explanation ?? undefined,
        acceptedAnswers: data.acceptedAnswers ? (data.acceptedAnswers as Prisma.InputJsonValue) : undefined,
        matchingPairs: data.matchingPairs ? (data.matchingPairs as Prisma.InputJsonValue) : undefined,
        orderingItems: data.orderingItems ? (data.orderingItems as Prisma.InputJsonValue) : undefined,
        correctBoolAnswer: data.correctBoolAnswer ?? undefined,
        blanks: data.blanks ? (data.blanks as Prisma.InputJsonValue) : undefined,
        multiSelectAnswers: data.multiSelectAnswers ? (data.multiSelectAnswers as Prisma.InputJsonValue) : undefined,
        partialCreditEnabled: data.partialCreditEnabled,
        essayWordLimit: data.essayWordLimit ?? undefined,
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
