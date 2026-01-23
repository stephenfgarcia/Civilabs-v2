import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET - Get prerequisites for a course
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;

    const prerequisites = await db.coursePrerequisite.findMany({
      where: { courseId },
      include: {
        prerequisiteCourse: {
          select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json(prerequisites);
  } catch (error) {
    console.error("Error fetching prerequisites:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Set prerequisites for a course (Instructor/Admin only)
const updatePrerequisitesSchema = z.object({
  prerequisiteCourseIds: z.array(z.string()),
});

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    // Check course ownership
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && course.instructorId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = updatePrerequisitesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { prerequisiteCourseIds } = validation.data;

    // Prevent circular prerequisites
    if (prerequisiteCourseIds.includes(courseId)) {
      return NextResponse.json(
        { message: "A course cannot be its own prerequisite" },
        { status: 400 }
      );
    }

    // Delete existing prerequisites and create new ones
    await db.coursePrerequisite.deleteMany({
      where: { courseId },
    });

    if (prerequisiteCourseIds.length > 0) {
      await db.coursePrerequisite.createMany({
        data: prerequisiteCourseIds.map((prerequisiteCourseId) => ({
          courseId,
          prerequisiteCourseId,
        })),
      });
    }

    const updated = await db.coursePrerequisite.findMany({
      where: { courseId },
      include: {
        prerequisiteCourse: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating prerequisites:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
