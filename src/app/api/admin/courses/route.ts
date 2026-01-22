import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/courses - Get all courses with pagination
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          {
            instructor: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }),
      ...(status === "published" && { isPublished: true }),
      ...(status === "draft" && { isPublished: false }),
      ...(categoryId && { categoryId }),
    };

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          instructor: {
            select: { id: true, name: true, image: true },
          },
          category: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              enrollments: true,
              chapters: true,
            },
          },
        },
      }),
      db.course.count({ where }),
    ]);

    return NextResponse.json({
      courses: courses.map((course) => ({
        ...course,
        enrollmentCount: course._count.enrollments,
        chapterCount: course._count.chapters,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { message: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
