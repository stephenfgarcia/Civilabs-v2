import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { announcementSchema } from "@/lib/validations";

// GET /api/announcements - Get announcements for current user (global + enrolled courses)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

    // Get user's enrolled course IDs
    const enrollments = await db.enrollment.findMany({
      where: { userId: session.user.id },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const announcements = await db.announcement.findMany({
      where: {
        isPublished: true,
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: new Date() } },
        ],
        AND: {
          OR: [
            { courseId: null }, // Global announcements
            { courseId: { in: courseIds } }, // Enrolled course announcements
          ],
        },
      },
      take: limit,
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      include: {
        author: { select: { id: true, name: true, image: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ message: "Failed to fetch announcements" }, { status: 500 });
  }
}

// POST /api/announcements - Create global announcement (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
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
        courseId: null, // Global
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
    console.error("Error creating global announcement:", error);
    return NextResponse.json({ message: "Failed to create announcement" }, { status: 500 });
  }
}
