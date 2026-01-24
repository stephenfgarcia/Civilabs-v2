import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { batchConsentSchema } from "@/lib/validations";
import { ConsentType } from "@prisma/client";

// GET /api/users/me/consent - Get user's consent records
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const consents = await db.consentRecord.findMany({
      where: { userId: session.user.id },
    });

    // Return all consent types with their status
    const allTypes: ConsentType[] = ["DATA_PROCESSING", "ANALYTICS", "MARKETING"];
    const result = allTypes.map((type) => {
      const record = consents.find((c) => c.consentType === type);
      return {
        consentType: type,
        granted: record?.granted ?? false,
        grantedAt: record?.grantedAt ?? null,
        revokedAt: record?.revokedAt ?? null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching consents:", error);
    return NextResponse.json({ message: "Failed to fetch consents" }, { status: 500 });
  }
}

// POST /api/users/me/consent - Update consent preferences
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = batchConsentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;

    for (const consent of validation.data.consents) {
      await db.consentRecord.upsert({
        where: {
          userId_consentType: {
            userId: session.user.id,
            consentType: consent.consentType as ConsentType,
          },
        },
        create: {
          userId: session.user.id,
          consentType: consent.consentType as ConsentType,
          granted: consent.granted,
          grantedAt: consent.granted ? new Date() : undefined,
          revokedAt: !consent.granted ? new Date() : undefined,
          ipAddress,
        },
        update: {
          granted: consent.granted,
          ...(consent.granted
            ? { grantedAt: new Date(), revokedAt: null }
            : { revokedAt: new Date() }),
          ipAddress,
        },
      });

      // Audit
      await db.auditLog.create({
        data: {
          action: consent.granted ? "CONSENT_GRANTED" : "CONSENT_REVOKED",
          userId: session.user.id,
          targetId: session.user.id,
          targetType: "ConsentRecord",
          details: { consentType: consent.consentType, granted: consent.granted },
          ipAddress,
        },
      });
    }

    // Update user's consentAcceptedAt
    const hasDataProcessing = validation.data.consents.find(
      (c) => c.consentType === "DATA_PROCESSING" && c.granted
    );
    if (hasDataProcessing) {
      await db.user.update({
        where: { id: session.user.id },
        data: { consentAcceptedAt: new Date() },
      });
    }

    return NextResponse.json({ message: "Consent preferences updated" });
  } catch (error) {
    console.error("Error updating consents:", error);
    return NextResponse.json({ message: "Failed to update consents" }, { status: 500 });
  }
}
