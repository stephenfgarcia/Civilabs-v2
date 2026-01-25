import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { gradeSubmissionSchema } from "@/lib/validations";
import { syncGradeToGradebook } from "@/lib/grade-sync";
import { notifyAssignmentGraded } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ courseId: string; assignmentId: string; submissionId: string }>;
}

// GET /api/courses/.../submissions/[submissionId]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, submissionId } = await params;

    const submission = await db.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignment: {
          include: {
            rubric: {
              include: {
                criteria: {
                  orderBy: { position: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    // Check access: student can only see own, instructor can see all in their course
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    const isInstructor = course?.instructorId === session.user.id || session.user.role === "ADMIN";

    if (!isInstructor && submission.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { message: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/.../submissions/[submissionId] - Grade a submission
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, assignmentId, submissionId } = await params;

    // Verify instructor/admin access
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

    const submission = await db.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = gradeSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { grade, feedback, rubricScores } = validation.data;

    // Validate grade doesn't exceed assignment points
    if (grade > submission.assignment.points) {
      return NextResponse.json(
        { message: `Grade cannot exceed ${submission.assignment.points} points` },
        { status: 400 }
      );
    }

    // Apply late penalty if applicable
    let finalGrade = grade;
    if (submission.latePenaltyApplied) {
      finalGrade = Math.max(0, grade - submission.latePenaltyApplied);
    }

    const updated = await db.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: finalGrade,
        feedback: feedback ?? null,
        rubricScores: rubricScores ? (rubricScores as Prisma.InputJsonValue) : Prisma.JsonNull,
        gradedAt: new Date(),
        gradedBy: session.user.id,
        status: "GRADED",
      },
    });

    // Auto-sync grade to gradebook (fire-and-forget)
    void syncGradeToGradebook({
      courseId,
      userId: updated.userId,
      referenceId: assignmentId,
      score: finalGrade,
      type: "ASSIGNMENT",
    });

    // Notify student that their assignment was graded (fire-and-forget)
    void notifyAssignmentGraded(
      updated.userId,
      submission.assignment.title,
      courseId,
      assignmentId,
      finalGrade,
      submission.assignment.points
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json(
      { message: "Failed to grade submission" },
      { status: 500 }
    );
  }
}
