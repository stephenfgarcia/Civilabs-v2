import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// GET /api/courses - List all published courses (for students) or all courses (for instructors/admins)
export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");

    const where: Record<string, unknown> = {};

    // If not logged in or student, only show published courses
    if (!session?.user || session.user.role === "STUDENT") {
      where.isPublished = true;
    }

    // If instructor, show their own courses
    if (session?.user?.role === "INSTRUCTOR") {
      where.instructorId = session.user.id;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const courses = await db.course.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: true,
        chapters: {
          where: { isPublished: true },
          select: { id: true },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { message: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only instructors and admins can create courses
    if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = courseSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { title, description, categoryId, imageUrl } = validatedData.data;

    // Generate unique slug
    let slug = slugify(title);
    const existingCourse = await db.course.findUnique({ where: { slug } });
    if (existingCourse) {
      slug = `${slug}-${Date.now()}`;
    }

    const course = await db.course.create({
      data: {
        title,
        slug,
        description,
        categoryId: categoryId || null,
        imageUrl: imageUrl || null,
        instructorId: session.user.id,
      },
    });

    // Create a chat room for the course
    await db.chatRoom.create({
      data: {
        courseId: course.id,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { message: "Failed to create course" },
      { status: 500 }
    );
  }
}
