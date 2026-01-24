import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignmentSubmissionSchema } from "@/lib/validations";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatcher";

interface RouteParams {
  params: Promise<{ courseId: string; assignmentId: string }>;
}

// GET /api/courses/[courseId]/assignments/[assignmentId]/submissions
// Instructor: all submissions; Student: own submissions
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, assignmentId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    const isInstructor = course.instructorId === session.user.id || session.user.role === "ADMIN";

    const submissions = await db.assignmentSubmission.findMany({
      where: {
        assignmentId,
        ...(!isInstructor && { userId: session.user.id }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { message: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/assignments/[assignmentId]/submissions
// Student submits work
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, assignmentId } = await params;

    // Verify enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: "You must be enrolled in this course" },
        { status: 403 }
      );
    }

    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId, courseId, isPublished: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check availability window
    const now = new Date();
    if (assignment.availableFrom && now < assignment.availableFrom) {
      return NextResponse.json(
        { message: "This assignment is not yet available" },
        { status: 403 }
      );
    }

    // Check late policy
    const isLate = assignment.dueDate ? now > assignment.dueDate : false;
    if (isLate && assignment.latePolicy === "REJECT_LATE") {
      return NextResponse.json(
        { message: "Late submissions are not accepted for this assignment" },
        { status: 403 }
      );
    }

    // Handle group assignment logic
    let groupId: string | null = null;
    if (assignment.isGroupAssignment) {
      const membership = await db.groupMember.findFirst({
        where: {
          userId: session.user.id,
          group: { courseId },
        },
        include: { group: true },
      });

      if (!membership) {
        return NextResponse.json(
          { message: "You must be in a group to submit a group assignment" },
          { status: 403 }
        );
      }

      groupId = membership.groupId;

      // For group assignments, check if group already submitted
      const groupSubmissions = await db.assignmentSubmission.count({
        where: {
          assignmentId,
          groupId,
          status: { not: "DRAFT" },
        },
      });

      if (groupSubmissions >= assignment.maxSubmissions) {
        return NextResponse.json(
          { message: `Your group has reached the maximum submissions (${assignment.maxSubmissions})` },
          { status: 403 }
        );
      }
    }

    // Check submission limit (individual)
    const existingSubmissions = await db.assignmentSubmission.count({
      where: {
        assignmentId,
        ...(assignment.isGroupAssignment
          ? { groupId }
          : { userId: session.user.id }),
        status: { not: "DRAFT" },
      },
    });

    if (existingSubmissions >= assignment.maxSubmissions) {
      return NextResponse.json(
        { message: `Maximum submissions (${assignment.maxSubmissions}) reached` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = assignmentSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate submission content based on assignment type
    switch (assignment.type) {
      case "FILE_UPLOAD":
        if (!data.fileUrl) {
          return NextResponse.json(
            { message: "File upload required" },
            { status: 400 }
          );
        }
        break;
      case "TEXT_ENTRY":
        if (!data.textContent || data.textContent.trim().length === 0) {
          return NextResponse.json(
            { message: "Text content required" },
            { status: 400 }
          );
        }
        break;
      case "URL_LINK":
        if (!data.urlLink) {
          return NextResponse.json(
            { message: "URL link required" },
            { status: 400 }
          );
        }
        break;
    }

    // Calculate late penalty if applicable
    let latePenaltyApplied: number | null = null;
    if (isLate && assignment.latePenaltyPercent > 0 && assignment.dueDate) {
      const daysLate = Math.ceil(
        (now.getTime() - assignment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      latePenaltyApplied = Math.min(
        assignment.points,
        (assignment.latePenaltyPercent / 100) * assignment.points * daysLate
      );
    }

    const submission = await db.assignmentSubmission.create({
      data: {
        assignmentId,
        userId: session.user.id,
        groupId,
        status: "SUBMITTED",
        submissionNumber: existingSubmissions + 1,
        fileUrl: data.fileUrl ?? null,
        fileName: data.fileName ?? null,
        fileSize: data.fileSize ?? null,
        textContent: data.textContent ?? null,
        urlLink: data.urlLink ?? null,
        submittedAt: now,
        isLate,
        latePenaltyApplied,
      },
    });

    dispatchWebhookEvent("ASSIGNMENT_SUBMITTED", {
      submissionId: submission.id,
      assignmentId,
      userId: session.user.id,
      courseId,
      isLate,
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { message: "Failed to submit assignment" },
      { status: 500 }
    );
  }
}
