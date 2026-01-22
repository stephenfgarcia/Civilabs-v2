import { db } from "@/lib/db";
import { AuditAction, Prisma } from "@prisma/client";
import { headers } from "next/headers";

export { AuditAction };

interface AuditLogOptions {
  action: AuditAction;
  userId?: string | null;
  targetId?: string | null;
  targetType?: string | null;
  details?: Record<string, unknown> | null;
  request?: Request | null;
}

/**
 * Get client information from request headers
 */
async function getClientInfo(): Promise<{ ipAddress: string; userAgent: string }> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";
    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: "unknown", userAgent: "unknown" };
  }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(options: AuditLogOptions): Promise<void> {
  try {
    const { ipAddress, userAgent } = await getClientInfo();

    await db.auditLog.create({
      data: {
        action: options.action,
        userId: options.userId || null,
        targetId: options.targetId || null,
        targetType: options.targetType || null,
        ipAddress,
        userAgent,
        details: options.details as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the app
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Helper functions for common audit actions
 */
export const audit = {
  // Authentication
  login: (userId: string, details?: Record<string, unknown>) =>
    createAuditLog({ action: AuditAction.LOGIN, userId, details }),

  logout: (userId: string) =>
    createAuditLog({ action: AuditAction.LOGOUT, userId }),

  loginFailed: (email: string, reason: string) =>
    createAuditLog({
      action: AuditAction.LOGIN_FAILED,
      details: { email, reason },
    }),

  passwordChange: (userId: string) =>
    createAuditLog({ action: AuditAction.PASSWORD_CHANGE, userId }),

  passwordResetRequest: (email: string) =>
    createAuditLog({
      action: AuditAction.PASSWORD_RESET_REQUEST,
      details: { email },
    }),

  // User Management
  userCreated: (userId: string, createdBy?: string) =>
    createAuditLog({
      action: AuditAction.USER_CREATED,
      userId: createdBy,
      targetId: userId,
      targetType: "User",
    }),

  userUpdated: (userId: string, updatedBy: string, changes: Record<string, unknown>) =>
    createAuditLog({
      action: AuditAction.USER_UPDATED,
      userId: updatedBy,
      targetId: userId,
      targetType: "User",
      details: { changes },
    }),

  userDeleted: (userId: string, deletedBy: string) =>
    createAuditLog({
      action: AuditAction.USER_DELETED,
      userId: deletedBy,
      targetId: userId,
      targetType: "User",
    }),

  roleChanged: (userId: string, changedBy: string, oldRole: string, newRole: string) =>
    createAuditLog({
      action: AuditAction.ROLE_CHANGED,
      userId: changedBy,
      targetId: userId,
      targetType: "User",
      details: { oldRole, newRole },
    }),

  // Course Management
  courseCreated: (courseId: string, userId: string, courseTitle: string) =>
    createAuditLog({
      action: AuditAction.COURSE_CREATED,
      userId,
      targetId: courseId,
      targetType: "Course",
      details: { title: courseTitle },
    }),

  courseUpdated: (courseId: string, userId: string, changes: Record<string, unknown>) =>
    createAuditLog({
      action: AuditAction.COURSE_UPDATED,
      userId,
      targetId: courseId,
      targetType: "Course",
      details: { changes },
    }),

  courseDeleted: (courseId: string, userId: string, courseTitle: string) =>
    createAuditLog({
      action: AuditAction.COURSE_DELETED,
      userId,
      targetId: courseId,
      targetType: "Course",
      details: { title: courseTitle },
    }),

  coursePublished: (courseId: string, userId: string, courseTitle: string) =>
    createAuditLog({
      action: AuditAction.COURSE_PUBLISHED,
      userId,
      targetId: courseId,
      targetType: "Course",
      details: { title: courseTitle },
    }),

  courseUnpublished: (courseId: string, userId: string, courseTitle: string) =>
    createAuditLog({
      action: AuditAction.COURSE_UNPUBLISHED,
      userId,
      targetId: courseId,
      targetType: "Course",
      details: { title: courseTitle },
    }),

  // Enrollment
  enrollmentCreated: (userId: string, courseId: string, courseTitle: string) =>
    createAuditLog({
      action: AuditAction.ENROLLMENT_CREATED,
      userId,
      targetId: courseId,
      targetType: "Course",
      details: { title: courseTitle },
    }),

  enrollmentDeleted: (userId: string, courseId: string, deletedBy: string) =>
    createAuditLog({
      action: AuditAction.ENROLLMENT_DELETED,
      userId: deletedBy,
      targetId: courseId,
      targetType: "Enrollment",
      details: { studentId: userId },
    }),

  courseCompleted: (userId: string, courseId: string, courseTitle: string) =>
    createAuditLog({
      action: AuditAction.COURSE_COMPLETED,
      userId,
      targetId: courseId,
      targetType: "Course",
      details: { title: courseTitle },
    }),

  // Quiz
  quizAttempted: (userId: string, quizId: string, score: number, passed: boolean) =>
    createAuditLog({
      action: passed ? AuditAction.QUIZ_PASSED : AuditAction.QUIZ_FAILED,
      userId,
      targetId: quizId,
      targetType: "Quiz",
      details: { score, passed },
    }),

  // Admin
  settingsChanged: (userId: string, setting: string, oldValue: unknown, newValue: unknown) =>
    createAuditLog({
      action: AuditAction.SETTINGS_CHANGED,
      userId,
      details: { setting, oldValue, newValue },
    }),

  dataExported: (userId: string, exportType: string, recordCount: number) =>
    createAuditLog({
      action: AuditAction.DATA_EXPORTED,
      userId,
      details: { exportType, recordCount },
    }),

  bulkAction: (userId: string, actionType: string, affectedCount: number, details?: Record<string, unknown>) =>
    createAuditLog({
      action: AuditAction.BULK_ACTION,
      userId,
      details: { actionType, affectedCount, ...details },
    }),
};

/**
 * Query audit logs with filters
 */
export async function getAuditLogs(options: {
  userId?: string;
  action?: AuditAction;
  targetId?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const {
    userId,
    action,
    targetId,
    targetType,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = options;

  const where: Prisma.AuditLogWhereInput = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (targetId) where.targetId = targetId;
  if (targetType) where.targetType = targetType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
