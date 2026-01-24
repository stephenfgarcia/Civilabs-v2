import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/analytics/platform - Platform-wide analytics (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "overview";

    switch (type) {
      case "user-growth":
        return NextResponse.json(await getUserGrowth());
      case "course-stats":
        return NextResponse.json(await getCourseStats());
      case "enrollment-trends":
        return NextResponse.json(await getPlatformEnrollmentTrends());
      case "activity-summary":
        return NextResponse.json(await getActivitySummary());
      case "overview":
      default:
        return NextResponse.json(await getPlatformOverview());
    }
  } catch (error) {
    console.error("Error fetching platform analytics:", error);
    return NextResponse.json({ message: "Failed to fetch analytics" }, { status: 500 });
  }
}

async function getPlatformOverview() {
  const [
    totalUsers,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    completedEnrollments,
    newUsersThisMonth,
    activeUsersThisWeek,
    totalSubmissions,
  ] = await Promise.all([
    db.user.count(),
    db.course.count(),
    db.course.count({ where: { isPublished: true } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { completedAt: { not: null } } }),
    db.user.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    db.userActivity.groupBy({
      by: ["userId"],
      where: { timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    db.assignmentSubmission.count({ where: { status: "SUBMITTED" } }),
  ]);

  // Role distribution
  const roleDistribution = await db.user.groupBy({
    by: ["role"],
    _count: { id: true },
  });

  return {
    totalUsers,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    completedEnrollments,
    completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0,
    newUsersThisMonth,
    activeUsersThisWeek: activeUsersThisWeek.length,
    totalSubmissions,
    roleDistribution: roleDistribution.map((r) => ({
      role: r.role,
      count: r._count.id,
    })),
  };
}

async function getUserGrowth() {
  // User signups by day for the last 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const users = await db.user.findMany({
    where: { createdAt: { gte: ninetyDaysAgo } },
    select: { createdAt: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dailyCounts: Record<string, { students: number; instructors: number; admins: number }> = {};

  for (const user of users) {
    const date = user.createdAt.toISOString().split("T")[0];
    if (!dailyCounts[date]) dailyCounts[date] = { students: 0, instructors: 0, admins: 0 };
    if (user.role === "STUDENT") dailyCounts[date].students++;
    else if (user.role === "INSTRUCTOR") dailyCounts[date].instructors++;
    else dailyCounts[date].admins++;
  }

  // Fill gaps
  const baseCounts = await db.user.groupBy({
    by: ["role"],
    where: { createdAt: { lt: ninetyDaysAgo } },
    _count: { id: true },
  });

  let cumStudents = baseCounts.find((r) => r.role === "STUDENT")?._count.id || 0;
  let cumInstructors = baseCounts.find((r) => r.role === "INSTRUCTOR")?._count.id || 0;
  let cumAdmins = baseCounts.find((r) => r.role === "ADMIN")?._count.id || 0;

  const trends = [];
  const current = new Date(ninetyDaysAgo);
  while (current <= new Date()) {
    const dateStr = current.toISOString().split("T")[0];
    const daily = dailyCounts[dateStr] || { students: 0, instructors: 0, admins: 0 };
    cumStudents += daily.students;
    cumInstructors += daily.instructors;
    cumAdmins += daily.admins;
    trends.push({
      date: dateStr,
      newUsers: daily.students + daily.instructors + daily.admins,
      totalUsers: cumStudents + cumInstructors + cumAdmins,
      students: cumStudents,
      instructors: cumInstructors,
    });
    current.setDate(current.getDate() + 1);
  }

  return trends;
}

async function getCourseStats() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: true,
          chapters: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get completion counts
  const courseStats = await Promise.all(
    courses.map(async (course) => {
      const completions = await db.enrollment.count({
        where: { courseId: course.id, completedAt: { not: null } },
      });
      return {
        id: course.id,
        title: course.title,
        enrollments: course._count.enrollments,
        chapters: course._count.chapters,
        completions,
        completionRate: course._count.enrollments > 0
          ? Math.round((completions / course._count.enrollments) * 100)
          : 0,
        createdAt: course.createdAt,
      };
    })
  );

  return courseStats;
}

async function getPlatformEnrollmentTrends() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const enrollments = await db.enrollment.findMany({
    where: { createdAt: { gte: ninetyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyCounts: Record<string, number> = {};
  for (const e of enrollments) {
    const date = e.createdAt.toISOString().split("T")[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  }

  let cumulative = await db.enrollment.count({
    where: { createdAt: { lt: ninetyDaysAgo } },
  });

  const trends = [];
  const current = new Date(ninetyDaysAgo);
  while (current <= new Date()) {
    const dateStr = current.toISOString().split("T")[0];
    const daily = dailyCounts[dateStr] || 0;
    cumulative += daily;
    trends.push({ date: dateStr, new: daily, total: cumulative });
    current.setDate(current.getDate() + 1);
  }

  return trends;
}

async function getActivitySummary() {
  // Activity by hour (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const activities = await db.userActivity.findMany({
    where: { timestamp: { gte: thirtyDaysAgo } },
    select: { timestamp: true, eventType: true },
  });

  // Build heatmap: day of week × hour
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const activity of activities) {
    const day = activity.timestamp.getDay(); // 0=Sun, 6=Sat
    const hour = activity.timestamp.getHours();
    heatmap[day][hour]++;
  }

  // Event type breakdown
  const eventTypes: Record<string, number> = {};
  for (const activity of activities) {
    eventTypes[activity.eventType] = (eventTypes[activity.eventType] || 0) + 1;
  }

  return {
    heatmap,
    eventTypes: Object.entries(eventTypes).map(([type, count]) => ({ type, count })),
    totalActivities: activities.length,
  };
}
