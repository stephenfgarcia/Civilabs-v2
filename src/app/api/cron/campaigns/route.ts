import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendCampaignEmail } from "@/lib/email";

// POST /api/cron/campaigns - Send scheduled campaigns
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find campaigns scheduled for now or earlier
    const campaigns = await db.emailCampaign.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: { lte: new Date() },
      },
    });

    const results = [];

    for (const campaign of campaigns) {
      await db.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: "SENDING" },
      });

      try {
        const filter = campaign.recipientFilter as Record<string, unknown>;
        const where: Record<string, unknown> = {};

        if (filter.role) where.role = filter.role;
        if (filter.courseId) where.enrollments = { some: { courseId: filter.courseId } };

        const recipients = await db.user.findMany({
          where,
          select: { email: true },
        });

        let sentCount = 0;
        let failedCount = 0;
        const BATCH_SIZE = 50;

        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
          const batch = recipients.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map((r) => sendCampaignEmail(r.email, campaign.subject, campaign.content))
          );
          for (const r of batchResults) {
            if (r.status === "fulfilled" && r.value.success) sentCount++;
            else failedCount++;
          }
        }

        await db.emailCampaign.update({
          where: { id: campaign.id },
          data: { status: "SENT", sentAt: new Date(), sentCount, failedCount },
        });

        results.push({ campaignId: campaign.id, sentCount, failedCount });
      } catch {
        await db.emailCampaign.update({
          where: { id: campaign.id },
          data: { status: "FAILED" },
        });
        results.push({ campaignId: campaign.id, error: "Failed" });
      }
    }

    return NextResponse.json({ processed: campaigns.length, results });
  } catch (error) {
    console.error("Error in campaign cron:", error);
    return NextResponse.json({ message: "Cron failed" }, { status: 500 });
  }
}
