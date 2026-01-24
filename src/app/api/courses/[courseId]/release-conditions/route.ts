import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { releaseConditionSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/release-conditions
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

    const conditions = await db.releaseCondition.findMany({
      where: { courseId },
      orderBy: [{ targetType: "asc" }, { targetId: "asc" }, { position: "asc" }],
    });

    return NextResponse.json(conditions);
  } catch (error) {
    console.error("Error fetching release conditions:", error);
    return NextResponse.json({ message: "Failed to fetch release conditions" }, { status: 500 });
  }
}

// POST /api/courses/[courseId]/release-conditions
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
    const validation = releaseConditionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existing = await db.releaseCondition.findMany({
      where: { courseId, targetType: data.targetType, targetId: data.targetId },
    });

    const condition = await db.releaseCondition.create({
      data: {
        targetType: data.targetType,
        targetId: data.targetId,
        courseId,
        conditionType: data.conditionType,
        conditionValue: data.conditionValue as Prisma.InputJsonValue,
        operator: data.operator,
        position: data.position ?? existing.length,
      },
    });

    return NextResponse.json(condition, { status: 201 });
  } catch (error) {
    console.error("Error creating release condition:", error);
    return NextResponse.json({ message: "Failed to create release condition" }, { status: 500 });
  }
}

// DELETE /api/courses/[courseId]/release-conditions?id=xxx
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;
    const { searchParams } = new URL(req.url);
    const conditionId = searchParams.get("id");

    if (!conditionId) {
      return NextResponse.json({ message: "Condition ID required" }, { status: 400 });
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.releaseCondition.delete({ where: { id: conditionId } });

    return NextResponse.json({ message: "Condition deleted" });
  } catch (error) {
    console.error("Error deleting release condition:", error);
    return NextResponse.json({ message: "Failed to delete release condition" }, { status: 500 });
  }
}
