import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { MediaType } from "@prisma/client";

const createMediaSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  type: z.nativeEnum(MediaType),
  size: z.number().positive(),
  mimeType: z.string().optional(),
  courseId: z.string().optional(),
});

// GET /api/media - List user's media files
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as MediaType | null;
    const courseId = searchParams.get("courseId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (type) {
      where.type = type;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [media, total] = await Promise.all([
      db.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          course: {
            select: { id: true, title: true },
          },
        },
      }),
      db.media.count({ where }),
    ]);

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { message: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// POST /api/media - Create media record
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only instructors and admins can save media
    if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createMediaSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { name, url, type, size, mimeType, courseId } = validatedData.data;

    // Verify course ownership if courseId is provided
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return NextResponse.json(
          { message: "Course not found" },
          { status: 404 }
        );
      }

      if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
        return NextResponse.json(
          { message: "You don't have access to this course" },
          { status: 403 }
        );
      }
    }

    const media = await db.media.create({
      data: {
        name,
        url,
        type,
        size,
        mimeType,
        userId: session.user.id,
        courseId: courseId || null,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error("Error creating media:", error);
    return NextResponse.json(
      { message: "Failed to create media" },
      { status: 500 }
    );
  }
}
