import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gradeCategorySchema, gradeItemSchema, gradingScaleSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/gradebook - Full gradebook matrix
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

    const isInstructor = course.instructorId === session.user.id || session.user.role === "ADMIN";

    // Students can only see their own grades
    const categories = await db.gradeCategory.findMany({
      where: { courseId },
      orderBy: { position: "asc" },
      include: {
        gradeItems: {
          where: isInstructor ? {} : { isVisible: true },
          orderBy: { createdAt: "asc" },
          include: {
            studentGrades: isInstructor
              ? { include: { user: { select: { id: true, name: true, email: true, image: true } } } }
              : { where: { userId: session.user.id } },
          },
        },
      },
    });

    // Get enrolled students for the matrix (instructor only)
    let students: { id: string; name: string | null; email: string; image: string | null }[] = [];
    if (isInstructor) {
      const enrollments = await db.enrollment.findMany({
        where: { courseId },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      });
      students = enrollments.map((e) => e.user);
    }

    // Get grading scale
    const scale = await db.gradingScale.findFirst({
      where: { OR: [{ courseId }, { courseId: null, isDefault: true }] },
      orderBy: { courseId: "desc" }, // Prefer course-specific over global
    });

    return NextResponse.json({ categories, students, gradingScale: scale });
  } catch (error) {
    console.error("Error fetching gradebook:", error);
    return NextResponse.json({ message: "Failed to fetch gradebook" }, { status: 500 });
  }
}

// POST /api/courses/[courseId]/gradebook - Create grade category
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
    const validation = gradeCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const existing = await db.gradeCategory.findMany({ where: { courseId } });
    const position = validation.data.position ?? existing.length;

    const category = await db.gradeCategory.create({
      data: {
        name: validation.data.name,
        weight: validation.data.weight,
        courseId,
        position,
        dropLowest: validation.data.dropLowest,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating grade category:", error);
    return NextResponse.json({ message: "Failed to create grade category" }, { status: 500 });
  }
}
