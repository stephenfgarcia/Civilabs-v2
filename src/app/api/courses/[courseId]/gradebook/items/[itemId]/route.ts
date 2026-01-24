import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gradeItemSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; itemId: string }>;
}

// PATCH /api/courses/[courseId]/gradebook/items/[itemId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, itemId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = gradeItemSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const item = await db.gradeItem.update({
      where: { id: itemId },
      data: {
        ...(validation.data.title !== undefined && { title: validation.data.title }),
        ...(validation.data.points !== undefined && { points: validation.data.points }),
        ...(validation.data.isExtraCredit !== undefined && { isExtraCredit: validation.data.isExtraCredit }),
        ...(validation.data.isVisible !== undefined && { isVisible: validation.data.isVisible }),
        ...(validation.data.dueDate !== undefined && { dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : null }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating grade item:", error);
    return NextResponse.json({ message: "Failed to update grade item" }, { status: 500 });
  }
}

// DELETE /api/courses/[courseId]/gradebook/items/[itemId]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, itemId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.gradeItem.delete({ where: { id: itemId } });

    return NextResponse.json({ message: "Grade item deleted" });
  } catch (error) {
    console.error("Error deleting grade item:", error);
    return NextResponse.json({ message: "Failed to delete grade item" }, { status: 500 });
  }
}
