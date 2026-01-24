import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rubricSchema, rubricCriterionSchema } from "@/lib/validations";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ courseId: string; rubricId: string }>;
}

// GET /api/courses/[courseId]/rubrics/[rubricId]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, rubricId } = await params;

    const rubric = await db.rubric.findUnique({
      where: { id: rubricId, courseId },
      include: {
        criteria: {
          orderBy: { position: "asc" },
        },
        assignments: {
          select: { id: true, title: true },
        },
      },
    });

    if (!rubric) {
      return NextResponse.json({ message: "Rubric not found" }, { status: 404 });
    }

    return NextResponse.json(rubric);
  } catch (error) {
    console.error("Error fetching rubric:", error);
    return NextResponse.json(
      { message: "Failed to fetch rubric" },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[courseId]/rubrics/[rubricId]
const updateRubricSchema = rubricSchema.extend({
  criteria: z.array(rubricCriterionSchema).min(1, "At least 1 criterion required"),
});

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, rubricId } = await params;

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

    const existing = await db.rubric.findUnique({
      where: { id: rubricId, courseId },
    });

    if (!existing) {
      return NextResponse.json({ message: "Rubric not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = updateRubricSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { title, description, isTemplate, criteria } = validation.data;

    // Replace all criteria (delete existing, create new)
    await db.rubricCriterion.deleteMany({
      where: { rubricId },
    });

    const rubric = await db.rubric.update({
      where: { id: rubricId },
      data: {
        title,
        description,
        isTemplate,
        criteria: {
          create: criteria.map((c, index) => ({
            title: c.title,
            description: c.description,
            maxPoints: c.maxPoints,
            levels: c.levels,
            position: index,
          })),
        },
      },
      include: {
        criteria: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json(rubric);
  } catch (error) {
    console.error("Error updating rubric:", error);
    return NextResponse.json(
      { message: "Failed to update rubric" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/rubrics/[rubricId]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, rubricId } = await params;

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

    await db.rubric.delete({
      where: { id: rubricId, courseId },
    });

    return NextResponse.json({ message: "Rubric deleted" });
  } catch (error) {
    console.error("Error deleting rubric:", error);
    return NextResponse.json(
      { message: "Failed to delete rubric" },
      { status: 500 }
    );
  }
}
