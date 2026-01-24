import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeySchema } from "@/lib/validations";

// GET /api/api-keys - List user's API keys
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const keys = await db.aPIKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        isActive: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(keys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json({ message: "Failed to fetch API keys" }, { status: 500 });
  }
}

// POST /api/api-keys - Generate a new API key
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = apiKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, permissions, expiresAt } = validation.data;

    // Generate a secure API key: ck_<32 random hex chars>
    const rawKey = `ck_${crypto.randomBytes(32).toString("hex")}`;
    const keyPrefix = rawKey.substring(0, 10); // "ck_" + first 7 hex chars
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await db.aPIKey.create({
      data: {
        name,
        keyPrefix,
        keyHash,
        permissions: permissions as any,
        userId: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Return the full key ONLY on creation — it cannot be retrieved again
    return NextResponse.json({
      ...apiKey,
      key: rawKey, // Only shown once!
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json({ message: "Failed to create API key" }, { status: 500 });
  }
}
