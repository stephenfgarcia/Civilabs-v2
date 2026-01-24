import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseApprovalReviewSchema } from "@/lib/validations";
import { sendApprovalNotification } from "@/lib/email";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/admin/courses/[courseId]/approval - Get approval status
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

    // Only instructor or admin can view
    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const approval = await db.courseApproval.findUnique({
      where: { courseId },
    });

    return NextResponse.json(approval || { status: "DRAFT", courseId });
  } catch (error) {
    console.error("Error fetching approval:", error);
    return NextResponse.json({ message: "Failed to fetch approval" }, { status: 500 });
  }
}

// POST /api/admin/courses/[courseId]/approval - Submit for review OR review action
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;
    const body = await req.json();

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, instructorId: true, instructor: { select: { email: true } } },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Instructor submits for review
    if (body.action === "SUBMIT") {
      if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      const approval = await db.courseApproval.upsert({
        where: { courseId },
        create: {
          courseId,
          status: "PENDING_REVIEW",
          submittedAt: new Date(),
          history: [{ status: "PENDING_REVIEW", by: session.user.id, at: new Date().toISOString() }],
        },
        update: {
          status: "PENDING_REVIEW",
          submittedAt: new Date(),
          reviewedBy: null,
          reviewedAt: null,
          reviewComment: null,
          history: {
            // Append to history
            push: { status: "PENDING_REVIEW", by: session.user.id, at: new Date().toISOString() },
          },
        },
      });

      await db.auditLog.create({
        data: {
          action: "COURSE_SUBMITTED_FOR_REVIEW",
          userId: session.user.id,
          targetId: courseId,
          targetType: "Course",
        },
      });

      // Notify admins
      const admins = await db.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      for (const admin of admins) {
        await db.notification.create({
          data: {
            type: "COURSE_REVIEW_REQUESTED",
            title: "Course Submitted for Review",
            message: `"${course.title}" has been submitted for approval.`,
            userId: admin.id,
            link: `/admin/review-queue`,
            metadata: { courseId },
          },
        });
      }

      return NextResponse.json(approval, { status: 200 });
    }

    // Admin reviews
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Only admins can review courses" }, { status: 403 });
    }

    const validation = courseApprovalReviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { action, comment } = validation.data;

    const statusMap: Record<string, "APPROVED" | "REJECTED" | "CHANGES_REQUESTED"> = {
      APPROVE: "APPROVED",
      REJECT: "REJECTED",
      REQUEST_CHANGES: "CHANGES_REQUESTED",
    };

    const newStatus = statusMap[action];

    const approval = await db.courseApproval.upsert({
      where: { courseId },
      create: {
        courseId,
        status: newStatus,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewComment: comment || null,
        history: [{ status: newStatus, by: session.user.id, at: new Date().toISOString(), comment }],
      },
      update: {
        status: newStatus,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewComment: comment || null,
        history: {
          push: { status: newStatus, by: session.user.id, at: new Date().toISOString(), comment },
        },
      },
    });

    // Audit action
    const auditActionMap: Record<string, "COURSE_APPROVED" | "COURSE_REJECTED" | "COURSE_CHANGES_REQUESTED"> = {
      APPROVE: "COURSE_APPROVED",
      REJECT: "COURSE_REJECTED",
      REQUEST_CHANGES: "COURSE_CHANGES_REQUESTED",
    };

    await db.auditLog.create({
      data: {
        action: auditActionMap[action],
        userId: session.user.id,
        targetId: courseId,
        targetType: "Course",
        details: { comment },
      },
    });

    // Notify instructor
    await db.notification.create({
      data: {
        type: newStatus === "APPROVED" ? "COURSE_APPROVED" : "COURSE_REJECTED",
        title: `Course ${newStatus === "APPROVED" ? "Approved" : newStatus === "REJECTED" ? "Rejected" : "Needs Changes"}`,
        message: `"${course.title}" ${newStatus === "APPROVED" ? "has been approved!" : newStatus === "REJECTED" ? "was not approved." : "needs changes."}${comment ? ` Comment: ${comment}` : ""}`,
        userId: course.instructorId,
        link: `/instructor/courses/${courseId}`,
        metadata: { courseId, status: newStatus },
      },
    });

    // Send email notification
    await sendApprovalNotification(course.instructor.email, course.title, newStatus, comment || undefined);

    return NextResponse.json(approval);
  } catch (error) {
    console.error("Error processing approval:", error);
    return NextResponse.json({ message: "Failed to process approval" }, { status: 500 });
  }
}
