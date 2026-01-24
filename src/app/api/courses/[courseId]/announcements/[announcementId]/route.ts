import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { announcementSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; announcementId: string }>;
}

// PATCH /api/courses/[courseId]/announcements/[announcementId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, announcementId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = announcementSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const announcement = await db.announcement.update({
      where: { id: announcementId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        ...(data.scheduledFor !== undefined && { scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null }),
        ...(data.attachmentUrl !== undefined && { attachmentUrl: data.attachmentUrl ?? null }),
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json({ message: "Failed to update announcement" }, { status: 500 });
  }
}

// DELETE /api/courses/[courseId]/announcements/[announcementId]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, announcementId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.announcement.delete({ where: { id: announcementId } });

    return NextResponse.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ message: "Failed to delete announcement" }, { status: 500 });
  }
}
