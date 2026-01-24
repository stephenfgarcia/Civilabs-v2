import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/analytics/at-risk - Get at-risk students across instructor's courses
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const riskFilter = searchParams.get("risk"); // "inactive", "failing", "missed"

    // Get instructor's courses (or all for admin)
    const courseFilter = session.user.role === "ADMIN"
      ? courseId ? { id: courseId } : {}
      : courseId
        ? { id: courseId, instructorId: session.user.id }
        : { instructorId: session.user.id };

    const courses = await db.course.findMany({
      where: { ...courseFilter, isPublished: true },
      select: { id: true, title: true },
    });

    const courseIds = courses.map((c) => c.id);
    const courseMap = new Map(courses.map((c) => [c.id, c.title]));

    // Get all enrollments
    const enrollments = await db.enrollment.findMany({
      where: { courseId: { in: courseIds }, completedAt: null },
      select: {
        userId: true,
        courseId: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get last activity for each user across courses
    const userIds = [...new Set(enrollments.map((e) => e.userId))];

    const lastActivities = await db.userActivity.findMany({
      where: { userId: { in: userIds }, courseId: { in: courseIds } },
      orderBy: { timestamp: "desc" },
      distinct: ["userId", "courseId"],
      select: { userId: true, courseId: true, timestamp: true },
    });

    const activityMap = new Map<string, Date>();
    for (const a of lastActivities) {
      activityMap.set(`${a.userId}-${a.courseId}`, a.timestamp);
    }

    // Get progress data
    const progressData = await db.userProgress.findMany({
      where: {
        userId: { in: userIds },
        lesson: { chapter: { courseId: { in: courseIds } } },
      },
      select: { userId: true, lessonId: true, isCompleted: true, lesson: { select: { chapter: { select: { courseId: true } } } } },
    });

    // Calculate progress per user per course
    const userCourseProgress = new Map<string, { completed: number; total: number }>();
    for (const p of progressData) {
      const key = `${p.userId}-${p.lesson.chapter.courseId}`;
      if (!userCourseProgress.has(key)) userCourseProgress.set(key, { completed: 0, total: 0 });
      const entry = userCourseProgress.get(key)!;
      entry.total++;
      if (p.isCompleted) entry.completed++;
    }

    // Get total lessons per course
    const courseLessonCounts = await db.lesson.groupBy({
      by: ["chapterId"],
      where: { chapter: { courseId: { in: courseIds } } },
      _count: { id: true },
    });

    const chapterCourseMap = await db.chapter.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true, courseId: true },
    });
    const chapterToCourse = new Map(chapterCourseMap.map((c) => [c.id, c.courseId]));

    const totalLessonsPerCourse = new Map<string, number>();
    for (const cl of courseLessonCounts) {
      const cId = chapterToCourse.get(cl.chapterId);
      if (cId) {
        totalLessonsPerCourse.set(cId, (totalLessonsPerCourse.get(cId) || 0) + cl._count.id);
      }
    }

    // Get missed assignments
    const overdueAssignments = await db.assignment.findMany({
      where: {
        courseId: { in: courseIds },
        isPublished: true,
        dueDate: { lt: now },
      },
      select: { id: true, courseId: true, title: true, dueDate: true },
    });

    const submittedAssignments = await db.assignmentSubmission.findMany({
      where: {
        assignmentId: { in: overdueAssignments.map((a) => a.id) },
        status: { not: "DRAFT" },
      },
      select: { assignmentId: true, userId: true },
    });

    const submittedSet = new Set(
      submittedAssignments.map((s) => `${s.userId}-${s.assignmentId}`)
    );

    // Build at-risk student list
    const atRiskStudents: {
      userId: string;
      user: { id: string; name: string | null; email: string };
      courseId: string;
      courseName: string;
      risks: string[];
      riskScore: number;
      lastActivity: string | null;
      progressPercent: number;
      missedAssignments: number;
      createdAt: string;
    }[] = [];

    for (const enrollment of enrollments) {
      const key = `${enrollment.userId}-${enrollment.courseId}`;
      const lastActivity = activityMap.get(key);
      const progress = userCourseProgress.get(key);
      const totalLessons = totalLessonsPerCourse.get(enrollment.courseId) || 0;
      const progressPct = totalLessons > 0 && progress
        ? Math.round((progress.completed / totalLessons) * 100)
        : 0;

      const risks: string[] = [];

      // Risk: No activity in 7+ days
      const isInactive = !lastActivity || lastActivity < sevenDaysAgo;
      if (isInactive) risks.push("inactive");

      // Risk: Progress < 30% (and enrolled for more than 14 days)
      const enrolledDays = (now.getTime() - enrollment.createdAt.getTime()) / (24 * 60 * 60 * 1000);
      if (progressPct < 30 && enrolledDays > 14) risks.push("low_progress");

      // Risk: Missed assignments
      const missedCount = overdueAssignments
        .filter((a) => a.courseId === enrollment.courseId)
        .filter((a) => !submittedSet.has(`${enrollment.userId}-${a.id}`))
        .length;
      if (missedCount > 0) risks.push("missed_assignments");

      if (risks.length === 0) continue;

      // Apply filter if specified
      if (riskFilter) {
        if (riskFilter === "inactive" && !risks.includes("inactive")) continue;
        if (riskFilter === "failing" && !risks.includes("low_progress")) continue;
        if (riskFilter === "missed" && !risks.includes("missed_assignments")) continue;
      }

      atRiskStudents.push({
        userId: enrollment.userId,
        user: enrollment.user,
        courseId: enrollment.courseId,
        courseName: courseMap.get(enrollment.courseId) || "Unknown",
        risks,
        riskScore: risks.length,
        lastActivity: lastActivity?.toISOString() || null,
        progressPercent: progressPct,
        missedAssignments: missedCount,
        createdAt: enrollment.createdAt.toISOString(),
      });
    }

    // Sort by risk score (highest first)
    atRiskStudents.sort((a, b) => b.riskScore - a.riskScore);

    return NextResponse.json({
      students: atRiskStudents,
      summary: {
        total: atRiskStudents.length,
        inactive: atRiskStudents.filter((s) => s.risks.includes("inactive")).length,
        lowProgress: atRiskStudents.filter((s) => s.risks.includes("low_progress")).length,
        missedAssignments: atRiskStudents.filter((s) => s.risks.includes("missed_assignments")).length,
      },
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        atRiskCount: atRiskStudents.filter((s) => s.courseId === c.id).length,
      })),
    });
  } catch (error) {
    console.error("Error fetching at-risk students:", error);
    return NextResponse.json({ message: "Failed to fetch at-risk data" }, { status: 500 });
  }
}
