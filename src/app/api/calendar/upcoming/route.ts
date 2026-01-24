import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/calendar/upcoming - Get upcoming deadlines (next 7 days)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get user's enrolled courses
    const enrollments = await db.enrollment.findMany({
      where: { userId: session.user.id },
      select: { courseId: true },
    });
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    // For instructors, include their courses
    let instructorCourseIds: string[] = [];
    if (session.user.role === "INSTRUCTOR" || session.user.role === "ADMIN") {
      const instructorCourses = await db.course.findMany({
        where: { instructorId: session.user.id },
        select: { id: true },
      });
      instructorCourseIds = instructorCourses.map((c) => c.id);
    }

    const allCourseIds = [...new Set([...enrolledCourseIds, ...instructorCourseIds])];

    const events = await db.calendarEvent.findMany({
      where: {
        OR: [
          { courseId: { in: allCourseIds } },
          { userId: session.user.id },
        ],
        startDate: { gte: now, lte: sevenDaysFromNow },
      },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { startDate: "asc" },
      take: 20,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return NextResponse.json({ message: "Failed to fetch upcoming events" }, { status: 500 });
  }
}
