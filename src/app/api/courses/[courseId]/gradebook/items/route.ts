import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gradeItemSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// POST /api/courses/[courseId]/gradebook/items - Create grade item
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
    const validation = gradeItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify category belongs to this course
    const category = await db.gradeCategory.findUnique({
      where: { id: validation.data.categoryId },
    });

    if (!category || category.courseId !== courseId) {
      return NextResponse.json({ message: "Category not found in this course" }, { status: 404 });
    }

    const item = await db.gradeItem.create({
      data: {
        categoryId: validation.data.categoryId,
        title: validation.data.title,
        points: validation.data.points,
        type: validation.data.type,
        referenceId: validation.data.referenceId ?? undefined,
        isExtraCredit: validation.data.isExtraCredit,
        isVisible: validation.data.isVisible,
        dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : undefined,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating grade item:", error);
    return NextResponse.json({ message: "Failed to create grade item" }, { status: 500 });
  }
}
