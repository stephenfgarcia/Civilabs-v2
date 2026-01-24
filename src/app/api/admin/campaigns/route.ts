import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailCampaignSchema } from "@/lib/validations";
import { sendCampaignEmail } from "@/lib/email";
import { Prisma } from "@prisma/client";

// GET /api/admin/campaigns - List all campaigns
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const campaigns = await db.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ message: "Failed to fetch campaigns" }, { status: 500 });
  }
}

// POST /api/admin/campaigns - Create campaign or send
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // If action is "send", send an existing campaign
    if (body.action === "send" && body.campaignId) {
      return sendCampaign(body.campaignId, session.user.id);
    }

    // Otherwise create a new campaign
    const validation = emailCampaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const campaign = await db.emailCampaign.create({
      data: {
        title: data.title,
        subject: data.subject,
        content: data.content,
        recipientFilter: data.recipientFilter as Prisma.InputJsonValue,
        status: data.scheduledFor ? "SCHEDULED" : "DRAFT",
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        sentBy: session.user.id,
      },
    });

    await db.auditLog.create({
      data: {
        action: "CAMPAIGN_CREATED",
        userId: session.user.id,
        targetId: campaign.id,
        targetType: "EmailCampaign",
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ message: "Failed to create campaign" }, { status: 500 });
  }
}

async function sendCampaign(campaignId: string, adminId: string) {
  const campaign = await db.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status === "SENT" || campaign.status === "SENDING") {
    return NextResponse.json({ message: "Campaign already sent or sending" }, { status: 400 });
  }

  // Mark as sending
  await db.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SENDING" },
  });

  try {
    // Build recipient query based on filter
    const filter = campaign.recipientFilter as Record<string, unknown>;
    const where: Prisma.UserWhereInput = {};

    if (filter.role) {
      where.role = filter.role as Prisma.EnumUserRoleFilter;
    }

    if (filter.courseId) {
      where.enrollments = { some: { courseId: filter.courseId as string } };
    }

    if (filter.inactiveDays) {
      const since = new Date();
      since.setDate(since.getDate() - (filter.inactiveDays as number));
      where.updatedAt = { lte: since };
    }

    if (filter.registeredAfter) {
      where.createdAt = { gte: new Date(filter.registeredAfter as string) };
    }

    const recipients = await db.user.findMany({
      where,
      select: { email: true },
    });

    let sentCount = 0;
    let failedCount = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((r) => sendCampaignEmail(r.email, campaign.subject, campaign.content))
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      }
    }

    await db.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentCount,
        failedCount,
      },
    });

    await db.auditLog.create({
      data: {
        action: "CAMPAIGN_SENT",
        userId: adminId,
        targetId: campaignId,
        targetType: "EmailCampaign",
        details: { sentCount, failedCount, totalRecipients: recipients.length },
      },
    });

    return NextResponse.json({
      message: "Campaign sent",
      sentCount,
      failedCount,
      totalRecipients: recipients.length,
    });
  } catch (error) {
    await db.emailCampaign.update({
      where: { id: campaignId },
      data: { status: "FAILED" },
    });
    console.error("Error sending campaign:", error);
    return NextResponse.json({ message: "Failed to send campaign" }, { status: 500 });
  }
}
