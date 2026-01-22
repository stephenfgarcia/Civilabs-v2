import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; chapterId: string }>;
}

// GET /api/courses/[courseId]/chapters/[chapterId]/lessons - List lessons
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { courseId, chapterId } = await params;

    const lessons = await db.lesson.findMany({
      where: {
        chapterId,
        chapter: { courseId },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { message: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/chapters/[chapterId]/lessons - Create a lesson
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { courseId, chapterId } = await params;

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

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, courseId },
    });

    if (!chapter) {
      return NextResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = lessonSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { title, description, type, content, videoUrl, attachmentUrl, sceneConfig } =
      validatedData.data;

    // Get the next position
    const lastLesson = await db.lesson.findFirst({
      where: { chapterId },
      orderBy: { position: "desc" },
    });

    const position = lastLesson ? lastLesson.position + 1 : 0;

    const lesson = await db.lesson.create({
      data: {
        title,
        description,
        type,
        content,
        videoUrl,
        attachmentUrl,
        sceneConfig,
        position,
        chapterId,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { message: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
