import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE /api/users/me - Delete/anonymize user account (GDPR Right to be Forgotten)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const confirm = searchParams.get("confirm");

    if (confirm !== "true") {
      return NextResponse.json(
        { message: "Must confirm deletion with ?confirm=true" },
        { status: 400 }
      );
    }

    // Audit before deletion
    await db.auditLog.create({
      data: {
        action: "USER_DATA_DELETED",
        userId,
        targetId: userId,
        targetType: "User",
        details: { email: session.user.email, deletedAt: new Date().toISOString() },
      },
    });

    // Anonymize user data (keep record for referential integrity but remove PII)
    await db.user.update({
      where: { id: userId },
      data: {
        name: "Deleted User",
        email: `deleted-${userId}@removed.local`,
        password: null,
        bio: null,
        image: null,
        profileVisibility: false,
        mfaEnabled: false,
      },
    });

    // Delete MFA config
    await db.mFAConfig.deleteMany({ where: { userId } });

    // Delete OTP tokens
    await db.oTPToken.deleteMany({ where: { userId } });

    // Delete sessions
    await db.session.deleteMany({ where: { userId } });

    // Delete accounts (OAuth)
    await db.account.deleteMany({ where: { userId } });

    // Delete notifications
    await db.notification.deleteMany({ where: { userId } });

    // Delete notification preferences
    await db.notificationPreference.deleteMany({ where: { userId } });

    // Delete consents
    await db.consentRecord.deleteMany({ where: { userId } });

    // Delete user activities (telemetry)
    await db.userActivity.deleteMany({ where: { userId } });

    // Anonymize forum posts (keep content structure)
    await db.forumThread.updateMany({
      where: { userId },
      data: { content: "[Deleted user content]" },
    });
    await db.forumReply.updateMany({
      where: { userId },
      data: { content: "[Deleted user content]" },
    });

    // Anonymize chat messages
    await db.message.updateMany({
      where: { userId },
      data: { content: "[Deleted user message]" },
    });

    return NextResponse.json({
      message: "Account deleted and data anonymized",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Failed to delete account" }, { status: 500 });
  }
}
