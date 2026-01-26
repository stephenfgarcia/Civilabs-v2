import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface TodoItem {
  id: string;
  type: "ASSIGNMENT" | "LESSON" | "QUIZ" | "COURSE";
  title: string;
  subtitle?: string;
  courseId: string;
  courseTitle: string;
  href: string;
  dueDate?: string;
  urgency: "OVERDUE" | "TODAY" | "THIS_WEEK" | "UPCOMING" | "NO_DEADLINE";
  progress?: number;
}

function getUrgency(dueDate: Date | null): TodoItem["urgency"] {
  if (!dueDate) return "NO_DEADLINE";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  if (dueDate < now) return "OVERDUE";
  if (dueDate < tomorrow) return "TODAY";
  if (dueDate < weekFromNow) return "THIS_WEEK";
  return "UPCOMING";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const todoItems: TodoItem[] = [];

    // Get enrolled courses
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            chapters: {
              where: { isPublished: true },
              include: {
                lessons: {
                  select: { id: true, title: true },
                  orderBy: { position: "asc" },
                },
                quiz: {
                  select: { id: true, title: true, passingScore: true },
                },
              },
              orderBy: { position: "asc" },
            },
            assignments: {
              where: { isPublished: true },
              select: {
                id: true,
                title: true,
                dueDate: true,
                points: true,
              },
            },
          },
        },
      },
    });

    const courseIds = enrollments.map((e) => e.courseId);

    // Get user progress for lessons
    const lessonProgress = await db.userProgress.findMany({
      where: {
        userId,
        isCompleted: true,
      },
      select: { lessonId: true },
    });
    const completedLessonIds = new Set(lessonProgress.map((p) => p.lessonId));

    // Get quiz attempts
    const quizAttempts = await db.quizAttempt.findMany({
      where: { userId },
      select: { quizId: true, passed: true },
    });
    const passedQuizIds = new Set(
      quizAttempts.filter((a) => a.passed).map((a) => a.quizId)
    );
    const attemptedQuizIds = new Set(quizAttempts.map((a) => a.quizId));

    // Get assignment submissions
    const submissions = await db.assignmentSubmission.findMany({
      where: {
        userId,
        assignment: { courseId: { in: courseIds } },
      },
      select: { assignmentId: true, status: true },
    });
    const submittedAssignmentIds = new Set(
      submissions
        .filter((s) => s.status === "SUBMITTED" || s.status === "GRADED")
        .map((s) => s.assignmentId)
    );

    for (const enrollment of enrollments) {
      const course = enrollment.course;
      const allLessons = course.chapters.flatMap((ch) => ch.lessons);
      const completedCount = allLessons.filter((l) =>
        completedLessonIds.has(l.id)
      ).length;
      const totalLessons = allLessons.length;
      const progressPercent =
        totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      // 1. Upcoming/overdue assignments (not submitted)
      for (const assignment of course.assignments) {
        if (!submittedAssignmentIds.has(assignment.id)) {
          const dueDate = assignment.dueDate
            ? new Date(assignment.dueDate)
            : null;
          const urgency = getUrgency(dueDate);

          // Only include if due soon or overdue
          if (urgency !== "UPCOMING" || dueDate) {
            todoItems.push({
              id: `assignment-${assignment.id}`,
              type: "ASSIGNMENT",
              title: assignment.title,
              subtitle: `${assignment.points} points`,
              courseId: course.id,
              courseTitle: course.title,
              href: `/courses/${course.id}/assignments/${assignment.id}`,
              dueDate: assignment.dueDate?.toISOString(),
              urgency,
            });
          }
        }
      }

      // 2. Failed quizzes that can be retried
      for (const chapter of course.chapters) {
        if (chapter.quiz) {
          const quizId = chapter.quiz.id;
          if (attemptedQuizIds.has(quizId) && !passedQuizIds.has(quizId)) {
            todoItems.push({
              id: `quiz-${quizId}`,
              type: "QUIZ",
              title: `Retry: ${chapter.quiz.title}`,
              subtitle: `Chapter: ${chapter.title}`,
              courseId: course.id,
              courseTitle: course.title,
              href: `/courses/${course.id}/learn`,
              urgency: "NO_DEADLINE",
            });
          }
        }
      }

      // 3. Next incomplete lesson (if course is in progress)
      if (progressPercent > 0 && progressPercent < 100) {
        const nextLesson = allLessons.find(
          (l) => !completedLessonIds.has(l.id)
        );
        if (nextLesson) {
          todoItems.push({
            id: `lesson-${nextLesson.id}`,
            type: "LESSON",
            title: nextLesson.title,
            subtitle: `Continue learning`,
            courseId: course.id,
            courseTitle: course.title,
            href: `/courses/${course.id}/learn?lesson=${nextLesson.id}`,
            urgency: "NO_DEADLINE",
            progress: progressPercent,
          });
        }
      }

      // 4. Unstarted enrolled courses
      if (progressPercent === 0 && totalLessons > 0) {
        todoItems.push({
          id: `course-${course.id}`,
          type: "COURSE",
          title: course.title,
          subtitle: `${totalLessons} lessons - Not started`,
          courseId: course.id,
          courseTitle: course.title,
          href: `/courses/${course.id}/learn`,
          urgency: "NO_DEADLINE",
          progress: 0,
        });
      }
    }

    // Sort by urgency priority
    const urgencyOrder: Record<TodoItem["urgency"], number> = {
      OVERDUE: 0,
      TODAY: 1,
      THIS_WEEK: 2,
      UPCOMING: 3,
      NO_DEADLINE: 4,
    };

    todoItems.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;

      // Within same urgency, sort by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

    return NextResponse.json(todoItems);
  } catch (error) {
    console.error("Error fetching student todo:", error);
    return NextResponse.json(
      { message: "Failed to fetch todo items" },
      { status: 500 }
    );
  }
}
