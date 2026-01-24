import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/activity - Student activity report
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const days = parseInt(searchParams.get("days") || "30");

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get enrolled students
    const enrollments = await db.enrollment.findMany({
      where: { courseId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    if (studentId) {
      // Detailed activity for one student
      const activities = await db.userActivity.findMany({
        where: { userId: studentId, courseId, timestamp: { gte: since } },
        orderBy: { timestamp: "desc" },
        take: 200,
      });

      // Progress data
      const progress = await db.userProgress.findMany({
        where: { userId: studentId, lesson: { chapter: { courseId } } },
        include: { lesson: { select: { id: true, title: true, chapterId: true } } },
      });

      // Last activity
      const lastActivity = activities.length > 0 ? activities[0].timestamp : null;

      // Time spent (sum of VIEW events approximately)
      const viewEvents = activities.filter((a) => a.eventType === "VIEW");

      return NextResponse.json({
        student: enrollments.find((e) => e.user.id === studentId)?.user,
        lastActivity,
        totalEvents: activities.length,
        viewCount: viewEvents.length,
        progressCount: progress.filter((p) => p.isCompleted).length,
        totalLessons: progress.length,
        recentActivity: activities.slice(0, 50),
      });
    }

    // Summary for all students
    const activityCounts = await db.userActivity.groupBy({
      by: ["userId"],
      where: { courseId, timestamp: { gte: since } },
      _count: true,
      _max: { timestamp: true },
    });

    const activityMap = new Map(activityCounts.map((a) => [a.userId, a]));

    // Progress counts
    const progressCounts = await db.userProgress.groupBy({
      by: ["userId"],
      where: { lesson: { chapter: { courseId } }, isCompleted: true },
      _count: true,
    });
    const progressMap = new Map(progressCounts.map((p) => [p.userId, p._count]));

    // Total lessons in course
    const totalLessons = await db.lesson.count({
      where: { chapter: { courseId } },
    });

    // Assignment submission status
    const submissions = await db.assignmentSubmission.groupBy({
      by: ["userId"],
      where: { assignment: { courseId }, status: { in: ["SUBMITTED", "GRADED"] } },
      _count: true,
    });
    const submissionMap = new Map(submissions.map((s) => [s.userId, s._count]));

    const students = enrollments.map((e) => {
      const activity = activityMap.get(e.user.id);
      const completedLessons = progressMap.get(e.user.id) || 0;
      const submissionCount = submissionMap.get(e.user.id) || 0;

      // At-risk: no activity in 7+ days, or < 30% progress
      const lastActivity = activity?._max?.timestamp;
      const daysSinceActivity = lastActivity
        ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const isAtRisk = daysSinceActivity > 7 || progressPercent < 30;

      return {
        ...e.user,
        lastActivity: lastActivity || null,
        daysSinceActivity,
        eventCount: activity?._count || 0,
        completedLessons,
        totalLessons,
        progressPercent,
        submissionCount,
        isAtRisk,
      };
    });

    return NextResponse.json({
      students: students.sort((a, b) => (b.isAtRisk ? 1 : 0) - (a.isAtRisk ? 1 : 0)),
      totalLessons,
      period: days,
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json({ message: "Failed to fetch activity" }, { status: 500 });
  }
}
