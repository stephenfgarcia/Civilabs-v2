import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { db } from "@/lib/db";

// POST /api/pusher/auth - Authenticate Pusher private/presence channels
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const socketId = formData.get("socket_id") as string;
    const channelName = formData.get("channel_name") as string;

    if (!socketId || !channelName) {
      return NextResponse.json(
        { message: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    // Validate channel access
    if (channelName.startsWith("private-course-")) {
      const courseId = channelName.replace("private-course-", "");

      // Check if user has access to this course
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
      });

      if (!course) {
        return NextResponse.json(
          { message: "Course not found" },
          { status: 404 }
        );
      }

      const isInstructor = course.instructorId === session.user.id;
      const enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId,
          },
        },
      });

      if (!isInstructor && !enrollment) {
        return NextResponse.json(
          { message: "Access denied to this channel" },
          { status: 403 }
        );
      }
    }

    // For presence channels
    if (channelName.startsWith("presence-")) {
      const presenceData = {
        user_id: session.user.id,
        user_info: {
          name: session.user.name,
          image: session.user.image,
          role: session.user.role,
        },
      };

      const authResponse = pusherServer.authorizeChannel(
        socketId,
        channelName,
        presenceData
      );

      return NextResponse.json(authResponse);
    }

    // For private channels
    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { message: "Authentication failed" },
      { status: 500 }
    );
  }
}
