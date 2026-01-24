import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatcher";

// POST /api/webhooks/[webhookId]/test - Send a test webhook delivery
export async function POST(
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
      select: { id: true, events: true, isActive: true },
    });

    if (!webhook) {
      return NextResponse.json({ message: "Webhook not found" }, { status: 404 });
    }

    if (!webhook.isActive) {
      return NextResponse.json({ message: "Webhook is not active" }, { status: 400 });
    }

    // Use the first subscribed event for the test
    const testEvent = webhook.events[0];
    if (!testEvent) {
      return NextResponse.json({ message: "Webhook has no events configured" }, { status: 400 });
    }

    // Dispatch a test event
    dispatchWebhookEvent(testEvent, {
      test: true,
      message: "This is a test webhook delivery from CiviLabs",
      webhookId: webhook.id,
      triggeredBy: session.user.id,
    });

    return NextResponse.json({ message: "Test webhook dispatched", event: testEvent });
  } catch (error) {
    console.error("Error testing webhook:", error);
    return NextResponse.json({ message: "Failed to test webhook" }, { status: 500 });
  }
}
