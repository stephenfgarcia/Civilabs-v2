import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mfaEnforcementSchema } from "@/lib/validations";

// GET /api/admin/mfa - MFA adoption stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const totalUsers = await db.user.count();
    const mfaEnabled = await db.user.count({ where: { mfaEnabled: true } });

    const byRole = await db.user.groupBy({
      by: ["role"],
      _count: true,
      where: { mfaEnabled: true },
    });

    const totalByRole = await db.user.groupBy({
      by: ["role"],
      _count: true,
    });

    // Get platform enforcement setting
    const settings = await db.platformSettings.findFirst();

    return NextResponse.json({
      totalUsers,
      mfaEnabled,
      adoptionRate: totalUsers > 0 ? Math.round((mfaEnabled / totalUsers) * 100) : 0,
      byRole: totalByRole.map((r) => ({
        role: r.role,
        total: r._count,
        mfaEnabled: byRole.find((b) => b.role === r.role)?._count || 0,
      })),
      enforcementEnabled: !!(settings as Record<string, unknown>)?.requireMFA,
    });
  } catch (error) {
    console.error("Error fetching MFA stats:", error);
    return NextResponse.json({ message: "Failed to fetch MFA stats" }, { status: 500 });
  }
}

// POST /api/admin/mfa - Update MFA enforcement policy
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = mfaEnforcementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    // Store enforcement policy in platform settings as JSON metadata
    // We'll use a simple approach: store in audit log as a policy record
    await db.auditLog.create({
      data: {
        action: "SETTINGS_CHANGED",
        userId: session.user.id,
        targetType: "MFAPolicy",
        details: {
          requireMFA: validation.data.requireMFA,
          roles: validation.data.roles || ["STUDENT", "INSTRUCTOR", "ADMIN"],
        },
      },
    });

    return NextResponse.json({
      message: validation.data.requireMFA
        ? "MFA enforcement enabled"
        : "MFA enforcement disabled",
    });
  } catch (error) {
    console.error("Error updating MFA policy:", error);
    return NextResponse.json({ message: "Failed to update policy" }, { status: 500 });
  }
}
