import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { webhookSchema } from "@/lib/validations";

// GET /api/webhooks - List user's webhooks
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only admin can manage webhooks
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const webhooks = await db.webhook.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        url: true,
        description: true,
        events: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json({ message: "Failed to fetch webhooks" }, { status: 500 });
  }
}

// POST /api/webhooks - Create a webhook
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
    const validation = webhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { url, description, events, isActive } = validation.data;

    // Generate a secure signing secret
    const secret = crypto.randomBytes(32).toString("hex");

    const webhook = await db.webhook.create({
      data: {
        url,
        description,
        events: events as any,
        isActive,
        secret,
        userId: session.user.id,
      },
      select: {
        id: true,
        url: true,
        description: true,
        events: true,
        isActive: true,
        secret: true, // Only returned on creation
        createdAt: true,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json({ message: "Failed to create webhook" }, { status: 500 });
  }
}
