import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { assessmentSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; chapterId: string }>;
}

// GET /api/courses/[courseId]/chapters/[chapterId]/quiz
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { courseId, chapterId } = await params;

    const quiz = await db.quiz.findUnique({
      where: { chapterId },
      include: {
        questions: {
          orderBy: { position: "asc" },
        },
        chapter: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    // Verify the chapter belongs to the course
    if (quiz.chapter.course.id !== courseId) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { message: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/chapters/[chapterId]/quiz
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

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, courseId },
    });

    if (!chapter) {
      return NextResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    // Check if quiz already exists
    const existingQuiz = await db.quiz.findUnique({
      where: { chapterId },
    });

    if (existingQuiz) {
      return NextResponse.json(
        { message: "Quiz already exists for this chapter" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = assessmentSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const {
      title, description, passingScore, assessmentType,
      timeLimit, attemptLimit, availableFrom, availableUntil,
      shuffleQuestions, shuffleOptions, showAnswersAfter,
      isProctored, passwordProtected, ipRestrictions,
      honorCodeRequired, lateGracePeriod, lateSubmissionPolicy,
      latePenaltyPercent, poolSize, questionBankId,
    } = validatedData.data;

    const quiz = await db.quiz.create({
      data: {
        title,
        description,
        passingScore,
        chapterId,
        assessmentType,
        timeLimit: timeLimit ?? null,
        attemptLimit: attemptLimit ?? null,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        shuffleQuestions,
        shuffleOptions,
        showAnswersAfter,
        isProctored,
        passwordProtected: passwordProtected ?? null,
        ipRestrictions: ipRestrictions ?? Prisma.JsonNull,
        honorCodeRequired,
        lateGracePeriod: lateGracePeriod ?? null,
        lateSubmissionPolicy,
        latePenaltyPercent,
        poolSize: poolSize ?? null,
        questionBankId: questionBankId ?? null,
      } as Prisma.QuizUncheckedCreateInput,
      include: {
        questions: true,
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { message: "Failed to create quiz" },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/chapters/[chapterId]/quiz
export async function PATCH(request: Request, { params }: RouteParams) {
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
    });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = assessmentSchema.partial().safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const data = validatedData.data;

    const updateData: Prisma.QuizUncheckedUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.passingScore !== undefined) updateData.passingScore = data.passingScore;
    if (data.assessmentType !== undefined) updateData.assessmentType = data.assessmentType;
    if (data.timeLimit !== undefined) updateData.timeLimit = data.timeLimit ?? null;
    if (data.attemptLimit !== undefined) updateData.attemptLimit = data.attemptLimit ?? null;
    if (data.availableFrom !== undefined) updateData.availableFrom = data.availableFrom ? new Date(data.availableFrom) : null;
    if (data.availableUntil !== undefined) updateData.availableUntil = data.availableUntil ? new Date(data.availableUntil) : null;
    if (data.shuffleQuestions !== undefined) updateData.shuffleQuestions = data.shuffleQuestions;
    if (data.shuffleOptions !== undefined) updateData.shuffleOptions = data.shuffleOptions;
    if (data.showAnswersAfter !== undefined) updateData.showAnswersAfter = data.showAnswersAfter;
    if (data.isProctored !== undefined) updateData.isProctored = data.isProctored;
    if (data.passwordProtected !== undefined) updateData.passwordProtected = data.passwordProtected ?? null;
    if (data.ipRestrictions !== undefined) updateData.ipRestrictions = data.ipRestrictions ?? Prisma.JsonNull;
    if (data.honorCodeRequired !== undefined) updateData.honorCodeRequired = data.honorCodeRequired;
    if (data.lateGracePeriod !== undefined) updateData.lateGracePeriod = data.lateGracePeriod ?? null;
    if (data.lateSubmissionPolicy !== undefined) updateData.lateSubmissionPolicy = data.lateSubmissionPolicy;
    if (data.latePenaltyPercent !== undefined) updateData.latePenaltyPercent = data.latePenaltyPercent;
    if (data.poolSize !== undefined) updateData.poolSize = data.poolSize ?? null;
    if (data.questionBankId !== undefined) updateData.questionBankId = data.questionBankId ?? null;

    const updatedQuiz = await db.quiz.update({
      where: { id: quiz.id },
      data: updateData,
      include: {
        questions: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { message: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/chapters/[chapterId]/quiz
export async function DELETE(request: Request, { params }: RouteParams) {
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
    });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    await db.quiz.delete({
      where: { id: quiz.id },
    });

    return NextResponse.json({ message: "Quiz deleted" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { message: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
