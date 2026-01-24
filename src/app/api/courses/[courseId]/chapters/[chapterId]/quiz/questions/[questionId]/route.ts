import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { questionSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; chapterId: string; questionId: string }>;
}

// GET /api/courses/[courseId]/chapters/[chapterId]/quiz/questions/[questionId]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { questionId } = await params;

    const question = await db.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { message: "Failed to fetch question" },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/chapters/[chapterId]/quiz/questions/[questionId]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { courseId, questionId } = await params;

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

    const question = await db.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = questionSchema.partial().safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { text, options, correctAnswer, points } = validatedData.data;

    // If options are provided, validate correctAnswer
    if (options && correctAnswer != null && correctAnswer >= options.length) {
      return NextResponse.json(
        { message: "Correct answer index is out of range" },
        { status: 400 }
      );
    }

    const updateData: Prisma.QuestionUncheckedUpdateInput = {};
    if (text !== undefined) updateData.text = text;
    if (options !== undefined) updateData.options = options ?? Prisma.JsonNull;
    if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer ?? undefined;
    if (points !== undefined) updateData.points = points;

    const updatedQuestion = await db.question.update({
      where: { id: questionId },
      data: updateData,
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { message: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/chapters/[chapterId]/quiz/questions/[questionId]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { courseId, questionId } = await params;

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

    const question = await db.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    await db.question.delete({
      where: { id: questionId },
    });

    // Reorder remaining questions
    const remainingQuestions = await db.question.findMany({
      where: { quizId: question.quizId },
      orderBy: { position: "asc" },
    });

    for (let i = 0; i < remainingQuestions.length; i++) {
      if (remainingQuestions[i].position !== i) {
        await db.question.update({
          where: { id: remainingQuestions[i].id },
          data: { position: i },
        });
      }
    }

    return NextResponse.json({ message: "Question deleted" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { message: "Failed to delete question" },
      { status: 500 }
    );
  }
}
