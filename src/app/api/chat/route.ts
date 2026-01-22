import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/chat - Get user's chat rooms (courses they're enrolled in)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get courses user is enrolled in or instructing
    const enrollments = await db.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          include: {
            instructor: {
              select: { id: true, name: true, image: true },
            },
            chatRoom: true,
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
    });

    // Get courses user is instructing
    const instructorCourses = await db.course.findMany({
      where: {
        instructorId: session.user.id,
        isPublished: true,
      },
      include: {
        instructor: {
          select: { id: true, name: true, image: true },
        },
        chatRoom: true,
        _count: {
          select: { enrollments: true },
        },
      },
    });

    // Combine and deduplicate
    const courseMap = new Map();

    for (const enrollment of enrollments) {
      if (enrollment.course.isPublished) {
        courseMap.set(enrollment.course.id, {
          ...enrollment.course,
          memberCount: enrollment.course._count.enrollments + 1, // +1 for instructor
          role: "student",
        });
      }
    }

    for (const course of instructorCourses) {
      courseMap.set(course.id, {
        ...course,
        memberCount: course._count.enrollments + 1,
        role: "instructor",
      });
    }

    // Get latest message for each chat room
    const chatRooms = await Promise.all(
      Array.from(courseMap.values()).map(async (course) => {
        let chatRoom = course.chatRoom;

        // Create chat room if it doesn't exist
        if (!chatRoom) {
          chatRoom = await db.chatRoom.create({
            data: { courseId: course.id },
          });
        }

        const latestMessage = await db.message.findFirst({
          where: { roomId: chatRoom.id },
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { name: true },
            },
          },
        });

        const unreadCount = await db.message.count({
          where: {
            roomId: chatRoom.id,
            createdAt: {
              gt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours as a simple "unread" proxy
            },
            NOT: { userId: session.user.id },
          },
        });

        return {
          id: chatRoom.id,
          courseId: course.id,
          courseTitle: course.title,
          courseImage: course.imageUrl,
          instructor: course.instructor,
          memberCount: course.memberCount,
          role: course.role,
          latestMessage: latestMessage
            ? {
                content: latestMessage.content,
                userName: latestMessage.user.name,
                createdAt: latestMessage.createdAt,
              }
            : null,
          unreadCount,
        };
      })
    );

    // Sort by latest message
    chatRooms.sort((a, b) => {
      if (!a.latestMessage) return 1;
      if (!b.latestMessage) return -1;
      return (
        new Date(b.latestMessage.createdAt).getTime() -
        new Date(a.latestMessage.createdAt).getTime()
      );
    });

    return NextResponse.json(chatRooms);
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    return NextResponse.json(
      { message: "Failed to fetch chat rooms" },
      { status: 500 }
    );
  }
}
