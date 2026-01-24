import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentGradeSchema } from "@/lib/validations";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatcher";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// POST /api/courses/[courseId]/gradebook/grades - Enter/update a student grade
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

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = studentGradeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { gradeItemId, userId, score, overrideScore, overrideReason } = validation.data;

    // Verify grade item belongs to this course
    const item = await db.gradeItem.findUnique({
      where: { id: gradeItemId },
      include: { category: true },
    });

    if (!item || item.category.courseId !== courseId) {
      return NextResponse.json({ message: "Grade item not found in this course" }, { status: 404 });
    }

    // Upsert the grade
    const grade = await db.studentGrade.upsert({
      where: { gradeItemId_userId: { gradeItemId, userId } },
      create: {
        gradeItemId,
        userId,
        score: score ?? undefined,
        overrideScore: overrideScore ?? undefined,
        overrideBy: overrideScore !== undefined ? session.user.id : undefined,
        overrideReason: overrideReason ?? undefined,
        gradedAt: new Date(),
      },
      update: {
        ...(score !== undefined && { score }),
        ...(overrideScore !== undefined && {
          overrideScore,
          overrideBy: session.user.id,
          overrideReason: overrideReason ?? undefined,
        }),
        gradedAt: new Date(),
      },
    });

    dispatchWebhookEvent("GRADE_UPDATED", {
      gradeId: grade.id,
      gradeItemId,
      userId,
      courseId,
      score: grade.score,
      overrideScore: grade.overrideScore,
    });

    return NextResponse.json(grade);
  } catch (error) {
    console.error("Error saving grade:", error);
    return NextResponse.json({ message: "Failed to save grade" }, { status: 500 });
  }
}

// PATCH /api/courses/[courseId]/gradebook/grades - Batch grade entry
export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { grades } = body as { grades: Array<{ gradeItemId: string; userId: string; score: number }> };

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json({ message: "Invalid grades array" }, { status: 400 });
    }

    const results = await Promise.all(
      grades.map((g) =>
        db.studentGrade.upsert({
          where: { gradeItemId_userId: { gradeItemId: g.gradeItemId, userId: g.userId } },
          create: {
            gradeItemId: g.gradeItemId,
            userId: g.userId,
            score: g.score,
            gradedAt: new Date(),
          },
          update: {
            score: g.score,
            gradedAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json({ updated: results.length });
  } catch (error) {
    console.error("Error batch saving grades:", error);
    return NextResponse.json({ message: "Failed to save grades" }, { status: 500 });
  }
}
