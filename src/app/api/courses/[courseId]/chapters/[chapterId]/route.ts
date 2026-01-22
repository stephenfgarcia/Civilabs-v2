import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chapterSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; chapterId: string }>;
}

// GET /api/courses/[courseId]/chapters/[chapterId] - Get a single chapter
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { courseId, chapterId } = await params;

    const chapter = await db.chapter.findUnique({
      where: {
        id: chapterId,
        courseId,
      },
      include: {
        lessons: {
          orderBy: { position: "asc" },
        },
        quiz: {
          include: {
            questions: {
              orderBy: { position: "asc" },
            },
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json(
      { message: "Failed to fetch chapter" },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/chapters/[chapterId] - Update a chapter
export async function PATCH(request: Request, { params }: RouteParams) {
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

    const body = await request.json();

    // Check if it's a publish toggle or full update
    if (body.isPublished !== undefined) {
      const chapter = await db.chapter.findUnique({
        where: { id: chapterId },
        include: { lessons: true },
      });

      if (!chapter) {
        return NextResponse.json({ message: "Chapter not found" }, { status: 404 });
      }

      // If publishing, verify chapter has content
      if (body.isPublished && chapter.lessons.length === 0) {
        return NextResponse.json(
          { message: "Chapter must have at least one lesson to publish" },
          { status: 400 }
        );
      }

      const updatedChapter = await db.chapter.update({
        where: { id: chapterId },
        data: { isPublished: body.isPublished },
      });

      return NextResponse.json(updatedChapter);
    }

    // Full chapter update
    const validatedData = chapterSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { title, description, isFree } = validatedData.data;

    const updatedChapter = await db.chapter.update({
      where: { id: chapterId },
      data: {
        title,
        description,
        isFree,
      },
    });

    return NextResponse.json(updatedChapter);
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json(
      { message: "Failed to update chapter" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/chapters/[chapterId] - Delete a chapter
export async function DELETE(request: Request, { params }: RouteParams) {
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

    await db.chapter.delete({
      where: { id: chapterId },
    });

    // Reorder remaining chapters
    const remainingChapters = await db.chapter.findMany({
      where: { courseId },
      orderBy: { position: "asc" },
    });

    for (let i = 0; i < remainingChapters.length; i++) {
      await db.chapter.update({
        where: { id: remainingChapters[i].id },
        data: { position: i },
      });
    }

    return NextResponse.json({ message: "Chapter deleted" });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return NextResponse.json(
      { message: "Failed to delete chapter" },
      { status: 500 }
    );
  }
}
