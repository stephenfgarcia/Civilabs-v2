import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; chapterId: string; lessonId: string }>;
}

// GET /api/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { courseId, chapterId, lessonId } = await params;

    const lesson = await db.lesson.findUnique({
      where: {
        id: lessonId,
        chapterId,
        chapter: { courseId },
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { message: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { courseId, chapterId, lessonId } = await params;

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

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId, chapterId },
    });

    if (!lesson) {
      return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
    }

    const body = await request.json();

    // Schedule update (availableFrom/availableUntil)
    if (body.availableFrom !== undefined || body.availableUntil !== undefined) {
      const updatedLesson = await db.lesson.update({
        where: { id: lessonId },
        data: {
          availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
          availableUntil: body.availableUntil ? new Date(body.availableUntil) : null,
        },
      });
      return NextResponse.json(updatedLesson);
    }

    const validatedData = lessonSchema.partial().safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { title, description, type, content, videoUrl, attachmentUrl, sceneConfig } =
      validatedData.data;

    const updatedLesson = await db.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(content !== undefined && { content }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(attachmentUrl !== undefined && { attachmentUrl }),
        ...(sceneConfig !== undefined && { sceneConfig }),
      },
    });

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { message: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { courseId, chapterId, lessonId } = await params;

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

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId, chapterId },
    });

    if (!lesson) {
      return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
    }

    await db.lesson.delete({
      where: { id: lessonId },
    });

    // Reorder remaining lessons
    const remainingLessons = await db.lesson.findMany({
      where: { chapterId },
      orderBy: { position: "asc" },
    });

    for (let i = 0; i < remainingLessons.length; i++) {
      if (remainingLessons[i].position !== i) {
        await db.lesson.update({
          where: { id: remainingLessons[i].id },
          data: { position: i },
        });
      }
    }

    return NextResponse.json({ message: "Lesson deleted" });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { message: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
