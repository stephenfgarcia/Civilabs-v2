import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ categoryId: string }>;
}

// GET /api/forums/[categoryId] - Get category with threads
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { categoryId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const category = await db.forumCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      // Try finding by slug
      const categoryBySlug = await db.forumCategory.findUnique({
        where: { slug: categoryId },
      });

      if (!categoryBySlug) {
        return NextResponse.json(
          { message: "Category not found" },
          { status: 404 }
        );
      }

      const threads = await db.forumThread.findMany({
        where: { categoryId: categoryBySlug.id },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: { replies: true },
          },
        },
      });

      const totalThreads = await db.forumThread.count({
        where: { categoryId: categoryBySlug.id },
      });

      return NextResponse.json({
        category: categoryBySlug,
        threads: threads.map((thread) => ({
          ...thread,
          replyCount: thread._count.replies,
          _count: undefined,
        })),
        pagination: {
          page,
          limit,
          total: totalThreads,
          totalPages: Math.ceil(totalThreads / limit),
        },
      });
    }

    const threads = await db.forumThread.findMany({
      where: { categoryId },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    const totalThreads = await db.forumThread.count({
      where: { categoryId },
    });

    return NextResponse.json({
      category,
      threads: threads.map((thread) => ({
        ...thread,
        replyCount: thread._count.replies,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total: totalThreads,
        totalPages: Math.ceil(totalThreads / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching forum category:", error);
    return NextResponse.json(
      { message: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PATCH /api/forums/[categoryId] - Update category (Admin only)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { categoryId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, icon, color, position } = body;

    const category = await db.forumCategory.update({
      where: { id: categoryId },
      data: {
        ...(name && { name }),
        ...(name && {
          slug: name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
        }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(position !== undefined && { position }),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating forum category:", error);
    return NextResponse.json(
      { message: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/forums/[categoryId] - Delete category (Admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { categoryId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.forumCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Error deleting forum category:", error);
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}
