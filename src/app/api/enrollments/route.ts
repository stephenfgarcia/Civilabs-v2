import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEnrollmentEmail } from "@/lib/email";

// GET /api/enrollments - Get user's enrollments
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const enrollments = await db.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                name: true,
                image: true,
              },
            },
            chapters: {
              where: { isPublished: true },
              include: {
                lessons: {
                  select: { id: true },
                },
              },
            },
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const lessonIds = enrollment.course.chapters.flatMap((chapter) =>
          chapter.lessons.map((lesson) => lesson.id)
        );

        const completedCount = await db.userProgress.count({
          where: {
            userId: session.user.id,
            lessonId: { in: lessonIds },
            isCompleted: true,
          },
        });

        const totalLessons = lessonIds.length;
        const progressPercentage =
          totalLessons > 0
            ? Math.round((completedCount / totalLessons) * 100)
            : 0;

        return {
          ...enrollment,
          progress: {
            completed: completedCount,
            total: totalLessons,
            percentage: progressPercentage,
          },
        };
      })
    );

    return NextResponse.json(enrollmentsWithProgress);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { message: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

// POST /api/enrollments - Enroll in a course
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { message: "Course ID is required" },
        { status: 400 }
      );
    }

    // Check if course exists and is published
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        isPublished: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { message: "Already enrolled in this course" },
        { status: 400 }
      );
    }

    // Check prerequisites
    const prerequisites = await db.coursePrerequisite.findMany({
      where: { courseId },
      include: {
        prerequisiteCourse: {
          select: { id: true, title: true },
        },
      },
    });

    if (prerequisites.length > 0) {
      const completedCourses = await db.enrollment.findMany({
        where: {
          userId: session.user.id,
          courseId: { in: prerequisites.map((p) => p.prerequisiteCourseId) },
          completedAt: { not: null },
        },
        select: { courseId: true },
      });

      const completedIds = new Set(completedCourses.map((c) => c.courseId));
      const unmet = prerequisites.filter(
        (p) => !completedIds.has(p.prerequisiteCourseId)
      );

      if (unmet.length > 0) {
        return NextResponse.json(
          {
            message: "Prerequisites not met",
            unmetPrerequisites: unmet.map((p) => ({
              id: p.prerequisiteCourse.id,
              title: p.prerequisiteCourse.title,
            })),
          },
          { status: 400 }
        );
      }
    }

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        userId: session.user.id,
        courseId,
      },
    });

    // Send enrollment confirmation email (non-blocking)
    if (session.user.email) {
      sendEnrollmentEmail(
        session.user.email,
        session.user.name || "Student",
        course.title,
        course.id
      ).catch((error) => {
        console.error("Failed to send enrollment email:", error);
      });
    }

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json(
      { message: "Failed to enroll" },
      { status: 500 }
    );
  }
}
