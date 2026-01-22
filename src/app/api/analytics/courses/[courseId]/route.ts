import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCourseAnalytics } from "@/lib/analytics";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET - Course analytics (admin or course instructor)
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    // Check authorization
    if (session.user.role !== "ADMIN") {
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
      });

      if (!course || course.instructorId !== session.user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    const analytics = await getCourseAnalytics(courseId);

    if (!analytics) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching course analytics:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
