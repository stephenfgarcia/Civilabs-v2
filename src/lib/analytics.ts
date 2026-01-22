import { db } from "@/lib/db";

/**
 * Analytics utilities for CiviLabs LMS
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface CourseAnalytics {
  courseId: string;
  title: string;
  totalEnrollments: number;
  activeStudents: number;
  completionRate: number;
  averageProgress: number;
  averageQuizScore: number;
}

export interface UserAnalytics {
  userId: string;
  name: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  totalTimeSpent: number;
  averageQuizScore: number;
  lastActive: Date | null;
}

export interface PlatformAnalytics {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  averageCompletionRate: number;
  activeUsersLast7Days: number;
  activeUsersLast30Days: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
}

/**
 * Get platform-wide analytics
 */
export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    completedEnrollments,
    newUsersLast7Days,
    newUsersLast30Days,
    activeUsersLast7Days,
    activeUsersLast30Days,
  ] = await Promise.all([
    db.user.count(),
    db.course.count({ where: { isPublished: true } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { completedAt: { not: null } } }),
    db.user.count({ where: { createdAt: { gte: last7Days } } }),
    db.user.count({ where: { createdAt: { gte: last30Days } } }),
    db.userProgress.findMany({
      where: { updatedAt: { gte: last7Days } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    db.userProgress.findMany({
      where: { updatedAt: { gte: last30Days } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const averageCompletionRate =
    totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

  return {
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalCompletions: completedEnrollments,
    averageCompletionRate,
    activeUsersLast7Days: activeUsersLast7Days.length,
    activeUsersLast30Days: activeUsersLast30Days.length,
    newUsersLast7Days,
    newUsersLast30Days,
  };
}

/**
 * Get analytics for a specific course
 */
export async function getCourseAnalytics(courseId: string): Promise<CourseAnalytics | null> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });

  if (!course) return null;

  const [enrollments, lessons, progress, quizAttempts] = await Promise.all([
    db.enrollment.findMany({
      where: { courseId },
      select: {
        id: true,
        completedAt: true,
        updatedAt: true,
      },
    }),
    db.lesson.findMany({
      where: { chapter: { courseId } },
      select: { id: true },
    }),
    db.userProgress.findMany({
      where: {
        lesson: { chapter: { courseId } },
        isCompleted: true,
      },
    }),
    db.quizAttempt.findMany({
      where: { quiz: { chapter: { courseId } } },
      select: { score: true },
    }),
  ]);

  const totalLessons = lessons.length;
  const totalEnrollments = enrollments.length;

  // Calculate completion rate
  const completedEnrollments = enrollments.filter((e) => e.completedAt).length;
  const completionRate =
    totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  // Calculate active students (updated in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeStudents = enrollments.filter(
    (e) => e.updatedAt > thirtyDaysAgo
  ).length;

  // Calculate average progress
  const userProgressMap = new Map<string, Set<string>>();
  progress.forEach((p) => {
    if (!userProgressMap.has(p.userId)) {
      userProgressMap.set(p.userId, new Set());
    }
    userProgressMap.get(p.userId)!.add(p.lessonId);
  });

  let totalProgress = 0;
  userProgressMap.forEach((completedLessons) => {
    if (totalLessons > 0) {
      totalProgress += (completedLessons.size / totalLessons) * 100;
    }
  });
  const averageProgress =
    userProgressMap.size > 0 ? Math.round(totalProgress / userProgressMap.size) : 0;

  // Calculate average quiz score
  const averageQuizScore =
    quizAttempts.length > 0
      ? Math.round(
          quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length
        )
      : 0;

  return {
    courseId: course.id,
    title: course.title,
    totalEnrollments,
    activeStudents,
    completionRate,
    averageProgress,
    averageQuizScore,
  };
}

/**
 * Get enrollment trends over time
 */
export async function getEnrollmentTrends(
  days: number = 30
): Promise<{ date: string; count: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const enrollments = await db.enrollment.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const trendMap = new Map<string, number>();
  const currentDate = new Date(startDate);
  const endDate = new Date();

  while (currentDate <= endDate) {
    trendMap.set(currentDate.toISOString().split("T")[0], 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  enrollments.forEach((e) => {
    const date = e.createdAt.toISOString().split("T")[0];
    trendMap.set(date, (trendMap.get(date) || 0) + 1);
  });

  return Array.from(trendMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Get top performing courses
 */
export async function getTopCourses(
  limit: number = 5
): Promise<{ courseId: string; title: string; enrollments: number }[]> {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: {
      enrollments: {
        _count: "desc",
      },
    },
    take: limit,
  });

  return courses.map((c) => ({
    courseId: c.id,
    title: c.title,
    enrollments: c._count.enrollments,
  }));
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(
  userId: string
): Promise<UserAnalytics | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) return null;

  const [enrollments, completions, quizAttempts, latestProgress] = await Promise.all([
    db.enrollment.count({ where: { userId } }),
    db.enrollment.count({ where: { userId, completedAt: { not: null } } }),
    db.quizAttempt.findMany({
      where: { userId },
      select: { score: true },
    }),
    db.userProgress.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  const averageQuizScore =
    quizAttempts.length > 0
      ? Math.round(
          quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length
        )
      : 0;

  return {
    userId: user.id,
    name: user.name || "Unknown",
    coursesEnrolled: enrollments,
    coursesCompleted: completions,
    totalTimeSpent: 0, // Would need separate tracking
    averageQuizScore,
    lastActive: latestProgress?.updatedAt || null,
  };
}

/**
 * Get category distribution
 */
export async function getCategoryDistribution(): Promise<
  { categoryId: string; name: string; courseCount: number; enrollmentCount: number }[]
> {
  const categories = await db.category.findMany({
    include: {
      courses: {
        where: { isPublished: true },
        include: {
          _count: {
            select: { enrollments: true },
          },
        },
      },
    },
  });

  return categories.map((c) => ({
    categoryId: c.id,
    name: c.name,
    courseCount: c.courses.length,
    enrollmentCount: c.courses.reduce((sum, course) => sum + course._count.enrollments, 0),
  }));
}

/**
 * Get instructor analytics
 */
export async function getInstructorAnalytics(instructorId: string) {
  const courses = await db.course.findMany({
    where: { instructorId, isPublished: true },
    include: {
      _count: {
        select: { enrollments: true },
      },
      enrollments: {
        select: { completedAt: true },
      },
    },
  });

  const totalCourses = courses.length;
  const totalStudents = courses.reduce((sum, c) => sum + c._count.enrollments, 0);
  const totalCompletions = courses.reduce(
    (sum, c) => sum + c.enrollments.filter((e) => e.completedAt).length,
    0
  );

  const averageCompletionRate =
    totalStudents > 0 ? Math.round((totalCompletions / totalStudents) * 100) : 0;

  return {
    totalCourses,
    totalStudents,
    totalCompletions,
    averageCompletionRate,
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      enrollments: c._count.enrollments,
      completions: c.enrollments.filter((e) => e.completedAt).length,
    })),
  };
}
