import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ pathId: string }>;
}

// POST - Enroll in a learning path
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { pathId } = await params;

    // Check if learning path exists and is published
    const learningPath = await db.learningPath.findUnique({
      where: { id: pathId },
      include: {
        courses: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!learningPath) {
      return NextResponse.json(
        { message: "Learning path not found" },
        { status: 404 }
      );
    }

    if (!learningPath.isPublished) {
      return NextResponse.json(
        { message: "Learning path is not available" },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existing = await db.learningPathEnrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId: session.user.id,
          learningPathId: pathId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Already enrolled in this learning path" },
        { status: 400 }
      );
    }

    // Create learning path enrollment
    const enrollment = await db.learningPathEnrollment.create({
      data: {
        userId: session.user.id,
        learningPathId: pathId,
      },
    });

    // Enroll in all courses in the learning path
    const courseEnrollments = [];
    for (const pathCourse of learningPath.courses) {
      const existingEnrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: pathCourse.courseId,
          },
        },
      });

      if (!existingEnrollment && pathCourse.course.isPublished) {
        const courseEnrollment = await db.enrollment.create({
          data: {
            userId: session.user.id,
            courseId: pathCourse.courseId,
          },
        });
        courseEnrollments.push(courseEnrollment);
      }
    }

    return NextResponse.json(
      {
        enrollment,
        courseEnrollments,
        message: `Enrolled in learning path and ${courseEnrollments.length} courses`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error enrolling in learning path:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
