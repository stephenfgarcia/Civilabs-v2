import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignmentSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/assignments - List assignments
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

    const isInstructor = course.instructorId === session.user.id || session.user.role === "ADMIN";

    // Students only see published assignments
    const assignments = await db.assignment.findMany({
      where: {
        courseId,
        ...(!isInstructor && { isPublished: true }),
      },
      include: {
        chapter: {
          select: { id: true, title: true },
        },
        rubric: {
          select: { id: true, title: true },
        },
        _count: {
          select: { submissions: true },
        },
        // For students: include their own submission
        ...((!isInstructor) && {
          submissions: {
            where: { userId: session.user.id },
            select: {
              id: true,
              status: true,
              grade: true,
              submittedAt: true,
              submissionNumber: true,
            },
            orderBy: { createdAt: "desc" as const },
            take: 1,
          },
        }),
      },
      orderBy: [
        { position: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { message: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/assignments - Create assignment
export async function POST(req: NextRequest, { params }: RouteParams) {
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

    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = assignmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify chapter belongs to course if provided
    if (data.chapterId) {
      const chapter = await db.chapter.findUnique({
        where: { id: data.chapterId, courseId },
      });
      if (!chapter) {
        return NextResponse.json(
          { message: "Chapter not found in this course" },
          { status: 400 }
        );
      }
    }

    // Get next position
    const lastAssignment = await db.assignment.findFirst({
      where: { courseId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const assignment = await db.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        courseId,
        chapterId: data.chapterId ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        points: data.points,
        isPublished: data.isPublished,
        position: (lastAssignment?.position ?? -1) + 1,
        allowedFileTypes: data.allowedFileTypes ?? null,
        maxFileSize: data.maxFileSize ?? null,
        maxSubmissions: data.maxSubmissions,
        latePolicy: data.latePolicy,
        latePenaltyPercent: data.latePenaltyPercent,
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
        availableUntil: data.availableUntil ? new Date(data.availableUntil) : null,
        rubricId: data.rubricId ?? null,
        isGroupAssignment: data.isGroupAssignment,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { message: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
