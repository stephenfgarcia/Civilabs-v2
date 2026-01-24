import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { announcementSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/announcements
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

    const announcements = await db.announcement.findMany({
      where: {
        courseId,
        ...(isInstructor ? {} : {
          isPublished: true,
          OR: [
            { scheduledFor: null },
            { scheduledFor: { lte: new Date() } },
          ],
        }),
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ message: "Failed to fetch announcements" }, { status: 500 });
  }
}

// POST /api/courses/[courseId]/announcements
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

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = announcementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const announcement = await db.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        courseId,
        authorId: session.user.id,
        isPinned: data.isPinned,
        isPublished: data.isPublished,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
        attachmentUrl: data.attachmentUrl ?? undefined,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ message: "Failed to create announcement" }, { status: 500 });
  }
}
