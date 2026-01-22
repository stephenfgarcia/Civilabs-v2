import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chapterSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/chapters - List chapters
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { courseId } = await params;

    const chapters = await db.chapter.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: { position: "asc" },
        },
        quiz: true,
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { message: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/chapters - Create a chapter
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { courseId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Check ownership or admin
    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = chapterSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { title, description, isFree } = validatedData.data;

    // Get the next position
    const lastChapter = await db.chapter.findFirst({
      where: { courseId },
      orderBy: { position: "desc" },
    });

    const position = lastChapter ? lastChapter.position + 1 : 0;

    const chapter = await db.chapter.create({
      data: {
        title,
        description,
        isFree,
        position,
        courseId,
      },
    });

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json(
      { message: "Failed to create chapter" },
      { status: 500 }
    );
  }
}
