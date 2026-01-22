import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ threadId: string; replyId: string }>;
}

// PATCH /api/forums/threads/[threadId]/replies/[replyId] - Update reply
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { replyId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const reply = await db.forumReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      return NextResponse.json({ message: "Reply not found" }, { status: 404 });
    }

    // Only author or admin can edit
    const isAuthor = reply.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 }
      );
    }

    const updatedReply = await db.forumReply.update({
      where: { id: replyId },
      data: { content },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });

    return NextResponse.json(updatedReply);
  } catch (error) {
    console.error("Error updating reply:", error);
    return NextResponse.json(
      { message: "Failed to update reply" },
      { status: 500 }
    );
  }
}

// DELETE /api/forums/threads/[threadId]/replies/[replyId] - Delete reply
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { replyId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const reply = await db.forumReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      return NextResponse.json({ message: "Reply not found" }, { status: 404 });
    }

    // Only author or admin can delete
    const isAuthor = reply.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.forumReply.delete({
      where: { id: replyId },
    });

    return NextResponse.json({ message: "Reply deleted" });
  } catch (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json(
      { message: "Failed to delete reply" },
      { status: 500 }
    );
  }
}
