import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LessonViewer } from "@/components/learn/lesson-viewer";
import { CourseSidebar } from "@/components/learn/course-sidebar";
import { evaluateReleaseConditions } from "@/lib/release-conditions";

interface LearnPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}

async function getCourse(courseId: string) {
  return db.course.findUnique({
    where: {
      id: courseId,
      isPublished: true,
    },
    include: {
      chapters: {
        where: { isPublished: true },
        include: {
          lessons: {
            orderBy: { position: "asc" },
          },
          quiz: {
            include: {
              questions: {
                orderBy: { position: "asc" },
              },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });
}

async function getEnrollment(userId: string, courseId: string) {
  return db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });
}

async function getUserProgress(userId: string, lessonIds: string[]) {
  const progress = await db.userProgress.findMany({
    where: {
      userId,
      lessonId: { in: lessonIds },
      isCompleted: true,
    },
    select: { lessonId: true },
  });
  return new Set(progress.map((p) => p.lessonId));
}

async function getQuizAttempts(userId: string, quizIds: string[]) {
  const attempts = await db.quizAttempt.findMany({
    where: {
      userId,
      quizId: { in: quizIds },
      passed: true,
    },
    select: { quizId: true },
  });
  return new Set(attempts.map((a) => a.quizId));
}

async function isLessonBookmarked(userId: string, lessonId: string) {
  const bookmark = await db.bookmark.findUnique({
    where: {
      userId_lessonId: { userId, lessonId },
    },
    select: { id: true },
  });
  return !!bookmark;
}

export default async function LearnPage({ params, searchParams }: LearnPageProps) {
  const session = await auth();
  const { courseId } = await params;
  const { lesson: lessonId } = await searchParams;

  if (!session?.user) {
    redirect(`/login?callbackUrl=/courses/${courseId}/learn`);
  }

  const [course, enrollment] = await Promise.all([
    getCourse(courseId),
    getEnrollment(session.user.id, courseId),
  ]);

  if (!course) {
    notFound();
  }

  if (!enrollment) {
    redirect(`/courses/${courseId}`);
  }

  // Get all lesson IDs
  const allLessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const allLessonIds = allLessons.map((lesson) => lesson.id);
  const allQuizIds = course.chapters
    .filter((chapter) => chapter.quiz)
    .map((chapter) => chapter.quiz!.id);

  // Get user progress
  const [completedLessons, passedQuizzes] = await Promise.all([
    getUserProgress(session.user.id, allLessonIds),
    getQuizAttempts(session.user.id, allQuizIds),
  ]);

  // Evaluate release conditions for all content items
  const lockedItems = new Map<string, string[]>();
  const conditionChecks: Promise<void>[] = [];

  for (const chapter of course.chapters) {
    conditionChecks.push(
      evaluateReleaseConditions(session.user.id, courseId, "CHAPTER", chapter.id).then(
        (result) => {
          if (!result.accessible) {
            lockedItems.set(chapter.id, result.reasons);
          }
        }
      )
    );
    for (const lesson of chapter.lessons) {
      conditionChecks.push(
        evaluateReleaseConditions(session.user.id, courseId, "LESSON", lesson.id).then(
          (result) => {
            if (!result.accessible) {
              lockedItems.set(lesson.id, result.reasons);
            }
          }
        )
      );
    }
  }
  await Promise.all(conditionChecks);

  // Find current lesson
  let currentLesson = allLessons.find((l) => l.id === lessonId);
  if (!currentLesson && allLessons.length > 0) {
    // Find first incomplete lesson or first lesson
    currentLesson =
      allLessons.find((l) => !completedLessons.has(l.id)) || allLessons[0];
  }

  // Find current chapter
  const currentChapter = course.chapters.find((chapter) =>
    chapter.lessons.some((l) => l.id === currentLesson?.id)
  );

  // Calculate overall progress
  const totalItems = allLessonIds.length + allQuizIds.length;
  const completedItems = completedLessons.size + passedQuizzes.size;
  const progressPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Find next and previous lessons
  const currentLessonIndex = allLessons.findIndex(
    (l) => l.id === currentLesson?.id
  );
  const previousLesson =
    currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  // Check if current lesson is bookmarked
  const bookmarked = currentLesson
    ? await isLessonBookmarked(session.user.id, currentLesson.id)
    : false;

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -my-6">
      {/* Sidebar */}
      <CourseSidebar
        course={course}
        currentLessonId={currentLesson?.id}
        completedLessons={completedLessons}
        passedQuizzes={passedQuizzes}
        progressPercentage={progressPercentage}
        lockedItems={Object.fromEntries(lockedItems)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {currentLesson && currentChapter ? (
          <LessonViewer
            courseId={courseId}
            chapter={currentChapter}
            lesson={currentLesson}
            isCompleted={completedLessons.has(currentLesson.id)}
            isBookmarked={bookmarked}
            previousLesson={previousLesson}
            nextLesson={nextLesson}
            quiz={currentChapter.quiz}
            quizPassed={currentChapter.quiz ? passedQuizzes.has(currentChapter.quiz.id) : false}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No lessons available</p>
          </div>
        )}
      </div>
    </div>
  );
}
