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

    // Enroll in all courses in the learning path (respecting prerequisites)
    const courseEnrollments = [];
    const skippedCourses = [];

    for (const pathCourse of learningPath.courses) {
      if (!pathCourse.course.isPublished) continue;

      const existingEnrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: pathCourse.courseId,
          },
        },
      });

      if (existingEnrollment) continue;

      // Check prerequisites for this course
      const prerequisites = await db.coursePrerequisite.findMany({
        where: { courseId: pathCourse.courseId },
        select: { prerequisiteCourseId: true },
      });

      if (prerequisites.length > 0) {
        const completedPrereqs = await db.enrollment.findMany({
          where: {
            userId: session.user.id,
            courseId: { in: prerequisites.map((p) => p.prerequisiteCourseId) },
            completedAt: { not: null },
          },
          select: { courseId: true },
        });

        const completedIds = new Set(completedPrereqs.map((c) => c.courseId));
        const unmet = prerequisites.filter(
          (p) => !completedIds.has(p.prerequisiteCourseId)
        );

        if (unmet.length > 0) {
          skippedCourses.push(pathCourse.courseId);
          continue;
        }
      }

      const courseEnrollment = await db.enrollment.create({
        data: {
          userId: session.user.id,
          courseId: pathCourse.courseId,
        },
      });
      courseEnrollments.push(courseEnrollment);
    }

    return NextResponse.json(
      {
        enrollment,
        courseEnrollments,
        skippedCourses,
        message: `Enrolled in learning path and ${courseEnrollments.length} courses${skippedCourses.length > 0 ? ` (${skippedCourses.length} skipped due to unmet prerequisites)` : ""}`,
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
