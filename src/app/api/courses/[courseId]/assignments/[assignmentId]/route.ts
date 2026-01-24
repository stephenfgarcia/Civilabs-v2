import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignmentSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; assignmentId: string }>;
}

// GET /api/courses/[courseId]/assignments/[assignmentId]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, assignmentId } = await params;

    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId, courseId },
      include: {
        chapter: {
          select: { id: true, title: true },
        },
        rubric: {
          include: {
            criteria: {
              orderBy: { position: "asc" },
            },
          },
        },
        submissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
    }

    // Check access
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    const isInstructor = course?.instructorId === session.user.id || session.user.role === "ADMIN";

    if (!isInstructor && !assignment.isPublished) {
      return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
    }

    // Students only see their own submissions
    if (!isInstructor) {
      assignment.submissions = assignment.submissions.filter(
        (s) => s.userId === session.user.id
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { message: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/assignments/[assignmentId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId, courseId },
    });

    if (!assignment) {
      return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = assignmentSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const updated = await db.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.chapterId !== undefined && { chapterId: data.chapterId ?? null }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.points !== undefined && { points: data.points }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        ...(data.allowedFileTypes !== undefined && { allowedFileTypes: data.allowedFileTypes ?? null }),
        ...(data.maxFileSize !== undefined && { maxFileSize: data.maxFileSize ?? null }),
        ...(data.maxSubmissions !== undefined && { maxSubmissions: data.maxSubmissions }),
        ...(data.latePolicy !== undefined && { latePolicy: data.latePolicy }),
        ...(data.latePenaltyPercent !== undefined && { latePenaltyPercent: data.latePenaltyPercent }),
        ...(data.availableFrom !== undefined && { availableFrom: data.availableFrom ? new Date(data.availableFrom) : null }),
        ...(data.availableUntil !== undefined && { availableUntil: data.availableUntil ? new Date(data.availableUntil) : null }),
        ...(data.rubricId !== undefined && { rubricId: data.rubricId ?? null }),
        ...(data.isGroupAssignment !== undefined && { isGroupAssignment: data.isGroupAssignment }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { message: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/assignments/[assignmentId]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.assignment.delete({
      where: { id: assignmentId, courseId },
    });

    return NextResponse.json({ message: "Assignment deleted" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { message: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
