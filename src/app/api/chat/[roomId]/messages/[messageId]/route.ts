import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer, getChannelName, PUSHER_EVENTS } from "@/lib/pusher";

interface RouteParams {
  params: Promise<{ roomId: string; messageId: string }>;
}

// DELETE /api/chat/[roomId]/messages/[messageId] - Delete a message
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { roomId, messageId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        room: {
          include: {
            course: {
              select: { id: true, instructorId: true },
            },
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 }
      );
    }

    if (message.roomId !== roomId) {
      return NextResponse.json(
        { message: "Message not found in this room" },
        { status: 404 }
      );
    }

    // Only author, instructor, or admin can delete
    const isAuthor = message.userId === session.user.id;
    const isInstructor = message.room.course.instructorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAuthor && !isInstructor && !isAdmin) {
      return NextResponse.json(
        { message: "You can only delete your own messages" },
        { status: 403 }
      );
    }

    await db.message.delete({
      where: { id: messageId },
    });

    // Trigger Pusher event
    try {
      await pusherServer.trigger(
        getChannelName.courseChat(message.room.course.id),
        PUSHER_EVENTS.MESSAGE_DELETED,
        { messageId }
      );
    } catch (pusherError) {
      console.error("Pusher error (non-fatal):", pusherError);
    }

    return NextResponse.json({ message: "Message deleted" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { message: "Failed to delete message" },
      { status: 500 }
    );
  }
}
