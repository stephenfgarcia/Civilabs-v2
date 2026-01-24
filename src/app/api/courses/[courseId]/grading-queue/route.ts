import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/grading-queue
// Returns all assessment attempts and assignment submissions needing grading
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    // Verify instructor/admin access
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, title: true },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // "assessments", "assignments", "all"

    const results: { assessmentAttempts: unknown[]; assignmentSubmissions: unknown[] } = {
      assessmentAttempts: [],
      assignmentSubmissions: [],
    };

    if (type === "all" || type === "assessments") {
      // Get assessment attempts needing manual grading
      const attempts = await db.quizAttempt.findMany({
        where: {
          needsManualGrading: true,
          quiz: {
            chapter: {
              courseId,
            },
          },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          quiz: {
            select: {
              id: true,
              title: true,
              assessmentType: true,
              chapter: {
                select: { id: true, title: true },
              },
              questions: {
                where: {
                  type: { in: ["ESSAY", "SHORT_ANSWER"] },
                },
                select: { id: true, text: true, type: true, points: true },
              },
            },
          },
        },
        orderBy: { completedAt: "asc" },
      });

      results.assessmentAttempts = attempts;
    }

    if (type === "all" || type === "assignments") {
      // Get assignment submissions needing grading
      const submissions = await db.assignmentSubmission.findMany({
        where: {
          status: "SUBMITTED",
          assignment: {
            courseId,
          },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          assignment: {
            select: {
              id: true,
              title: true,
              type: true,
              points: true,
              dueDate: true,
              rubricId: true,
            },
          },
        },
        orderBy: { submittedAt: "asc" },
      });

      results.assignmentSubmissions = submissions;
    }

    const totalPending =
      results.assessmentAttempts.length + results.assignmentSubmissions.length;

    return NextResponse.json({
      ...results,
      totalPending,
      courseTitle: course.title,
    });
  } catch (error) {
    console.error("Error fetching grading queue:", error);
    return NextResponse.json(
      { message: "Failed to fetch grading queue" },
      { status: 500 }
    );
  }
}
