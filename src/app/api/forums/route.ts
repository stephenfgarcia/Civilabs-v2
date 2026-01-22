import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/forums - Get all forum categories with thread counts
export async function GET() {
  try {
    const categories = await db.forumCategory.findMany({
      orderBy: { position: "asc" },
      include: {
        _count: {
          select: { threads: true },
        },
        threads: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
      },
    });

    const categoriesWithStats = categories.map((category) => ({
      ...category,
      threadCount: category._count.threads,
      latestThread: category.threads[0] || null,
      threads: undefined,
      _count: undefined,
    }));

    return NextResponse.json(categoriesWithStats);
  } catch (error) {
    console.error("Error fetching forum categories:", error);
    return NextResponse.json(
      { message: "Failed to fetch forums" },
      { status: 500 }
    );
  }
}

// POST /api/forums - Create a new forum category (Admin only)
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, icon, color } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check for duplicate slug
    const existing = await db.forumCategory.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { message: "A category with this name already exists" },
        { status: 400 }
      );
    }

    // Get max position
    const maxPosition = await db.forumCategory.aggregate({
      _max: { position: true },
    });

    const category = await db.forumCategory.create({
      data: {
        name,
        slug,
        description,
        icon,
        color,
        position: (maxPosition._max.position || 0) + 1,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating forum category:", error);
    return NextResponse.json(
      { message: "Failed to create forum category" },
      { status: 500 }
    );
  }
}
