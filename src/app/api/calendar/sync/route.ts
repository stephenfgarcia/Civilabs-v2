import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CalendarEventType } from "@prisma/client";

// POST /api/calendar/sync - Generate/sync auto-events from course data
// This creates calendar events from assignments, assessments, and attendance sessions
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();

    // Verify the user is an instructor/admin of the course
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
      });
      if (!course) {
        return NextResponse.json({ message: "Course not found" }, { status: 404 });
      }
      if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    // Get courses to sync
    const courseFilter = courseId
      ? { id: courseId }
      : session.user.role === "ADMIN"
        ? {}
        : { instructorId: session.user.id };

    const courses = await db.course.findMany({
      where: courseFilter,
      select: { id: true, title: true },
    });

    let created = 0;
    let updated = 0;

    for (const course of courses) {
      // 1. Sync assignment due dates
      const assignments = await db.assignment.findMany({
        where: { courseId: course.id, isPublished: true, dueDate: { not: null } },
        select: { id: true, title: true, dueDate: true, availableFrom: true },
      });

      for (const assignment of assignments) {
        if (assignment.dueDate) {
          const result = await upsertEvent({
            referenceType: "Assignment",
            referenceId: assignment.id,
            courseId: course.id,
            title: `${assignment.title} - Due`,
            startDate: assignment.dueDate,
            type: "ASSIGNMENT_DUE",
            color: "#EF4444", // Red for due dates
          });
          result === "created" ? created++ : updated++;
        }

        if (assignment.availableFrom) {
          const result = await upsertEvent({
            referenceType: "Assignment",
            referenceId: `${assignment.id}-open`,
            courseId: course.id,
            title: `${assignment.title} - Available`,
            startDate: assignment.availableFrom,
            type: "CONTENT_AVAILABLE",
            color: "#22C55E", // Green for availability
          });
          result === "created" ? created++ : updated++;
        }
      }

      // 2. Sync assessment windows
      const assessments = await db.quiz.findMany({
        where: {
          chapter: { courseId: course.id },
          OR: [
            { availableFrom: { not: null } },
            { availableUntil: { not: null } },
          ],
        },
        select: { id: true, title: true, availableFrom: true, availableUntil: true, assessmentType: true },
      });

      for (const assessment of assessments) {
        if (assessment.availableFrom) {
          const result = await upsertEvent({
            referenceType: "Quiz",
            referenceId: `${assessment.id}-open`,
            courseId: course.id,
            title: `${assessment.title} - Opens`,
            startDate: assessment.availableFrom,
            type: "ASSESSMENT_OPEN",
            color: "#3B82F6", // Blue for assessments
          });
          result === "created" ? created++ : updated++;
        }

        if (assessment.availableUntil) {
          const result = await upsertEvent({
            referenceType: "Quiz",
            referenceId: `${assessment.id}-close`,
            courseId: course.id,
            title: `${assessment.title} - Closes`,
            startDate: assessment.availableUntil,
            type: "ASSESSMENT_CLOSE",
            color: "#F59E0B", // Amber for closing
          });
          result === "created" ? created++ : updated++;
        }
      }

      // 3. Sync attendance sessions
      const attendanceSessions = await db.attendanceSession.findMany({
        where: { courseId: course.id },
        select: { id: true, title: true, date: true },
      });

      for (const attendanceSession of attendanceSessions) {
        const result = await upsertEvent({
          referenceType: "AttendanceSession",
          referenceId: attendanceSession.id,
          courseId: course.id,
          title: attendanceSession.title || "Attendance Session",
          startDate: attendanceSession.date,
          type: "ATTENDANCE_SESSION",
          color: "#8B5CF6", // Purple for attendance
        });
        result === "created" ? created++ : updated++;
      }

      // 4. Sync content availability (chapters)
      const chapters = await db.chapter.findMany({
        where: { courseId: course.id, availableFrom: { not: null } },
        select: { id: true, title: true, availableFrom: true },
      });

      for (const chapter of chapters) {
        if (chapter.availableFrom) {
          const result = await upsertEvent({
            referenceType: "Chapter",
            referenceId: chapter.id,
            courseId: course.id,
            title: `${chapter.title} - Available`,
            startDate: chapter.availableFrom,
            type: "CONTENT_AVAILABLE",
            color: "#22C55E",
          });
          result === "created" ? created++ : updated++;
        }
      }
    }

    return NextResponse.json({ created, updated, coursesProcessed: courses.length });
  } catch (error) {
    console.error("Error syncing calendar events:", error);
    return NextResponse.json({ message: "Failed to sync events" }, { status: 500 });
  }
}

async function upsertEvent(params: {
  referenceType: string;
  referenceId: string;
  courseId: string;
  title: string;
  startDate: Date;
  type: string;
  color: string;
}): Promise<"created" | "updated"> {
  const existing = await db.calendarEvent.findFirst({
    where: {
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      courseId: params.courseId,
    },
  });

  if (existing) {
    await db.calendarEvent.update({
      where: { id: existing.id },
      data: {
        title: params.title,
        startDate: params.startDate,
        color: params.color,
      },
    });
    return "updated";
  } else {
    await db.calendarEvent.create({
      data: {
        title: params.title,
        startDate: params.startDate,
        allDay: true,
        type: params.type as CalendarEventType,
        color: params.color,
        courseId: params.courseId,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
      },
    });
    return "created";
  }
}
