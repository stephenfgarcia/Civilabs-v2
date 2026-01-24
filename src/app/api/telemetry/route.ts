import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { batchTelemetrySchema } from "@/lib/validations";

// POST /api/telemetry - Batch event ingestion
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = batchTelemetrySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { events } = validation.data;

    await db.userActivity.createMany({
      data: events.map((e) => ({
        userId: session.user!.id,
        courseId: e.courseId ?? undefined,
        lessonId: e.lessonId ?? undefined,
        eventType: e.eventType,
        metadata: e.metadata ? (e.metadata as Prisma.InputJsonValue) : undefined,
        sessionId: e.sessionId ?? undefined,
      })),
    });

    return NextResponse.json({ received: events.length });
  } catch (error) {
    console.error("Error ingesting telemetry:", error);
    return NextResponse.json({ message: "Failed to save telemetry" }, { status: 500 });
  }
}
