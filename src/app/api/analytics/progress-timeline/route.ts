import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/analytics/progress-timeline - Student's progress timeline
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const userId = searchParams.get("userId");

    // Determine which user to query
    const targetUserId = userId && (session.user.role === "INSTRUCTOR" || session.user.role === "ADMIN")
      ? userId
      : session.user.id;

    // Get course filter
    const courseFilter = courseId
      ? { courseId }
      : {};

    // If requesting for a specific course and user is instructor, verify ownership
    if (userId && userId !== session.user.id && courseId) {
      const course = await db.course.findFirst({
        where: { id: courseId, instructorId: session.user.id },
      });
      if (!course && session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    // Get all enrollments for the user
    const enrollments = await db.enrollment.findMany({
      where: { userId: targetUserId, ...courseFilter },
      select: { courseId: true, createdAt: true, completedAt: true, course: { select: { title: true } } },
    });

    const courseIds = enrollments.map((e) => e.courseId);

    // Get completed lessons with timestamps
    const completedLessons = await db.userProgress.findMany({
      where: {
        userId: targetUserId,
        isCompleted: true,
        lesson: { chapter: { courseId: { in: courseIds } } },
      },
      select: {
        completedAt: true,
        lesson: {
          select: {
            title: true,
            type: true,
            chapter: { select: { title: true, courseId: true } },
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Get quiz attempts
    const quizAttempts = await db.quizAttempt.findMany({
      where: {
        userId: targetUserId,
        quiz: { chapter: { courseId: { in: courseIds } } },
      },
      select: {
        completedAt: true,
        score: true,
        passed: true,
        quiz: {
          select: {
            title: true,
            chapter: { select: { courseId: true } },
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Get assignment submissions
    const submissions = await db.assignmentSubmission.findMany({
      where: {
        userId: targetUserId,
        assignment: { courseId: { in: courseIds } },
        status: { not: "DRAFT" },
      },
      select: {
        submittedAt: true,
        grade: true,
        status: true,
        assignment: {
          select: {
            title: true,
            points: true,
            courseId: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    // Build unified timeline
    const timeline: {
      date: string;
      type: string;
      title: string;
      courseTitle: string;
      details?: string;
    }[] = [];

    // Add lesson completions
    for (const p of completedLessons) {
      if (!p.completedAt) continue;
      const courseTitle = enrollments.find((e) => e.courseId === p.lesson.chapter.courseId)?.course.title || "";
      timeline.push({
        date: p.completedAt.toISOString(),
        type: "lesson",
        title: `Completed: ${p.lesson.title}`,
        courseTitle,
        details: `${p.lesson.chapter.title} • ${p.lesson.type}`,
      });
    }

    // Add quiz attempts
    for (const a of quizAttempts) {
      const courseTitle = enrollments.find((e) => e.courseId === a.quiz.chapter.courseId)?.course.title || "";
      timeline.push({
        date: a.completedAt.toISOString(),
        type: a.passed ? "quiz_passed" : "quiz_failed",
        title: `${a.passed ? "Passed" : "Attempted"}: ${a.quiz.title}`,
        courseTitle,
        details: `Score: ${a.score}%`,
      });
    }

    // Add submissions
    for (const s of submissions) {
      if (!s.submittedAt) continue;
      const courseTitle = enrollments.find((e) => e.courseId === s.assignment.courseId)?.course.title || "";
      timeline.push({
        date: s.submittedAt.toISOString(),
        type: s.status === "GRADED" ? "submission_graded" : "submission",
        title: `Submitted: ${s.assignment.title}`,
        courseTitle,
        details: s.grade !== null ? `Grade: ${s.grade}/${s.assignment.points}` : s.status,
      });
    }

    // Add enrollment events
    for (const e of enrollments) {
      timeline.push({
        date: e.createdAt.toISOString(),
        type: "enrollment",
        title: `Enrolled in ${e.course.title}`,
        courseTitle: e.course.title,
      });
      if (e.completedAt) {
        timeline.push({
          date: e.completedAt.toISOString(),
          type: "course_completed",
          title: `Completed: ${e.course.title}`,
          courseTitle: e.course.title,
        });
      }
    }

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(timeline.slice(0, 50));
  } catch (error) {
    console.error("Error fetching progress timeline:", error);
    return NextResponse.json({ message: "Failed to fetch timeline" }, { status: 500 });
  }
}
