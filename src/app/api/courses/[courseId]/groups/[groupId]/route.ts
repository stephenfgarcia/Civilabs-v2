import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseGroupUpdateSchema, groupMemberSchema } from "@/lib/validations";
import { GroupRole } from "@prisma/client";

type RouteParams = { params: Promise<{ courseId: string; groupId: string }> };

// GET /api/courses/[courseId]/groups/[groupId] - Get group details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, groupId } = await params;

    const group = await db.courseGroup.findFirst({
      where: { id: groupId, courseId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { role: "asc" },
        },
        _count: { select: { members: true, submissions: true } },
      },
    });

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json({ message: "Failed to fetch group" }, { status: 500 });
  }
}

// PATCH /api/courses/[courseId]/groups/[groupId] - Update group
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, groupId } = await params;

    // Only instructor/admin
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = courseGroupUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const group = await db.courseGroup.update({
      where: { id: groupId },
      data: validation.data,
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json({ message: "Failed to update group" }, { status: 500 });
  }
}

// DELETE /api/courses/[courseId]/groups/[groupId] - Delete group
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, groupId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.courseGroup.delete({ where: { id: groupId } });
    return NextResponse.json({ message: "Group deleted" });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json({ message: "Failed to delete group" }, { status: 500 });
  }
}

// POST /api/courses/[courseId]/groups/[groupId] - Add/remove member
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, groupId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "remove") {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ message: "userId required" }, { status: 400 });
      }

      await db.groupMember.deleteMany({
        where: { groupId, userId },
      });

      return NextResponse.json({ message: "Member removed" });
    }

    // Default: add member
    const validation = groupMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if user is enrolled in the course
    const enrollment = await db.enrollment.findFirst({
      where: { courseId, userId: data.userId },
    });
    if (!enrollment) {
      return NextResponse.json({ message: "User is not enrolled in this course" }, { status: 400 });
    }

    // Check group capacity
    const group = await db.courseGroup.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: true } } },
    });
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }
    if (group._count.members >= group.maxMembers) {
      return NextResponse.json({ message: "Group is full" }, { status: 400 });
    }

    // Check if user is already in a group for this course
    const existingMembership = await db.groupMember.findFirst({
      where: {
        userId: data.userId,
        group: { courseId },
      },
    });
    if (existingMembership) {
      return NextResponse.json(
        { message: "User is already in a group for this course" },
        { status: 400 }
      );
    }

    const member = await db.groupMember.create({
      data: {
        groupId,
        userId: data.userId,
        role: data.role as GroupRole,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error managing group member:", error);
    return NextResponse.json({ message: "Failed to manage member" }, { status: 500 });
  }
}
