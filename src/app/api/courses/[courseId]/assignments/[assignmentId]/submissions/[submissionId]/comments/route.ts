import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifySubmissionFeedback } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ courseId: string; assignmentId: string; submissionId: string }>;
}

// GET /api/courses/.../submissions/[submissionId]/comments
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, submissionId } = await params;

    // Verify access (instructor/admin of course or owner of submission)
    const submission = await db.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { select: { course: { select: { instructorId: true } } } } },
    });

    if (!submission) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    const isInstructor = submission.assignment.course.instructorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isOwner = submission.userId === session.user.id;

    if (!isInstructor && !isAdmin && !isOwner) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const comments = await db.submissionComment.findMany({
      where: { submissionId },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ message: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/courses/.../submissions/[submissionId]/comments
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, submissionId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    // Verify access
    const submission = await db.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { select: { title: true, course: { select: { instructorId: true } } } } },
    });

    if (!submission) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    const isInstructor = submission.assignment.course.instructorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isOwner = submission.userId === session.user.id;

    if (!isInstructor && !isAdmin && !isOwner) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const comment = await db.submissionComment.create({
      data: {
        submissionId,
        authorId: session.user.id,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    // Notify student if instructor/admin is commenting (fire-and-forget)
    if ((isInstructor || isAdmin) && submission.userId !== session.user.id) {
      const { assignmentId } = await params;
      void notifySubmissionFeedback(
        submission.userId,
        submission.assignment.title,
        courseId,
        assignmentId,
        session.user.name || undefined
      );
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ message: "Failed to create comment" }, { status: 500 });
  }
}
