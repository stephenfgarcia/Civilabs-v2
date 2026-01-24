import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calendarEventSchema, calendarEventUpdateSchema } from "@/lib/validations";
import { CalendarEventType } from "@prisma/client";

// GET /api/calendar - List calendar events for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const courseId = searchParams.get("courseId");

    // Build date filter
    const dateFilter: Record<string, Date> = {};
    if (start) dateFilter.gte = new Date(start);
    if (end) dateFilter.lte = new Date(end);

    // Get user's enrolled course IDs
    const enrollments = await db.enrollment.findMany({
      where: { userId: session.user.id },
      select: { courseId: true },
    });
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    // For instructors, also include their own courses
    let instructorCourseIds: string[] = [];
    if (session.user.role === "INSTRUCTOR" || session.user.role === "ADMIN") {
      const instructorCourses = await db.course.findMany({
        where: { instructorId: session.user.id },
        select: { id: true },
      });
      instructorCourseIds = instructorCourses.map((c) => c.id);
    }

    const allCourseIds = [...new Set([...enrolledCourseIds, ...instructorCourseIds])];

    // Filter by specific course if requested
    const courseFilter = courseId
      ? { courseId }
      : { courseId: { in: allCourseIds } };

    const events = await db.calendarEvent.findMany({
      where: {
        AND: [
          {
            OR: [
              // Course events for enrolled/owned courses
              courseFilter,
              // Personal events (userId matches)
              { userId: session.user.id, courseId: null },
            ],
          },
          ...(Object.keys(dateFilter).length > 0
            ? [{ startDate: dateFilter }]
            : []),
        ],
      },
      orderBy: { startDate: "asc" },
      include: {
        course: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json({ message: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/calendar - Create a custom calendar event
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = calendarEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If courseId provided, verify ownership (instructor/admin only)
    if (data.courseId) {
      const course = await db.course.findUnique({
        where: { id: data.courseId },
        select: { instructorId: true },
      });
      if (!course) {
        return NextResponse.json({ message: "Course not found" }, { status: 404 });
      }
      if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    const event = await db.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        allDay: data.allDay,
        type: data.type as CalendarEventType,
        color: data.color,
        courseId: data.courseId || null,
        userId: data.courseId ? null : session.user.id, // Personal if no course
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json({ message: "Failed to create event" }, { status: 500 });
  }
}

// PATCH /api/calendar - Update a calendar event
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ message: "Event ID required" }, { status: 400 });
    }

    const validation = calendarEventUpdateSchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await db.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Only event owner or course instructor can update
    const canUpdate =
      existing.userId === session.user.id ||
      session.user.role === "ADMIN" ||
      (existing.courseId &&
        (await db.course.findFirst({
          where: { id: existing.courseId, instructorId: session.user.id },
        })));

    if (!canUpdate) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const data = validation.data;
    const event = await db.calendarEvent.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.allDay !== undefined && { allDay: data.allDay }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json({ message: "Failed to update event" }, { status: 500 });
  }
}

// DELETE /api/calendar - Delete a calendar event
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Event ID required" }, { status: 400 });
    }

    const existing = await db.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Only custom events can be deleted manually (auto-generated ones are managed by system)
    if (existing.type !== "CUSTOM") {
      return NextResponse.json({ message: "Cannot delete auto-generated events" }, { status: 400 });
    }

    const canDelete =
      existing.userId === session.user.id ||
      session.user.role === "ADMIN" ||
      (existing.courseId &&
        (await db.course.findFirst({
          where: { id: existing.courseId, instructorId: session.user.id },
        })));

    if (!canDelete) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ message: "Event deleted" });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json({ message: "Failed to delete event" }, { status: 500 });
  }
}
