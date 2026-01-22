import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

// GET /api/chat/[roomId] - Get chat room details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { roomId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const chatRoom = await db.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        course: {
          include: {
            instructor: {
              select: { id: true, name: true, image: true },
            },
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { message: "Chat room not found" },
        { status: 404 }
      );
    }

    // Verify user has access (enrolled or instructor)
    const isInstructor = chatRoom.course.instructorId === session.user.id;
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: chatRoom.course.id,
        },
      },
    });

    if (!isInstructor && !enrollment) {
      return NextResponse.json(
        { message: "You don't have access to this chat room" },
        { status: 403 }
      );
    }

    // Get online members (simplified - just get recent active users)
    const recentMessages = await db.message.findMany({
      where: {
        roomId,
        createdAt: {
          gt: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
      select: {
        userId: true,
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      distinct: ["userId"],
    });

    const onlineUsers = recentMessages.map((m) => m.user);

    return NextResponse.json({
      id: chatRoom.id,
      courseId: chatRoom.course.id,
      courseTitle: chatRoom.course.title,
      courseImage: chatRoom.course.imageUrl,
      instructor: chatRoom.course.instructor,
      memberCount: chatRoom.course._count.enrollments + 1,
      onlineUsers,
      isInstructor,
    });
  } catch (error) {
    console.error("Error fetching chat room:", error);
    return NextResponse.json(
      { message: "Failed to fetch chat room" },
      { status: 500 }
    );
  }
}
