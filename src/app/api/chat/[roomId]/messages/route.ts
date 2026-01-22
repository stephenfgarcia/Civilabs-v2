import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer, getChannelName, PUSHER_EVENTS } from "@/lib/pusher";

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

// GET /api/chat/[roomId]/messages - Get messages for a chat room
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify access
    const chatRoom = await db.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        course: {
          select: { id: true, instructorId: true },
        },
      },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { message: "Chat room not found" },
        { status: 404 }
      );
    }

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

    // Fetch messages with cursor-based pagination
    const messages = await db.message.findMany({
      where: { roomId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });

    let nextCursor: string | undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    // Reverse to get chronological order
    messages.reverse();

    return NextResponse.json({
      messages,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { message: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/chat/[roomId]/messages - Send a message
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { roomId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { message: "Message content is required" },
        { status: 400 }
      );
    }

    // Verify access
    const chatRoom = await db.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        course: {
          select: { id: true, instructorId: true },
        },
      },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { message: "Chat room not found" },
        { status: 404 }
      );
    }

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

    // Create message
    const message = await db.message.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        roomId,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });

    // Trigger Pusher event
    try {
      await pusherServer.trigger(
        getChannelName.courseChat(chatRoom.course.id),
        PUSHER_EVENTS.NEW_MESSAGE,
        message
      );
    } catch (pusherError) {
      console.error("Pusher error (non-fatal):", pusherError);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 }
    );
  }
}
