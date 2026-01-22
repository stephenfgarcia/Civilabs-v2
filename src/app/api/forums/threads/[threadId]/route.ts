import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ threadId: string }>;
}

// GET /api/forums/threads/[threadId] - Get thread with replies
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { threadId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
        category: true,
      },
    });

    if (!thread) {
      return NextResponse.json(
        { message: "Thread not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await db.forumThread.update({
      where: { id: threadId },
      data: { views: { increment: 1 } },
    });

    const replies = await db.forumReply.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });

    const totalReplies = await db.forumReply.count({
      where: { threadId },
    });

    return NextResponse.json({
      thread: {
        ...thread,
        views: thread.views + 1, // Include the incremented view
      },
      replies,
      pagination: {
        page,
        limit,
        total: totalReplies,
        totalPages: Math.ceil(totalReplies / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching thread:", error);
    return NextResponse.json(
      { message: "Failed to fetch thread" },
      { status: 500 }
    );
  }
}

// PATCH /api/forums/threads/[threadId] - Update thread
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { threadId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json(
        { message: "Thread not found" },
        { status: 404 }
      );
    }

    // Only author or admin can edit
    const isAuthor = thread.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, isPinned, isLocked } = body;

    // Only admin can pin/lock threads
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    if (isAdmin) {
      if (isPinned !== undefined) updateData.isPinned = isPinned;
      if (isLocked !== undefined) updateData.isLocked = isLocked;
    }

    const updatedThread = await db.forumThread.update({
      where: { id: threadId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(updatedThread);
  } catch (error) {
    console.error("Error updating thread:", error);
    return NextResponse.json(
      { message: "Failed to update thread" },
      { status: 500 }
    );
  }
}

// DELETE /api/forums/threads/[threadId] - Delete thread
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { threadId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json(
        { message: "Thread not found" },
        { status: 404 }
      );
    }

    // Only author or admin can delete
    const isAuthor = thread.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.forumThread.delete({
      where: { id: threadId },
    });

    return NextResponse.json({ message: "Thread deleted" });
  } catch (error) {
    console.error("Error deleting thread:", error);
    return NextResponse.json(
      { message: "Failed to delete thread" },
      { status: 500 }
    );
  }
}
