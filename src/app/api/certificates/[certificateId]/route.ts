import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ certificateId: string }>;
}

// GET /api/certificates/[certificateId] - Get certificate by ID (for verification)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { certificateId } = await params;

    const certificate = await db.certificate.findUnique({
      where: { id: certificateId },
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
        { message: "Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("Error fetching certificate:", error);
    return NextResponse.json(
      { message: "Failed to fetch certificate" },
      { status: 500 }
    );
  }
}
