import { db } from "@/lib/db";

/**
 * Report generation utilities for CiviLabs LMS
 */

export interface ReportConfig {
  type: "enrollments" | "progress" | "users" | "courses" | "quiz-results";
  startDate?: Date;
  endDate?: Date;
  courseId?: string;
  userId?: string;
}

export interface EnrollmentReport {
  studentName: string;
  studentEmail: string;
  courseName: string;
  enrolledAt: Date;
  completedAt: Date | null;
  progressPercentage: number;
}

export interface ProgressReport {
  studentName: string;
  courseName: string;
  chapterName: string;
  lessonName: string;
  completedAt: Date | null;
}

export interface QuizResultReport {
  studentName: string;
  studentEmail: string;
  courseName: string;
  quizName: string;
  score: number;
  passed: boolean;
  attemptedAt: Date;
}

/**
 * Generate enrollment report
 */
export async function generateEnrollmentReport(
  config: Omit<ReportConfig, "type">
): Promise<EnrollmentReport[]> {
  const where: Record<string, unknown> = {};

  if (config.startDate) {
    where.createdAt = { gte: config.startDate };
  }
  if (config.endDate) {
    where.createdAt = { ...((where.createdAt as object) || {}), lte: config.endDate };
  }
  if (config.courseId) {
    where.courseId = config.courseId;
  }
  if (config.userId) {
    where.userId = config.userId;
  }

  const enrollments = await db.enrollment.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      course: {
        select: {
          title: true,
          chapters: {
            include: {
              lessons: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const reports: EnrollmentReport[] = [];

  for (const enrollment of enrollments) {
    // Calculate progress for this enrollment
    const totalLessons = enrollment.course.chapters.reduce(
      (sum, ch) => sum + ch.lessons.length,
      0
    );

    const completedLessons = await db.userProgress.count({
      where: {
        userId: enrollment.userId,
        isCompleted: true,
        lesson: {
          chapter: { courseId: enrollment.courseId },
        },
      },
    });

    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    reports.push({
      studentName: enrollment.user.name || "Unknown",
      studentEmail: enrollment.user.email || "Unknown",
      courseName: enrollment.course.title,
      enrolledAt: enrollment.createdAt,
      completedAt: enrollment.completedAt,
      progressPercentage,
    });
  }

  return reports;
}

/**
 * Generate progress report
 */
export async function generateProgressReport(
  config: Omit<ReportConfig, "type">
): Promise<ProgressReport[]> {
  const where: Record<string, unknown> = {};

  if (config.userId) {
    where.userId = config.userId;
  }
  if (config.courseId) {
    where.lesson = { chapter: { courseId: config.courseId } };
  }

  const progress = await db.userProgress.findMany({
    where,
    include: {
      user: { select: { name: true } },
      lesson: {
        select: {
          title: true,
          chapter: {
            select: {
              title: true,
              course: { select: { title: true } },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return progress.map((p) => ({
    studentName: p.user.name || "Unknown",
    courseName: p.lesson.chapter.course.title,
    chapterName: p.lesson.chapter.title,
    lessonName: p.lesson.title,
    completedAt: p.isCompleted ? p.updatedAt : null,
  }));
}

/**
 * Generate quiz results report
 */
export async function generateQuizResultReport(
  config: Omit<ReportConfig, "type">
): Promise<QuizResultReport[]> {
  const where: Record<string, unknown> = {};

  if (config.startDate) {
    where.completedAt = { gte: config.startDate };
  }
  if (config.endDate) {
    where.completedAt = { ...((where.completedAt as object) || {}), lte: config.endDate };
  }
  if (config.userId) {
    where.userId = config.userId;
  }
  if (config.courseId) {
    where.quiz = { chapter: { courseId: config.courseId } };
  }

  const attempts = await db.quizAttempt.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      quiz: {
        select: {
          title: true,
          passingScore: true,
          chapter: {
            select: {
              course: { select: { title: true } },
            },
          },
        },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  return attempts.map((a) => ({
    studentName: a.user.name || "Unknown",
    studentEmail: a.user.email || "Unknown",
    courseName: a.quiz.chapter.course.title,
    quizName: a.quiz.title,
    score: a.score,
    passed: a.passed,
    attemptedAt: a.completedAt,
  }));
}

/**
 * Generate users report
 */
export async function generateUsersReport(
  config: Omit<ReportConfig, "type">
) {
  const where: Record<string, unknown> = {};

  if (config.startDate) {
    where.createdAt = { gte: config.startDate };
  }
  if (config.endDate) {
    where.createdAt = { ...((where.createdAt as object) || {}), lte: config.endDate };
  }

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name || "Unknown",
    email: u.email || "Unknown",
    role: u.role,
    createdAt: u.createdAt,
    verified: !!u.emailVerified,
    enrollmentsCount: u._count.enrollments,
  }));
}

/**
 * Generate courses report
 */
export async function generateCoursesReport() {
  const courses = await db.course.findMany({
    include: {
      instructor: { select: { name: true } },
      category: { select: { name: true } },
      _count: {
        select: {
          enrollments: true,
          chapters: true,
        },
      },
      enrollments: {
        select: { completedAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return courses.map((c) => {
    const completions = c.enrollments.filter((e) => e.completedAt).length;
    const completionRate =
      c._count.enrollments > 0
        ? Math.round((completions / c._count.enrollments) * 100)
        : 0;

    return {
      id: c.id,
      title: c.title,
      instructor: c.instructor.name || "Unknown",
      category: c.category?.name || "Uncategorized",
      isPublished: c.isPublished,
      createdAt: c.createdAt,
      chaptersCount: c._count.chapters,
      enrollmentsCount: c._count.enrollments,
      completionsCount: completions,
      completionRate,
    };
  });
}

/**
 * Convert report data to CSV format
 */
export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers?: string[]
): string {
  if (data.length === 0) return "";

  const keys = headers || Object.keys(data[0]);

  const csvRows = [
    keys.join(","),
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          if (value === null || value === undefined) return "";
          if (value instanceof Date) return value.toISOString();
          if (typeof value === "string") {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(",")
    ),
  ];

  return csvRows.join("\n");
}
