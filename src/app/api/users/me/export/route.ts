import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/users/me/export - Export user's personal data (GDPR Right to Access)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch core personal data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        image: true,
        profileVisibility: true,
        mfaEnabled: true,
        consentAcceptedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Fetch enrollments
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
    });

    // Fetch grades
    const grades = await db.studentGrade.findMany({
      where: { userId },
      include: {
        gradeItem: { select: { title: true, points: true, type: true } },
      },
    });

    // Consents
    const consents = await db.consentRecord.findMany({
      where: { userId },
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        ...user,
        password: "[REDACTED]",
      },
      enrollments: enrollments.map((e) => ({
        course: e.course.title,
        enrolledAt: e.createdAt,
        completedAt: e.completedAt,
      })),
      grades: grades.map((g) => ({
        item: g.gradeItem.title,
        score: g.score,
        points: g.gradeItem.points,
        gradedAt: g.gradedAt,
      })),
      consents: consents.map((c) => ({
        type: c.consentType,
        granted: c.granted,
        grantedAt: c.grantedAt,
        revokedAt: c.revokedAt,
      })),
    };

    // Audit log
    await db.auditLog.create({
      data: {
        action: "USER_DATA_EXPORTED",
        userId,
        targetId: userId,
        targetType: "User",
      },
    });

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="civilabs-data-export-${userId}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json({ message: "Failed to export data" }, { status: 500 });
  }
}
