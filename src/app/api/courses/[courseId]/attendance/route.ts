import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { attendanceSessionSchema, batchAttendanceSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/attendance - List attendance sessions
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    const isInstructor = course.instructorId === session.user.id || session.user.role === "ADMIN";

    const sessions = await db.attendanceSession.findMany({
      where: { courseId },
      orderBy: { date: "desc" },
      include: {
        records: {
          where: isInstructor ? {} : { userId: session.user.id },
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        _count: { select: { records: true } },
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ message: "Failed to fetch attendance" }, { status: 500 });
  }
}

// POST /api/courses/[courseId]/attendance - Create session + batch records
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate session data
    const sessionValidation = attendanceSessionSchema.safeParse(body);
    if (!sessionValidation.success) {
      return NextResponse.json(
        { message: "Invalid session data", errors: sessionValidation.error.issues },
        { status: 400 }
      );
    }

    // Validate records if provided
    let records: Array<{ userId: string; status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"; notes?: string }> = [];
    if (body.records) {
      const recordsValidation = batchAttendanceSchema.safeParse({ records: body.records });
      if (!recordsValidation.success) {
        return NextResponse.json(
          { message: "Invalid records data", errors: recordsValidation.error.issues },
          { status: 400 }
        );
      }
      records = recordsValidation.data.records;
    }

    const data = sessionValidation.data;

    // Create the session
    const attendanceSession = await db.attendanceSession.create({
      data: {
        courseId,
        date: data.date ? new Date(data.date) : new Date(),
        title: data.title ?? undefined,
        type: data.type,
        notes: data.notes ?? undefined,
        createdBy: session.user.id,
      },
    });

    // Create records if provided
    if (records.length > 0) {
      await db.attendanceRecord.createMany({
        data: records.map((r) => ({
          sessionId: attendanceSession.id,
          userId: r.userId,
          status: r.status,
          notes: r.notes ?? undefined,
          markedBy: session.user.id,
        })),
      });
    }

    // Return with records
    const result = await db.attendanceSession.findUnique({
      where: { id: attendanceSession.id },
      include: {
        records: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance session:", error);
    return NextResponse.json({ message: "Failed to create attendance session" }, { status: 500 });
  }
}
