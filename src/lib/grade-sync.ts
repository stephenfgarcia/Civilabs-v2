import { db } from "@/lib/db";

/**
 * Syncs a score from a quiz attempt or graded assignment to the gradebook.
 * Only operates if the course has autoGradeSync enabled and a matching GradeItem exists.
 *
 * If no matching GradeItem exists (referenceId not set up), this is a no-op.
 * If a StudentGrade already has an overrideScore, the auto-sync will not overwrite it.
 */
export async function syncGradeToGradebook({
  courseId,
  userId,
  referenceId,
  score,
  type,
}: {
  courseId: string;
  userId: string;
  referenceId: string; // quizId or assignmentId
  score: number; // Points earned
  type: "ASSESSMENT" | "ASSIGNMENT";
}): Promise<void> {
  try {
    // Check if course has auto-grade sync enabled
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { autoGradeSync: true },
    });

    if (!course?.autoGradeSync) return;

    // Find matching grade item by referenceId and type
    const gradeItem = await db.gradeItem.findFirst({
      where: {
        referenceId,
        type,
        category: { courseId },
      },
    });

    if (!gradeItem) return;

    // Check if there's an existing override (don't overwrite instructor overrides)
    const existing = await db.studentGrade.findUnique({
      where: {
        gradeItemId_userId: {
          gradeItemId: gradeItem.id,
          userId,
        },
      },
    });

    if (existing?.overrideScore !== null && existing?.overrideScore !== undefined) {
      // Instructor has manually overridden — don't auto-sync
      return;
    }

    // Upsert the student grade
    await db.studentGrade.upsert({
      where: {
        gradeItemId_userId: {
          gradeItemId: gradeItem.id,
          userId,
        },
      },
      create: {
        gradeItemId: gradeItem.id,
        userId,
        score,
        gradedAt: new Date(),
      },
      update: {
        score,
        gradedAt: new Date(),
      },
    });
  } catch (error) {
    // Fire-and-forget: don't let sync failures break the primary flow
    console.error("Grade sync error:", error);
  }
}
