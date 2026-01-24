import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { APIKeyPermission } from "@prisma/client";

interface APIKeyUser {
  id: string;
  keyId: string;
  permissions: APIKeyPermission[];
}

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per key

function checkRateLimit(keyId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(keyId);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(keyId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Authenticate a request using an API key from the Authorization header.
 * Returns the authenticated user info or a NextResponse error.
 */
export async function authenticateAPIKey(
  req: NextRequest,
  requiredPermission: APIKeyPermission
): Promise<APIKeyUser | NextResponse> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Missing or invalid Authorization header. Use: Bearer <api_key>" },
      { status: 401 }
    );
  }

  const rawKey = authHeader.substring(7); // Remove "Bearer "

  if (!rawKey.startsWith("ck_")) {
    return NextResponse.json(
      { message: "Invalid API key format" },
      { status: 401 }
    );
  }

  // Hash the provided key and look up
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await db.aPIKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      userId: true,
      permissions: true,
      isActive: true,
      expiresAt: true,
    },
  });

  if (!apiKey) {
    return NextResponse.json(
      { message: "Invalid API key" },
      { status: 401 }
    );
  }

  if (!apiKey.isActive) {
    return NextResponse.json(
      { message: "API key has been revoked" },
      { status: 401 }
    );
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return NextResponse.json(
      { message: "API key has expired" },
      { status: 401 }
    );
  }

  // Check permission
  if (!apiKey.permissions.includes(requiredPermission)) {
    return NextResponse.json(
      { message: `API key lacks required permission: ${requiredPermission}` },
      { status: 403 }
    );
  }

  // Rate limiting
  if (!checkRateLimit(apiKey.id)) {
    return NextResponse.json(
      { message: "Rate limit exceeded. Max 60 requests per minute." },
      { status: 429 }
    );
  }

  // Update last used timestamp (fire and forget)
  void db.aPIKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => { /* ignore */ });

  return {
    id: apiKey.userId,
    keyId: apiKey.id,
    permissions: apiKey.permissions,
  };
}
