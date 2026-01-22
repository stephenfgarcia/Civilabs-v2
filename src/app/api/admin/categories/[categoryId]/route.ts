import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ categoryId: string }>;
}

// PATCH /api/admin/categories/[categoryId] - Update category
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    // Generate new slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check for duplicate (excluding current category)
    const existing = await db.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
        NOT: { id: categoryId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "A category with this name already exists" },
        { status: 400 }
      );
    }

    const category = await db.category.update({
      where: { id: categoryId },
      data: { name, slug },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { message: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[categoryId] - Delete category
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

    // Check if category has courses
    const courseCount = await db.course.count({
      where: { categoryId },
    });

    if (courseCount > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete category with ${courseCount} courses. Remove courses from this category first.`,
        },
        { status: 400 }
      );
    }

    await db.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}
