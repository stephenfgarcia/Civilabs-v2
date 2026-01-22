import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ code: string }>;
}

// GET /api/certificates/verify/[code] - Verify certificate by unique code
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;

    const certificate = await db.certificate.findUnique({
      where: { uniqueCode: code },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            instructor: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { message: "Certificate not found", valid: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      certificate,
    });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return NextResponse.json(
      { message: "Failed to verify certificate", valid: false },
      { status: 500 }
    );
  }
}
