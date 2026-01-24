import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rubricSchema, rubricCriterionSchema } from "@/lib/validations";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/rubrics
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

    const rubrics = await db.rubric.findMany({
      where: { courseId },
      include: {
        criteria: {
          orderBy: { position: "asc" },
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rubrics);
  } catch (error) {
    console.error("Error fetching rubrics:", error);
    return NextResponse.json(
      { message: "Failed to fetch rubrics" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/rubrics
const createRubricSchema = rubricSchema.extend({
  criteria: z.array(rubricCriterionSchema).min(1, "At least 1 criterion required"),
});

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
    const validation = createRubricSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { title, description, isTemplate, criteria } = validation.data;

    const rubric = await db.rubric.create({
      data: {
        title,
        description,
        isTemplate,
        courseId,
        createdBy: session.user.id,
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

    return NextResponse.json(rubric, { status: 201 });
  } catch (error) {
    console.error("Error creating rubric:", error);
    return NextResponse.json(
      { message: "Failed to create rubric" },
      { status: 500 }
    );
  }
}
