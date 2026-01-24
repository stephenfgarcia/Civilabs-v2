import { NextRequest, NextResponse } from "next/server";
import { retryFailedDeliveries } from "@/lib/webhook-dispatcher";

// POST /api/cron/webhook-retry - Retry failed webhook deliveries
// Called by Vercel Cron every 5 minutes
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret (set in Vercel environment)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await retryFailedDeliveries();

    return NextResponse.json({
      message: "Webhook retry completed",
      ...result,
    });
  } catch (error) {
    console.error("Error in webhook retry cron:", error);
    return NextResponse.json({ message: "Webhook retry failed" }, { status: 500 });
  }
}

// Also support GET for Vercel Cron (default method)
export async function GET(req: NextRequest) {
  return POST(req);
}
