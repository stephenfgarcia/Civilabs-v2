import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { webhookUpdateSchema } from "@/lib/validations";

// GET /api/webhooks/[webhookId] - Get webhook details with recent deliveries
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { webhookId } = await params;

    const webhook = await db.webhook.findFirst({
      where: { id: webhookId, userId: session.user.id },
      select: {
        id: true,
        url: true,
        description: true,
        events: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deliveries: {
          select: {
            id: true,
            event: true,
            statusCode: true,
            success: true,
            attempts: true,
            error: true,
            deliveredAt: true,
            completedAt: true,
          },
          orderBy: { deliveredAt: "desc" },
          take: 50,
        },
        _count: { select: { deliveries: true } },
      },
    });

    if (!webhook) {
      return NextResponse.json({ message: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json(webhook);
  } catch (error) {
    console.error("Error fetching webhook:", error);
    return NextResponse.json({ message: "Failed to fetch webhook" }, { status: 500 });
  }
}

// PATCH /api/webhooks/[webhookId] - Update webhook
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { webhookId } = await params;

    // Verify ownership
    const existing = await db.webhook.findFirst({
      where: { id: webhookId, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ message: "Webhook not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = webhookUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (validation.data.url !== undefined) updateData.url = validation.data.url;
    if (validation.data.description !== undefined) updateData.description = validation.data.description;
    if (validation.data.events !== undefined) updateData.events = validation.data.events;
    if (validation.data.isActive !== undefined) updateData.isActive = validation.data.isActive;

    const webhook = await db.webhook.update({
      where: { id: webhookId },
      data: updateData,
      select: {
        id: true,
        url: true,
        description: true,
        events: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(webhook);
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json({ message: "Failed to update webhook" }, { status: 500 });
  }
}

// DELETE /api/webhooks/[webhookId] - Delete webhook
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { webhookId } = await params;

    const existing = await db.webhook.findFirst({
      where: { id: webhookId, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ message: "Webhook not found" }, { status: 404 });
    }

    await db.webhook.delete({ where: { id: webhookId } });

    return NextResponse.json({ message: "Webhook deleted" });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json({ message: "Failed to delete webhook" }, { status: 500 });
  }
}
