import { db } from "@/lib/db";
import { NotificationType, Prisma } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  metadata,
}: CreateNotificationParams) {
  try {
    return await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

// Helper functions for common notification types

export async function notifyEnrollment(
  instructorId: string,
  studentName: string,
  courseName: string,
  courseId: string
) {
  return createNotification({
    userId: instructorId,
    type: "ENROLLMENT",
    title: "New Student Enrolled",
    message: `${studentName} has enrolled in your course "${courseName}"`,
    link: `/instructor/courses/${courseId}`,
    metadata: { courseId, studentName },
  });
}

export async function notifyCoursePublished(
  studentId: string,
  courseName: string,
  courseId: string
) {
  return createNotification({
    userId: studentId,
    type: "COURSE_PUBLISHED",
    title: "Course Now Available",
    message: `The course "${courseName}" is now published and ready to learn!`,
    link: `/courses/${courseId}`,
    metadata: { courseId },
  });
}

export async function notifyCertificateEarned(
  userId: string,
  courseName: string,
  certificateCode: string
) {
  return createNotification({
    userId,
    type: "CERTIFICATE_EARNED",
    title: "Certificate Earned!",
    message: `Congratulations! You've earned a certificate for completing "${courseName}"`,
    link: `/certificates/${certificateCode}`,
    metadata: { certificateCode, courseName },
  });
}

export async function notifyQuizResult(
  userId: string,
  passed: boolean,
  quizTitle: string,
  score: number,
  courseId: string,
  chapterId: string
) {
  return createNotification({
    userId,
    type: passed ? "QUIZ_PASSED" : "QUIZ_FAILED",
    title: passed ? "Quiz Passed!" : "Quiz Not Passed",
    message: passed
      ? `Great job! You scored ${score}% on "${quizTitle}"`
      : `You scored ${score}% on "${quizTitle}". Keep practicing!`,
    link: `/courses/${courseId}/learn?chapter=${chapterId}`,
    metadata: { courseId, chapterId, score, passed },
  });
}

export async function notifyForumReply(
  userId: string,
  replierName: string,
  threadTitle: string,
  categorySlug: string,
  threadId: string
) {
  return createNotification({
    userId,
    type: "FORUM_REPLY",
    title: "New Reply to Your Thread",
    message: `${replierName} replied to your thread "${threadTitle}"`,
    link: `/forums/${categorySlug}/${threadId}`,
    metadata: { threadId, replierName },
  });
}

export async function notifyCourseUpdate(
  userId: string,
  courseName: string,
  updateType: string,
  courseId: string
) {
  return createNotification({
    userId,
    type: "COURSE_UPDATE",
    title: "Course Updated",
    message: `New ${updateType} added to "${courseName}"`,
    link: `/courses/${courseId}`,
    metadata: { courseId, updateType },
  });
}

export async function notifyWelcome(userId: string, userName: string) {
  return createNotification({
    userId,
    type: "WELCOME",
    title: "Welcome to CiviLabs!",
    message: `Hi ${userName}! Welcome to CiviLabs LMS. Start exploring courses and begin your learning journey.`,
    link: "/courses",
  });
}

export async function notifyAnnouncement(
  userIds: string[],
  title: string,
  message: string,
  link?: string
) {
  const notifications = userIds.map((userId) => ({
    userId,
    type: "ANNOUNCEMENT" as NotificationType,
    title,
    message,
    link,
  }));

  try {
    return await db.notification.createMany({
      data: notifications,
    });
  } catch (error) {
    console.error("Failed to create announcements:", error);
    return null;
  }
}

// Get unread notification count for a user
export async function getUnreadCount(userId: string) {
  try {
    return await db.notification.count({
      where: { userId, read: false },
    });
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
}
