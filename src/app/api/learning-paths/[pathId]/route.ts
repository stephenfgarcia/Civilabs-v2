import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ pathId: string }>;
}

// GET - Get a single learning path
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { pathId } = await params;
    const session = await auth();

    const learningPath = await db.learningPath.findUnique({
      where: { id: pathId },
      include: {
        courses: {
          orderBy: { position: "asc" },
          include: {
            course: {
              include: {
                instructor: {
                  select: { id: true, name: true, image: true },
                },
                _count: {
                  select: {
                    chapters: true,
                    enrollments: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!learningPath) {
      return NextResponse.json(
        { message: "Learning path not found" },
        { status: 404 }
      );
    }

    // Check if unpublished and user is not admin
    if (!learningPath.isPublished && session?.user) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (user?.role !== "ADMIN") {
        return NextResponse.json(
          { message: "Learning path not found" },
          { status: 404 }
        );
      }
    } else if (!learningPath.isPublished) {
      return NextResponse.json(
        { message: "Learning path not found" },
        { status: 404 }
      );
    }

    // If user is authenticated, include progress info
    if (session?.user) {
      const enrollment = await db.learningPathEnrollment.findUnique({
        where: {
          userId_learningPathId: {
            userId: session.user.id,
            learningPathId: pathId,
          },
        },
      });

      // Get user's course enrollments
      const courseIds = learningPath.courses.map((c) => c.courseId);
      const courseEnrollments = await db.enrollment.findMany({
        where: {
          userId: session.user.id,
          courseId: { in: courseIds },
        },
      });

      const courseEnrollmentMap = new Map(
        courseEnrollments.map((e) => [e.courseId, e])
      );

      return NextResponse.json({
        ...learningPath,
        enrollment,
        courses: learningPath.courses.map((c) => ({
          ...c,
          courseEnrollment: courseEnrollmentMap.get(c.courseId) || null,
        })),
      });
    }

    return NextResponse.json(learningPath);
  } catch (error) {
    console.error("Error fetching learning path:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a learning path (Admin only)
const updatePathSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional().nullable(),
  isPublished: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { pathId } = await params;

    const body = await req.json();
    const validation = updatePathSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const updated = await db.learningPath.update({
      where: { id: pathId },
      data: validation.data,
      include: {
        courses: {
          include: { course: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating learning path:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a learning path (Admin only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { pathId } = await params;

    await db.learningPath.delete({
      where: { id: pathId },
    });

    return NextResponse.json({ message: "Learning path deleted" });
  } catch (error) {
    console.error("Error deleting learning path:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
