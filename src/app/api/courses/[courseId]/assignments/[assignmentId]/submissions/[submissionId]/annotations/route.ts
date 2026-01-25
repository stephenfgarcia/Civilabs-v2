import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ courseId: string; assignmentId: string; submissionId: string }>;
}

// GET /api/courses/.../submissions/[submissionId]/annotations
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, submissionId } = await params;

    // Verify access
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

    const annotations = await db.submissionAnnotation.findMany({
      where: { submissionId },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
      },
      orderBy: { startOffset: "asc" },
    });

    return NextResponse.json(annotations);
  } catch (error) {
    console.error("Error fetching annotations:", error);
    return NextResponse.json({ message: "Failed to fetch annotations" }, { status: 500 });
  }
}

// POST /api/courses/.../submissions/[submissionId]/annotations
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, submissionId } = await params;
    const body = await req.json();
    const { startOffset, endOffset, content } = body;

    if (
      typeof startOffset !== "number" ||
      typeof endOffset !== "number" ||
      startOffset < 0 ||
      endOffset <= startOffset
    ) {
      return NextResponse.json({ message: "Invalid offset range" }, { status: 400 });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    // Verify instructor/admin access (only they can annotate)
    const submission = await db.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { select: { course: { select: { instructorId: true } } } } },
    });

    if (!submission) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    const isInstructor = submission.assignment.course.instructorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { message: "Only instructors can add annotations" },
        { status: 403 }
      );
    }

    const annotation = await db.submissionAnnotation.create({
      data: {
        submissionId,
        authorId: session.user.id,
        startOffset,
        endOffset,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    console.error("Error creating annotation:", error);
    return NextResponse.json({ message: "Failed to create annotation" }, { status: 500 });
  }
}

// DELETE /api/courses/.../submissions/[submissionId]/annotations?id=xxx
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, submissionId } = await params;
    const annotationId = new URL(req.url).searchParams.get("id");

    if (!annotationId) {
      return NextResponse.json({ message: "Annotation ID required" }, { status: 400 });
    }

    const annotation = await db.submissionAnnotation.findUnique({
      where: { id: annotationId },
      include: {
        submission: {
          include: { assignment: { select: { course: { select: { instructorId: true } } } } },
        },
      },
    });

    if (!annotation || annotation.submissionId !== submissionId) {
      return NextResponse.json({ message: "Annotation not found" }, { status: 404 });
    }

    const isInstructor = annotation.submission.assignment.course.instructorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isAuthor = annotation.authorId === session.user.id;

    if (!isInstructor && !isAdmin && !isAuthor) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.submissionAnnotation.delete({ where: { id: annotationId } });

    return NextResponse.json({ message: "Annotation deleted" });
  } catch (error) {
    console.error("Error deleting annotation:", error);
    return NextResponse.json({ message: "Failed to delete annotation" }, { status: 500 });
  }
}
