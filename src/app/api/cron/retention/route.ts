import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/cron/retention - Vercel cron job for retention policy execution
// Secured by CRON_SECRET header
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const policies = await db.retentionPolicy.findMany({
      where: { isActive: true },
    });

    const results: Array<{ dataType: string; action: string; affectedCount: number }> = [];

    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      let affectedCount = 0;

      switch (policy.dataType) {
        case "TELEMETRY": {
          if (policy.action === "DELETE") {
            const result = await db.userActivity.deleteMany({
              where: { timestamp: { lt: cutoffDate } },
            });
            affectedCount = result.count;
          }
          break;
        }

        case "AUDIT_LOGS": {
          if (policy.action === "DELETE") {
            const result = await db.auditLog.deleteMany({
              where: { createdAt: { lt: cutoffDate } },
            });
            affectedCount = result.count;
          }
          break;
        }

        case "CHAT_MESSAGES": {
          if (policy.action === "DELETE") {
            const result = await db.message.deleteMany({
              where: { createdAt: { lt: cutoffDate } },
            });
            affectedCount = result.count;
          } else if (policy.action === "ANONYMIZE") {
            const result = await db.message.updateMany({
              where: { createdAt: { lt: cutoffDate } },
              data: { content: "[Archived message]" },
            });
            affectedCount = result.count;
          }
          break;
        }

        case "FORUM_POSTS": {
          if (policy.action === "DELETE") {
            const result = await db.forumReply.deleteMany({
              where: { createdAt: { lt: cutoffDate } },
            });
            affectedCount = result.count;
          } else if (policy.action === "ANONYMIZE") {
            const result = await db.forumReply.updateMany({
              where: { createdAt: { lt: cutoffDate } },
              data: { content: "[Archived post]" },
            });
            affectedCount = result.count;
          }
          break;
        }

        case "SUBMISSIONS": {
          if (policy.action === "DELETE") {
            const result = await db.assignmentSubmission.deleteMany({
              where: { createdAt: { lt: cutoffDate } },
            });
            affectedCount = result.count;
          } else if (policy.action === "ANONYMIZE") {
            const result = await db.assignmentSubmission.updateMany({
              where: { createdAt: { lt: cutoffDate } },
              data: { textContent: null, fileUrl: null, fileName: null },
            });
            affectedCount = result.count;
          }
          break;
        }

        case "ENROLLMENTS": {
          // Only delete completed enrollments older than retention period
          if (policy.action === "DELETE") {
            const result = await db.enrollment.deleteMany({
              where: { completedAt: { lt: cutoffDate } },
            });
            affectedCount = result.count;
          }
          break;
        }

        case "USER_DATA": {
          // Anonymize inactive users (not delete - too destructive for cron)
          if (policy.action === "ANONYMIZE") {
            const result = await db.user.updateMany({
              where: { updatedAt: { lt: cutoffDate }, role: "STUDENT" },
              data: { name: "Archived User", bio: null, image: null },
            });
            affectedCount = result.count;
          }
          break;
        }
      }

      if (affectedCount > 0) {
        results.push({ dataType: policy.dataType, action: policy.action, affectedCount });
      }

      // Update last executed timestamp
      await db.retentionPolicy.update({
        where: { id: policy.id },
        data: { lastExecutedAt: new Date() },
      });
    }

    // Log execution
    if (results.length > 0) {
      await db.auditLog.create({
        data: {
          action: "RETENTION_POLICY_EXECUTED",
          targetType: "RetentionPolicy",
          details: { results, executedAt: new Date().toISOString() },
        },
      });
    }

    return NextResponse.json({
      message: "Retention policies executed",
      policiesEvaluated: policies.length,
      results,
    });
  } catch (error) {
    console.error("Error executing retention policies:", error);
    return NextResponse.json({ message: "Retention execution failed" }, { status: 500 });
  }
}
