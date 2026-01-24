import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { batchAttendanceSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string; sessionId: string }>;
}

// PATCH /api/courses/[courseId]/attendance/[sessionId] - Update records for a session
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, sessionId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = batchAttendanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    // Upsert each record
    const results = await Promise.all(
      validation.data.records.map((r) =>
        db.attendanceRecord.upsert({
          where: { sessionId_userId: { sessionId, userId: r.userId } },
          create: {
            sessionId,
            userId: r.userId,
            status: r.status,
            notes: r.notes ?? undefined,
            markedBy: session.user.id,
          },
          update: {
            status: r.status,
            notes: r.notes ?? undefined,
            markedBy: session.user.id,
            markedAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json({ updated: results.length });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json({ message: "Failed to update attendance" }, { status: 500 });
  }
}

// DELETE /api/courses/[courseId]/attendance/[sessionId]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId, sessionId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.attendanceSession.delete({ where: { id: sessionId } });

    return NextResponse.json({ message: "Attendance session deleted" });
  } catch (error) {
    console.error("Error deleting attendance session:", error);
    return NextResponse.json({ message: "Failed to delete attendance session" }, { status: 500 });
  }
}
