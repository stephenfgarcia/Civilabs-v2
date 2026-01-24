import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mfaVerifySchema } from "@/lib/validations";
import { sendMFACode, verifyMFACode, verifyBackupCode, generateBackupCodes, hashCode } from "@/lib/mfa";

// GET /api/auth/mfa - Get MFA status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const mfaConfig = await db.mFAConfig.findUnique({
      where: { userId: session.user.id },
      select: {
        isEnabled: true,
        method: true,
        lastUsedAt: true,
        failedAttempts: true,
        lockedUntil: true,
        backupCodes: true,
      },
    });

    const backupCodes = mfaConfig?.backupCodes as Array<{ hash: string; used: boolean }> | null;
    const remainingBackupCodes = backupCodes?.filter((c) => !c.used).length || 0;

    return NextResponse.json({
      isEnabled: mfaConfig?.isEnabled || false,
      method: mfaConfig?.method || null,
      lastUsedAt: mfaConfig?.lastUsedAt || null,
      remainingBackupCodes,
      isLocked: mfaConfig?.lockedUntil ? mfaConfig.lockedUntil > new Date() : false,
    });
  } catch (error) {
    console.error("Error fetching MFA status:", error);
    return NextResponse.json({ message: "Failed to fetch MFA status" }, { status: 500 });
  }
}

// POST /api/auth/mfa - Setup/Enable MFA or send OTP code
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "setup": {
        // Start MFA setup - send verification code
        const user = await db.user.findUnique({
          where: { id: session.user.id },
          select: { email: true },
        });
        if (!user) {
          return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const sent = await sendMFACode(session.user.id, user.email, "MFA_SETUP");
        if (!sent) {
          return NextResponse.json({ message: "Failed to send verification code" }, { status: 500 });
        }

        return NextResponse.json({ message: "Verification code sent to your email" });
      }

      case "verify-setup": {
        // Verify code to enable MFA
        const validation = mfaVerifySchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json({ message: "Invalid code format" }, { status: 400 });
        }

        const result = await verifyMFACode(session.user.id, validation.data.code, "MFA_SETUP");
        if (!result.success) {
          return NextResponse.json({ message: result.error }, { status: 400 });
        }

        // Generate backup codes
        const plainCodes = generateBackupCodes();
        const hashedCodes = await Promise.all(
          plainCodes.map(async (code) => ({ hash: await hashCode(code), used: false }))
        );

        // Create or update MFA config
        await db.mFAConfig.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            method: "EMAIL_OTP",
            isEnabled: true,
            backupCodes: hashedCodes,
          },
          update: {
            isEnabled: true,
            backupCodes: hashedCodes,
            failedAttempts: 0,
            lockedUntil: null,
          },
        });

        // Update user mfaEnabled flag
        await db.user.update({
          where: { id: session.user.id },
          data: { mfaEnabled: true },
        });

        // Audit log
        await db.auditLog.create({
          data: {
            action: "MFA_ENABLED",
            userId: session.user.id,
            targetId: session.user.id,
            targetType: "User",
          },
        });

        return NextResponse.json({
          message: "MFA enabled successfully",
          backupCodes: plainCodes, // Show once only
        });
      }

      case "send-code": {
        // Send login verification code
        const user = await db.user.findUnique({
          where: { id: session.user.id },
          select: { email: true },
        });
        if (!user) {
          return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const sent = await sendMFACode(session.user.id, user.email);
        if (!sent) {
          return NextResponse.json({ message: "Failed to send code" }, { status: 500 });
        }

        return NextResponse.json({ message: "Code sent" });
      }

      case "verify": {
        // Verify login OTP
        const validation = mfaVerifySchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json({ message: "Invalid code format" }, { status: 400 });
        }

        const result = await verifyMFACode(session.user.id, validation.data.code);
        if (!result.success) {
          await db.auditLog.create({
            data: {
              action: "MFA_FAILED",
              userId: session.user.id,
              targetId: session.user.id,
              targetType: "User",
            },
          });
          return NextResponse.json({ message: result.error }, { status: 400 });
        }

        await db.auditLog.create({
          data: {
            action: "MFA_VERIFIED",
            userId: session.user.id,
            targetId: session.user.id,
            targetType: "User",
          },
        });

        return NextResponse.json({ message: "Verified", verified: true });
      }

      case "verify-backup": {
        // Verify backup code
        const { code } = body;
        if (!code || typeof code !== "string") {
          return NextResponse.json({ message: "Backup code required" }, { status: 400 });
        }

        const result = await verifyBackupCode(session.user.id, code.toUpperCase());
        if (!result.success) {
          return NextResponse.json({ message: result.error }, { status: 400 });
        }

        await db.auditLog.create({
          data: {
            action: "MFA_VERIFIED",
            userId: session.user.id,
            targetId: session.user.id,
            targetType: "User",
            details: { method: "backup_code" },
          },
        });

        return NextResponse.json({ message: "Verified", verified: true });
      }

      case "disable": {
        // Disable MFA
        await db.mFAConfig.update({
          where: { userId: session.user.id },
          data: { isEnabled: false },
        });
        await db.user.update({
          where: { id: session.user.id },
          data: { mfaEnabled: false },
        });

        await db.auditLog.create({
          data: {
            action: "MFA_DISABLED",
            userId: session.user.id,
            targetId: session.user.id,
            targetType: "User",
          },
        });

        return NextResponse.json({ message: "MFA disabled" });
      }

      case "regenerate-backup": {
        // Regenerate backup codes (requires existing MFA)
        const config = await db.mFAConfig.findUnique({ where: { userId: session.user.id } });
        if (!config?.isEnabled) {
          return NextResponse.json({ message: "MFA not enabled" }, { status: 400 });
        }

        const plainCodes = generateBackupCodes();
        const hashedCodes = await Promise.all(
          plainCodes.map(async (code) => ({ hash: await hashCode(code), used: false }))
        );

        await db.mFAConfig.update({
          where: { userId: session.user.id },
          data: { backupCodes: hashedCodes },
        });

        return NextResponse.json({ backupCodes: plainCodes });
      }

      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error with MFA:", error);
    return NextResponse.json({ message: "MFA operation failed" }, { status: 500 });
  }
}
