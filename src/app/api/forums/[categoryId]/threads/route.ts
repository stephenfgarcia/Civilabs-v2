import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ categoryId: string }>;
}

// POST /api/forums/[categoryId]/threads - Create a new thread
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { categoryId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { message: "Title and content are required" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await db.forumCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    const thread = await db.forumThread.create({
      data: {
        title,
        content,
        userId: session.user.id,
        categoryId,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { message: "Failed to create thread" },
      { status: 500 }
    );
  }
}
