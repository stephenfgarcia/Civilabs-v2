import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseGroupSchema } from "@/lib/validations";

// GET /api/courses/[courseId]/groups - List all groups for a course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    // Verify enrollment or ownership
    const isInstructor = await db.course.findFirst({
      where: { id: courseId, instructorId: session.user.id },
    });
    const isEnrolled = await db.enrollment.findFirst({
      where: { courseId, userId: session.user.id },
    });

    if (!isInstructor && !isEnrolled && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const groups = await db.courseGroup.findMany({
      where: { courseId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { role: "asc" }, // LEADER first
        },
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ message: "Failed to fetch groups" }, { status: 500 });
  }
}

// POST /api/courses/[courseId]/groups - Create a group
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    // Only instructor or admin can create groups
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
    const validation = courseGroupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const group = await db.courseGroup.create({
      data: {
        name: data.name,
        maxMembers: data.maxMembers,
        courseId,
        createdBy: session.user.id,
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json({ message: "Failed to create group" }, { status: 500 });
  }
}
