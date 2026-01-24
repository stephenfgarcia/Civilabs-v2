import crypto from "crypto";
import { db } from "@/lib/db";
import { WebhookEvent } from "@prisma/client";

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Dispatch a webhook event to all active webhooks subscribed to that event.
 * Runs asynchronously — does not block the caller.
 */
export function dispatchWebhookEvent(
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  // Fire and forget — don't await in the calling route
  void processWebhookEvent(event, data);
}

async function processWebhookEvent(
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  try {
    // Find all active webhooks subscribed to this event
    const webhooks = await db.webhook.findMany({
      where: {
        isActive: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) return;

    const timestamp = new Date().toISOString();
    const payload: WebhookPayload = { event, timestamp, data };
    const payloadString = JSON.stringify(payload);

    // Deliver to each webhook
    await Promise.allSettled(
      webhooks.map((webhook) =>
        deliverWebhook(webhook.id, webhook.url, webhook.secret, event, payloadString)
      )
    );
  } catch (error) {
    console.error("Error dispatching webhook event:", error);
  }
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  event: WebhookEvent,
  payloadString: string
) {
  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let success = false;
  let error: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Event": event,
        "X-Webhook-Timestamp": JSON.parse(payloadString).timestamp,
        "User-Agent": "CiviLabs-Webhook/1.0",
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    statusCode = response.status;
    responseBody = await response.text().catch(() => null);
    success = response.ok; // 2xx status codes
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  // Calculate next retry time if failed (exponential backoff)
  // Retry schedule: 1m, 5m, 30m, 2h, 12h
  const retryDelays = [60, 300, 1800, 7200, 43200]; // seconds
  const nextRetryAt = !success
    ? new Date(Date.now() + retryDelays[0] * 1000)
    : null;

  // Record the delivery attempt
  await db.webhookDelivery.create({
    data: {
      webhookId,
      event,
      payload: JSON.parse(payloadString),
      statusCode,
      responseBody: responseBody?.substring(0, 5000) || null, // Limit stored response size
      success,
      attempts: 1,
      maxAttempts: 5,
      nextRetryAt: success ? null : nextRetryAt,
      error,
      completedAt: success ? new Date() : null,
    },
  });
}

/**
 * Retry failed webhook deliveries. Called by Vercel Cron.
 * Picks up deliveries where nextRetryAt <= now and success = false.
 */
export async function retryFailedDeliveries() {
  const now = new Date();

  const failedDeliveries = await db.webhookDelivery.findMany({
    where: {
      success: false,
      nextRetryAt: { lte: now },
      completedAt: null,
    },
    include: {
      webhook: {
        select: { url: true, secret: true, isActive: true },
      },
    },
    take: 50, // Process up to 50 at a time
  });

  const retryDelays = [60, 300, 1800, 7200, 43200]; // seconds
  let retried = 0;
  let succeeded = 0;

  for (const delivery of failedDeliveries) {
    // Skip if webhook was deactivated
    if (!delivery.webhook.isActive) {
      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: { completedAt: now, error: "Webhook deactivated" },
      });
      continue;
    }

    // Skip if max attempts reached
    if (delivery.attempts >= delivery.maxAttempts) {
      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: { completedAt: now, error: "Max attempts reached" },
      });
      continue;
    }

    const payloadString = JSON.stringify(delivery.payload);
    const signature = crypto
      .createHmac("sha256", delivery.webhook.secret)
      .update(payloadString)
      .digest("hex");

    let statusCode: number | null = null;
    let responseBody: string | null = null;
    let success = false;
    let error: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(delivery.webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Event": delivery.event,
          "X-Webhook-Retry": String(delivery.attempts),
          "User-Agent": "CiviLabs-Webhook/1.0",
        },
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = response.status;
      responseBody = await response.text().catch(() => null);
      success = response.ok;
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    }

    const newAttempts = delivery.attempts + 1;
    const nextRetryIndex = Math.min(newAttempts - 1, retryDelays.length - 1);
    const nextRetry = !success && newAttempts < delivery.maxAttempts
      ? new Date(Date.now() + retryDelays[nextRetryIndex] * 1000)
      : null;

    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        statusCode,
        responseBody: responseBody?.substring(0, 5000) || null,
        success,
        attempts: newAttempts,
        nextRetryAt: nextRetry,
        error,
        completedAt: success || newAttempts >= delivery.maxAttempts ? new Date() : null,
      },
    });

    retried++;
    if (success) succeeded++;
  }

  return { retried, succeeded, total: failedDeliveries.length };
}
