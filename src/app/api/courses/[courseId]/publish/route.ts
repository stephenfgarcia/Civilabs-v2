import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// PATCH /api/courses/[courseId]/publish - Toggle course publish status
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { courseId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Check ownership or admin
    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { isPublished } = body;

    // If trying to publish, verify course has required content
    if (isPublished) {
      const hasPublishedChapter = course.chapters.some(
        (chapter) => chapter.isPublished
      );

      if (!course.title || !course.description || !hasPublishedChapter) {
        return NextResponse.json(
          {
            message:
              "Course must have a title, description, and at least one published chapter",
          },
          { status: 400 }
        );
      }
    }

    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: { isPublished },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Error updating publish status:", error);
    return NextResponse.json(
      { message: "Failed to update publish status" },
      { status: 500 }
    );
  }
}
