import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendOTPEmail } from "@/lib/email";

const OTP_EXPIRY_MINUTES = 5;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const BACKUP_CODE_COUNT = 10;

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

export async function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export async function sendMFACode(userId: string, email: string, purpose: string = "MFA_LOGIN"): Promise<boolean> {
  const code = generateOTP();
  const hashedCode = await hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any existing unused OTP tokens for this user
  await db.oTPToken.updateMany({
    where: { userId, usedAt: null, purpose },
    data: { usedAt: new Date() },
  });

  // Create new OTP token
  await db.oTPToken.create({
    data: {
      userId,
      code: hashedCode,
      expiresAt,
      purpose,
    },
  });

  // Send the code via email
  const result = await sendOTPEmail(email, code);
  return result.success;
}

export async function verifyMFACode(userId: string, code: string, purpose: string = "MFA_LOGIN"): Promise<{ success: boolean; error?: string }> {
  // Check lockout
  const mfaConfig = await db.mFAConfig.findUnique({ where: { userId } });
  if (mfaConfig?.lockedUntil && mfaConfig.lockedUntil > new Date()) {
    const remaining = Math.ceil((mfaConfig.lockedUntil.getTime() - Date.now()) / 60000);
    return { success: false, error: `Account locked. Try again in ${remaining} minutes.` };
  }

  // Find valid OTP token
  const tokens = await db.oTPToken.findMany({
    where: {
      userId,
      purpose,
      usedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  if (tokens.length === 0) {
    await incrementFailedAttempts(userId);
    return { success: false, error: "Invalid or expired code" };
  }

  const token = tokens[0];
  const isValid = await verifyCode(code, token.code);

  if (!isValid) {
    await incrementFailedAttempts(userId);
    return { success: false, error: "Invalid code" };
  }

  // Mark token as used
  await db.oTPToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  // Reset failed attempts
  if (mfaConfig) {
    await db.mFAConfig.update({
      where: { userId },
      data: { failedAttempts: 0, lockedUntil: null, lastUsedAt: new Date() },
    });
  }

  return { success: true };
}

export async function verifyBackupCode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  const mfaConfig = await db.mFAConfig.findUnique({ where: { userId } });
  if (!mfaConfig?.backupCodes) {
    return { success: false, error: "No backup codes configured" };
  }

  const backupCodes = mfaConfig.backupCodes as Array<{ hash: string; used: boolean }>;

  for (let i = 0; i < backupCodes.length; i++) {
    if (!backupCodes[i].used && await verifyCode(code, backupCodes[i].hash)) {
      backupCodes[i].used = true;
      await db.mFAConfig.update({
        where: { userId },
        data: { backupCodes: backupCodes, lastUsedAt: new Date(), failedAttempts: 0, lockedUntil: null },
      });
      return { success: true };
    }
  }

  await incrementFailedAttempts(userId);
  return { success: false, error: "Invalid backup code" };
}

async function incrementFailedAttempts(userId: string) {
  const mfaConfig = await db.mFAConfig.findUnique({ where: { userId } });
  if (!mfaConfig) return;

  const newAttempts = mfaConfig.failedAttempts + 1;
  const lockedUntil = newAttempts >= MAX_FAILED_ATTEMPTS
    ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
    : null;

  await db.mFAConfig.update({
    where: { userId },
    data: { failedAttempts: newAttempts, lockedUntil },
  });
}

export async function isMFARequired(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, mfaConfig: { select: { isEnabled: true } } },
  });
  return !!user?.mfaEnabled && !!user?.mfaConfig?.isEnabled;
}
