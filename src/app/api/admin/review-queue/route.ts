import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/review-queue - List courses pending review
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const pendingApprovals = await db.courseApproval.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { submittedAt: "asc" },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            imageUrl: true,
            isPublished: true,
            instructor: { select: { id: true, name: true, email: true, image: true } },
            _count: { select: { chapters: true, enrollments: true } },
          },
        },
      },
    });

    // Also get recent decisions for history
    const recentDecisions = await db.courseApproval.findMany({
      where: { status: { in: ["APPROVED", "REJECTED", "CHANGES_REQUESTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructor: { select: { name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({
      pending: pendingApprovals,
      recentDecisions,
      pendingCount: pendingApprovals.length,
    });
  } catch (error) {
    console.error("Error fetching review queue:", error);
    return NextResponse.json({ message: "Failed to fetch review queue" }, { status: 500 });
  }
}
