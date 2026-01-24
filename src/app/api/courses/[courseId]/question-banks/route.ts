import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questionBankSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/question-banks
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

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

    const banks = await db.questionBank.findMany({
      where: { courseId },
      include: {
        _count: {
          select: { items: true, quizzes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(banks);
  } catch (error) {
    console.error("Error fetching question banks:", error);
    return NextResponse.json(
      { message: "Failed to fetch question banks" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/question-banks
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

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
    const validation = questionBankSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { title, description } = validation.data;

    const bank = await db.questionBank.create({
      data: {
        title,
        description,
        courseId,
      },
    });

    return NextResponse.json(bank, { status: 201 });
  } catch (error) {
    console.error("Error creating question bank:", error);
    return NextResponse.json(
      { message: "Failed to create question bank" },
      { status: 500 }
    );
  }
}
