import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gradeCategorySchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; categoryId: string }>;
}

// PATCH /api/courses/[courseId]/gradebook/categories/[categoryId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, categoryId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = gradeCategorySchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const category = await db.gradeCategory.update({
      where: { id: categoryId },
      data: validation.data,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating grade category:", error);
    return NextResponse.json({ message: "Failed to update grade category" }, { status: 500 });
  }
}

// DELETE /api/courses/[courseId]/gradebook/categories/[categoryId]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, categoryId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.gradeCategory.delete({ where: { id: categoryId } });

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Error deleting grade category:", error);
    return NextResponse.json({ message: "Failed to delete grade category" }, { status: 500 });
  }
}
