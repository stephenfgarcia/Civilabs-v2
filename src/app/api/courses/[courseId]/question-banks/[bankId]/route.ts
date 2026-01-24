import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { questionBankSchema, questionSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; bankId: string }>;
}

// GET /api/courses/[courseId]/question-banks/[bankId]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, bankId } = await params;

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

    const bank = await db.questionBank.findUnique({
      where: { id: bankId, courseId },
      include: {
        items: {
          include: {
            question: true,
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!bank) {
      return NextResponse.json({ message: "Question bank not found" }, { status: 404 });
    }

    return NextResponse.json(bank);
  } catch (error) {
    console.error("Error fetching question bank:", error);
    return NextResponse.json(
      { message: "Failed to fetch question bank" },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/question-banks/[bankId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, bankId } = await params;

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

    const body = await req.json();
    const validation = questionBankSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const bank = await db.questionBank.update({
      where: { id: bankId, courseId },
      data: validation.data,
    });

    return NextResponse.json(bank);
  } catch (error) {
    console.error("Error updating question bank:", error);
    return NextResponse.json(
      { message: "Failed to update question bank" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/question-banks/[bankId]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, bankId } = await params;

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

    await db.questionBank.delete({
      where: { id: bankId, courseId },
    });

    return NextResponse.json({ message: "Question bank deleted" });
  } catch (error) {
    console.error("Error deleting question bank:", error);
    return NextResponse.json(
      { message: "Failed to delete question bank" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/question-banks/[bankId] (add question to bank)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, bankId } = await params;

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

    const bank = await db.questionBank.findUnique({
      where: { id: bankId, courseId },
      include: { items: true },
    });

    if (!bank) {
      return NextResponse.json({ message: "Question bank not found" }, { status: 404 });
    }

    const body = await req.json();

    // Can either add existing question by ID or create new
    if (body.questionId) {
      // Link existing question to bank
      const existing = await db.questionBankItem.findUnique({
        where: {
          questionBankId_questionId: {
            questionBankId: bankId,
            questionId: body.questionId,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          { message: "Question already in this bank" },
          { status: 400 }
        );
      }

      const item = await db.questionBankItem.create({
        data: {
          questionBankId: bankId,
          questionId: body.questionId,
          position: bank.items.length,
        },
        include: { question: true },
      });

      return NextResponse.json(item, { status: 201 });
    }

    // Create new question directly in the bank
    const validation = questionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const question = await db.question.create({
      data: {
        text: data.text,
        type: data.type,
        options: data.options ? (data.options as Prisma.InputJsonValue) : undefined,
        correctAnswer: data.correctAnswer ?? undefined,
        points: data.points,
        position: 0,
        quizId: null, // Bank questions don't belong to a specific quiz
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

    const item = await db.questionBankItem.create({
      data: {
        questionBankId: bankId,
        questionId: question.id,
        position: bank.items.length,
      },
      include: { question: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error adding question to bank:", error);
    return NextResponse.json(
      { message: "Failed to add question to bank" },
      { status: 500 }
    );
  }
}
