import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendForumReplyEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ threadId: string }>;
}

// POST /api/forums/threads/[threadId]/replies - Create a reply
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { threadId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 }
      );
    }

    // Verify thread exists and is not locked
    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        category: {
          select: { slug: true },
        },
      },
    });

    if (!thread) {
      return NextResponse.json(
        { message: "Thread not found" },
        { status: 404 }
      );
    }

    if (thread.isLocked) {
      return NextResponse.json(
        { message: "This thread is locked" },
        { status: 403 }
      );
    }

    const reply = await db.forumReply.create({
      data: {
        content,
        userId: session.user.id,
        threadId,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });

    // Update thread's updatedAt to bump it in listings
    await db.forumThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    // Send email notification to thread author (if not replying to own thread)
    if (thread.user.email && thread.user.id !== session.user.id) {
      const replyPreview = content.substring(0, 100);
      const threadUrl = `/forums/${thread.category.slug}/${thread.id}`;

      sendForumReplyEmail(
        thread.user.email,
        thread.user.name || "User",
        session.user.name || "Someone",
        thread.title,
        replyPreview,
        threadUrl
      ).catch((error) => {
        console.error("Failed to send forum reply email:", error);
      });
    }

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json(
      { message: "Failed to create reply" },
      { status: 500 }
    );
  }
}
