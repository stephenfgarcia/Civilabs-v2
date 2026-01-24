import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailCampaignUpdateSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ campaignId: string }>;
}

// GET /api/admin/campaigns/[campaignId] - Get campaign details + recipient preview
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { campaignId } = await params;

    const campaign = await db.emailCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    // Calculate recipient count based on filter
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

    const recipientCount = await db.user.count({ where });

    return NextResponse.json({ ...campaign, recipientCount });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json({ message: "Failed to fetch campaign" }, { status: 500 });
  }
}

// PATCH /api/admin/campaigns/[campaignId] - Update campaign
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { campaignId } = await params;

    const existing = await db.emailCampaign.findUnique({ where: { id: campaignId } });
    if (!existing) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    if (existing.status === "SENT" || existing.status === "SENDING") {
      return NextResponse.json({ message: "Cannot edit sent campaigns" }, { status: 400 });
    }

    const body = await req.json();
    const validation = emailCampaignUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const campaign = await db.emailCampaign.update({
      where: { id: campaignId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.subject && { subject: data.subject }),
        ...(data.content && { content: data.content }),
        ...(data.recipientFilter && { recipientFilter: data.recipientFilter as Prisma.InputJsonValue }),
        ...(data.scheduledFor && { scheduledFor: new Date(data.scheduledFor), status: "SCHEDULED" }),
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json({ message: "Failed to update campaign" }, { status: 500 });
  }
}

// DELETE /api/admin/campaigns/[campaignId] - Delete campaign
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { campaignId } = await params;

    const existing = await db.emailCampaign.findUnique({ where: { id: campaignId } });
    if (!existing) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    if (existing.status === "SENDING") {
      return NextResponse.json({ message: "Cannot delete while sending" }, { status: 400 });
    }

    await db.emailCampaign.delete({ where: { id: campaignId } });

    return NextResponse.json({ message: "Campaign deleted" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json({ message: "Failed to delete campaign" }, { status: 500 });
  }
}
