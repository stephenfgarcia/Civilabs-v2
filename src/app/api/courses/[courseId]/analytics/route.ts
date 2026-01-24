import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/courses/[courseId]/analytics - Course analytics data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    // Only instructor or admin
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, title: true },
    });
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }
    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "overview";

    switch (type) {
      case "enrollment-trends":
        return NextResponse.json(await getEnrollmentTrends(courseId));
      case "grade-distribution":
        return NextResponse.json(await getGradeDistribution(courseId));
      case "item-analysis":
        return NextResponse.json(await getItemAnalysis(courseId));
      case "time-on-task":
        return NextResponse.json(await getTimeOnTask(courseId));
      case "completion-rates":
        return NextResponse.json(await getCompletionRates(courseId));
      case "overview":
      default:
        return NextResponse.json(await getOverview(courseId));
    }
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ message: "Failed to fetch analytics" }, { status: 500 });
  }
}

async function getOverview(courseId: string) {
  const [enrollmentCount, completionCount, avgGrade, activeStudents] = await Promise.all([
    db.enrollment.count({ where: { courseId } }),
    db.enrollment.count({ where: { courseId, completedAt: { not: null } } }),
    db.assignmentSubmission.aggregate({
      where: { assignment: { courseId }, grade: { not: null } },
      _avg: { grade: true },
    }),
    db.userActivity.groupBy({
      by: ["userId"],
      where: {
        courseId,
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return {
    totalEnrollments: enrollmentCount,
    completions: completionCount,
    completionRate: enrollmentCount > 0 ? Math.round((completionCount / enrollmentCount) * 100) : 0,
    averageGrade: avgGrade._avg.grade ? Math.round(avgGrade._avg.grade * 10) / 10 : null,
    activeStudentsLast7Days: activeStudents.length,
  };
}

async function getEnrollmentTrends(courseId: string) {
  // Get enrollments grouped by day for the last 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const enrollments = await db.enrollment.findMany({
    where: { courseId, createdAt: { gte: ninetyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dailyCounts: Record<string, number> = {};
  let cumulative = await db.enrollment.count({
    where: { courseId, createdAt: { lt: ninetyDaysAgo } },
  });

  for (const enrollment of enrollments) {
    const date = enrollment.createdAt.toISOString().split("T")[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  }

  // Fill in gaps and build cumulative
  const trends = [];
  const current = new Date(ninetyDaysAgo);
  while (current <= new Date()) {
    const dateStr = current.toISOString().split("T")[0];
    const dailyNew = dailyCounts[dateStr] || 0;
    cumulative += dailyNew;
    trends.push({ date: dateStr, new: dailyNew, total: cumulative });
    current.setDate(current.getDate() + 1);
  }

  return trends;
}

async function getGradeDistribution(courseId: string) {
  // Get all graded submissions
  const submissions = await db.assignmentSubmission.findMany({
    where: {
      assignment: { courseId },
      grade: { not: null },
      status: "GRADED",
    },
    select: {
      grade: true,
      assignment: { select: { id: true, title: true, points: true } },
    },
  });

  // Also get quiz attempts
  const quizAttempts = await db.quizAttempt.findMany({
    where: {
      quiz: { chapter: { courseId } },
    },
    select: {
      score: true,
      quiz: { select: { id: true, title: true } },
    },
  });

  // Build distribution buckets (0-10, 10-20, ..., 90-100)
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${(i + 1) * 10}`,
    min: i * 10,
    max: (i + 1) * 10,
    count: 0,
  }));

  // Process assignment grades
  for (const sub of submissions) {
    if (sub.grade !== null && sub.assignment.points > 0) {
      const pct = (sub.grade / sub.assignment.points) * 100;
      const bucketIdx = Math.min(Math.floor(pct / 10), 9);
      buckets[bucketIdx].count++;
    }
  }

  // Process quiz scores
  for (const attempt of quizAttempts) {
    if (attempt.score !== null) {
      const bucketIdx = Math.min(Math.floor(attempt.score / 10), 9);
      buckets[bucketIdx].count++;
    }
  }

  // Per-assignment distributions
  const assignmentDistributions = [];
  const assignmentMap = new Map<string, { title: string; points: number; grades: number[] }>();

  for (const sub of submissions) {
    if (sub.grade === null) continue;
    if (!assignmentMap.has(sub.assignment.id)) {
      assignmentMap.set(sub.assignment.id, {
        title: sub.assignment.title,
        points: sub.assignment.points,
        grades: [],
      });
    }
    assignmentMap.get(sub.assignment.id)!.grades.push(sub.grade);
  }

  for (const [id, data] of assignmentMap) {
    const grades = data.grades;
    const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
    const pctGrades = grades.map((g) => (g / data.points) * 100);
    assignmentDistributions.push({
      id,
      title: data.title,
      count: grades.length,
      average: Math.round(avg * 10) / 10,
      averagePercent: Math.round((avg / data.points) * 1000) / 10,
      min: Math.min(...pctGrades),
      max: Math.max(...pctGrades),
    });
  }

  return { buckets, assignmentDistributions };
}

async function getItemAnalysis(courseId: string) {
  // Get quiz questions with attempt data
  const questions = await db.question.findMany({
    where: { quiz: { chapter: { courseId } } },
    select: {
      id: true,
      text: true,
      type: true,
      points: true,
      quiz: { select: { title: true } },
    },
  });

  // Get all quiz attempts for this course
  const attempts = await db.quizAttempt.findMany({
    where: { quiz: { chapter: { courseId } } },
    select: { answers: true, score: true },
  });

  // Build per-question success rates
  const questionStats: Record<string, { correct: number; total: number }> = {};
  for (const q of questions) {
    questionStats[q.id] = { correct: 0, total: 0 };
  }

  for (const attempt of attempts) {
    const answers = attempt.answers as Record<string, { isCorrect?: boolean }> | null;
    if (!answers) continue;
    for (const [qId, answer] of Object.entries(answers)) {
      if (questionStats[qId]) {
        questionStats[qId].total++;
        if (answer.isCorrect) questionStats[qId].correct++;
      }
    }
  }

  const items = questions.map((q) => {
    const stats = questionStats[q.id];
    const successRate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return {
      id: q.id,
      text: q.text.substring(0, 80),
      type: q.type,
      quizTitle: q.quiz?.title || "Unknown Quiz",
      attempts: stats.total,
      successRate,
      difficulty: successRate > 80 ? "Easy" : successRate > 50 ? "Medium" : "Hard",
    };
  });

  return items.sort((a, b) => a.successRate - b.successRate);
}

async function getTimeOnTask(courseId: string) {
  // Get telemetry data grouped by lesson
  const activities = await db.userActivity.findMany({
    where: { courseId, eventType: "VIEW" },
    select: { lessonId: true, userId: true, timestamp: true },
    orderBy: { timestamp: "asc" },
  });

  // Calculate time per lesson (approximate from VIEW events)
  const lessonTimeMap = new Map<string, { totalMinutes: number; viewers: Set<string> }>();

  // Group activities by user+lesson sessions
  const userSessions = new Map<string, Date[]>();
  for (const activity of activities) {
    if (!activity.lessonId) continue;
    const key = `${activity.userId}-${activity.lessonId}`;
    if (!userSessions.has(key)) userSessions.set(key, []);
    userSessions.get(key)!.push(activity.timestamp);
  }

  // Estimate time: gap between first and last event per session (cap at 30min)
  for (const [key, timestamps] of userSessions) {
    const lessonId = key.split("-").slice(1).join("-");
    if (!lessonTimeMap.has(lessonId)) {
      lessonTimeMap.set(lessonId, { totalMinutes: 0, viewers: new Set() });
    }
    const entry = lessonTimeMap.get(lessonId)!;
    const userId = key.split("-")[0];
    entry.viewers.add(userId);

    if (timestamps.length >= 2) {
      const duration = (timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime()) / 60000;
      entry.totalMinutes += Math.min(duration, 30); // Cap at 30 min
    } else {
      entry.totalMinutes += 2; // Assume 2 min for single view
    }
  }

  // Get lesson titles
  const lessonIds = Array.from(lessonTimeMap.keys());
  const lessons = await db.lesson.findMany({
    where: { id: { in: lessonIds } },
    select: { id: true, title: true, type: true },
  });

  const lessonTitleMap = new Map(lessons.map((l) => [l.id, l]));

  return Array.from(lessonTimeMap.entries())
    .map(([lessonId, data]) => ({
      lessonId,
      title: lessonTitleMap.get(lessonId)?.title || "Unknown",
      type: lessonTitleMap.get(lessonId)?.type || "TEXT",
      avgMinutes: data.viewers.size > 0 ? Math.round(data.totalMinutes / data.viewers.size) : 0,
      totalViewers: data.viewers.size,
    }))
    .sort((a, b) => b.avgMinutes - a.avgMinutes)
    .slice(0, 20);
}

async function getCompletionRates(courseId: string) {
  // Chapter-level completion rates
  const chapters = await db.chapter.findMany({
    where: { courseId, isPublished: true },
    select: { id: true, title: true, position: true },
    orderBy: { position: "asc" },
  });

  const totalStudents = await db.enrollment.count({ where: { courseId } });

  const results = [];
  for (const chapter of chapters) {
    const lessons = await db.lesson.findMany({
      where: { chapterId: chapter.id },
      select: { id: true },
    });

    if (lessons.length === 0) {
      results.push({ ...chapter, completionRate: 0, completedStudents: 0, totalStudents });
      continue;
    }

    // Students who completed ALL lessons in this chapter
    const lessonIds = lessons.map((l) => l.id);
    const completions = await db.userProgress.groupBy({
      by: ["userId"],
      where: {
        lessonId: { in: lessonIds },
        isCompleted: true,
      },
      having: {
        lessonId: { _count: { equals: lessons.length } },
      },
    });

    results.push({
      ...chapter,
      completionRate: totalStudents > 0 ? Math.round((completions.length / totalStudents) * 100) : 0,
      completedStudents: completions.length,
      totalStudents,
    });
  }

  return results;
}
