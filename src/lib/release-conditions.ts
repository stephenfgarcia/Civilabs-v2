import { db } from "@/lib/db";

interface ConditionValue {
  date?: string;
  lessonId?: string;
  chapterId?: string;
  assessmentId?: string;
  minScore?: number;
  assignmentId?: string;
}

/**
 * Evaluates release conditions for a specific content item.
 * Returns true if all conditions are met (content is accessible).
 */
export async function evaluateReleaseConditions(
  userId: string,
  courseId: string,
  targetType: string,
  targetId: string
): Promise<{ accessible: boolean; reasons: string[] }> {
  const conditions = await db.releaseCondition.findMany({
    where: { courseId, targetType, targetId },
    orderBy: { position: "asc" },
  });

  // No conditions = always accessible
  if (conditions.length === 0) {
    return { accessible: true, reasons: [] };
  }

  const results: { met: boolean; reason: string; operator: string }[] = [];

  for (const condition of conditions) {
    const value = condition.conditionValue as unknown as ConditionValue;
    let met = false;
    let reason = "";

    switch (condition.conditionType) {
      case "DATE_AFTER": {
        if (value.date) {
          met = new Date() >= new Date(value.date);
          reason = `Available after ${new Date(value.date).toLocaleDateString()}`;
        }
        break;
      }

      case "LESSON_COMPLETED": {
        if (value.lessonId) {
          const progress = await db.userProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId: value.lessonId } },
          });
          met = progress?.isCompleted === true;
          reason = "Complete required lesson first";
        }
        break;
      }

      case "CHAPTER_COMPLETED": {
        if (value.chapterId) {
          const lessons = await db.lesson.findMany({
            where: { chapterId: value.chapterId },
            select: { id: true },
          });
          if (lessons.length > 0) {
            const progress = await db.userProgress.findMany({
              where: { userId, lessonId: { in: lessons.map((l) => l.id) }, isCompleted: true },
            });
            met = progress.length >= lessons.length;
          } else {
            met = true; // Empty chapter = completed
          }
          reason = "Complete required chapter first";
        }
        break;
      }

      case "ASSESSMENT_PASSED": {
        if (value.assessmentId) {
          const attempt = await db.quizAttempt.findFirst({
            where: { userId, quizId: value.assessmentId, passed: true },
          });
          met = attempt !== null;
          reason = "Pass required assessment first";
        }
        break;
      }

      case "ASSESSMENT_SCORE_ABOVE": {
        if (value.assessmentId && value.minScore !== undefined) {
          const attempt = await db.quizAttempt.findFirst({
            where: { userId, quizId: value.assessmentId, score: { gte: value.minScore } },
          });
          met = attempt !== null;
          reason = `Score ${value.minScore}% or higher on assessment`;
        }
        break;
      }

      case "ASSIGNMENT_SUBMITTED": {
        if (value.assignmentId) {
          const submission = await db.assignmentSubmission.findFirst({
            where: { userId, assignmentId: value.assignmentId, status: { in: ["SUBMITTED", "GRADED"] } },
          });
          met = submission !== null;
          reason = "Submit required assignment first";
        }
        break;
      }

      case "ASSIGNMENT_GRADED": {
        if (value.assignmentId) {
          const submission = await db.assignmentSubmission.findFirst({
            where: { userId, assignmentId: value.assignmentId, status: "GRADED" },
          });
          met = submission !== null;
          reason = "Assignment must be graded first";
        }
        break;
      }
    }

    results.push({ met, reason, operator: condition.operator });
  }

  // Evaluate AND/OR logic
  // Group by operator: all AND conditions must be met, at least one OR condition must be met
  const andConditions = results.filter((r) => r.operator === "AND");
  const orConditions = results.filter((r) => r.operator === "OR");

  const andMet = andConditions.length === 0 || andConditions.every((r) => r.met);
  const orMet = orConditions.length === 0 || orConditions.some((r) => r.met);

  const accessible = andMet && orMet;
  const reasons = results.filter((r) => !r.met).map((r) => r.reason);

  return { accessible, reasons };
}

/**
 * Check if content is within its availability window (date-based scheduling).
 */
export function checkAvailabilityWindow(
  availableFrom: Date | null | undefined,
  availableUntil: Date | null | undefined
): { available: boolean; reason?: string } {
  const now = new Date();

  if (availableFrom && now < availableFrom) {
    return {
      available: false,
      reason: `Available from ${availableFrom.toLocaleDateString()}`,
    };
  }

  if (availableUntil && now > availableUntil) {
    return {
      available: false,
      reason: `No longer available (ended ${availableUntil.toLocaleDateString()})`,
    };
  }

  return { available: true };
}
