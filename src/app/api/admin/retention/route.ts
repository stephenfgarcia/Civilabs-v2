import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { retentionPolicySchema } from "@/lib/validations";
import { DataType, RetentionAction } from "@prisma/client";

// GET /api/admin/retention - List all retention policies
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const policies = await db.retentionPolicy.findMany({
      orderBy: { dataType: "asc" },
    });

    // Get data volume estimates
    const volumes = await Promise.all([
      db.user.count().then((c) => ({ type: "USER_DATA", count: c })),
      db.enrollment.count().then((c) => ({ type: "ENROLLMENTS", count: c })),
      db.assignmentSubmission.count().then((c) => ({ type: "SUBMISSIONS", count: c })),
      db.userActivity.count().then((c) => ({ type: "TELEMETRY", count: c })),
      db.auditLog.count().then((c) => ({ type: "AUDIT_LOGS", count: c })),
      db.message.count().then((c) => ({ type: "CHAT_MESSAGES", count: c })),
      db.forumReply.count().then((c) => ({ type: "FORUM_POSTS", count: c })),
    ]);

    return NextResponse.json({ policies, volumes });
  } catch (error) {
    console.error("Error fetching retention policies:", error);
    return NextResponse.json({ message: "Failed to fetch policies" }, { status: 500 });
  }
}

// POST /api/admin/retention - Create or update a retention policy
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = retentionPolicySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const policy = await db.retentionPolicy.upsert({
      where: { dataType: data.dataType as DataType },
      create: {
        dataType: data.dataType as DataType,
        retentionDays: data.retentionDays,
        action: data.action as RetentionAction,
        isActive: data.isActive,
        description: data.description,
      },
      update: {
        retentionDays: data.retentionDays,
        action: data.action as RetentionAction,
        isActive: data.isActive,
        description: data.description,
      },
    });

    await db.auditLog.create({
      data: {
        action: "RETENTION_POLICY_CREATED",
        userId: session.user.id,
        targetId: policy.id,
        targetType: "RetentionPolicy",
        details: data,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error("Error creating retention policy:", error);
    return NextResponse.json({ message: "Failed to create policy" }, { status: 500 });
  }
}

// DELETE /api/admin/retention - Delete a policy by dataType
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dataType = searchParams.get("dataType");

    if (!dataType) {
      return NextResponse.json({ message: "dataType required" }, { status: 400 });
    }

    await db.retentionPolicy.delete({
      where: { dataType: dataType as DataType },
    });

    return NextResponse.json({ message: "Policy deleted" });
  } catch (error) {
    console.error("Error deleting retention policy:", error);
    return NextResponse.json({ message: "Failed to delete policy" }, { status: 500 });
  }
}
