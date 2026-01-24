import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

// GET /api/calendar/ical?token=xxx - iCal subscription feed
// Public endpoint authenticated via unique token (no session needed)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ message: "Token required" }, { status: 401 });
    }

    // Find user by calendar token
    const calendarToken = await db.calendarToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!calendarToken) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const userId = calendarToken.userId;

    // Get user's enrolled courses
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    // Get instructor courses
    const instructorCourses = await db.course.findMany({
      where: { instructorId: userId },
      select: { id: true },
    });
    const instructorCourseIds = instructorCourses.map((c) => c.id);

    const allCourseIds = [...new Set([...enrolledCourseIds, ...instructorCourseIds])];

    // Fetch all events for next 6 months and past 1 month
    const now = new Date();
    const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const futureDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

    const events = await db.calendarEvent.findMany({
      where: {
        OR: [
          { courseId: { in: allCourseIds } },
          { userId },
        ],
        startDate: { gte: pastDate, lte: futureDate },
      },
      include: {
        course: { select: { title: true } },
      },
      orderBy: { startDate: "asc" },
    });

    // Generate iCal content
    const ical = generateICalFeed(events, calendarToken.user.name || "User");

    return new NextResponse(ical, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": "inline; filename=civilabs-calendar.ics",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating iCal feed:", error);
    return NextResponse.json({ message: "Failed to generate calendar" }, { status: 500 });
  }
}

// POST /api/calendar/ical - Generate or regenerate subscription token
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const calendarToken = await db.calendarToken.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        token,
      },
      update: {
        token,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const subscriptionUrl = `${baseUrl}/api/calendar/ical?token=${calendarToken.token}`;

    return NextResponse.json({ token: calendarToken.token, subscriptionUrl });
  } catch (error) {
    console.error("Error generating calendar token:", error);
    return NextResponse.json({ message: "Failed to generate token" }, { status: 500 });
  }
}

interface CalendarEventWithCourse {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  allDay: boolean;
  type: string;
  course: { title: string } | null;
}

function generateICalFeed(events: CalendarEventWithCourse[], userName: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CiviLabs//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:CiviLabs - ${escapeIcal(userName)}`,
    "X-WR-TIMEZONE:UTC",
  ];

  for (const event of events) {
    const uid = `${event.id}@civilabs`;
    const dtStart = event.allDay
      ? formatDateOnly(event.startDate)
      : formatDateTime(event.startDate);
    const dtEnd = event.endDate
      ? event.allDay
        ? formatDateOnly(event.endDate)
        : formatDateTime(event.endDate)
      : event.allDay
        ? formatDateOnly(new Date(event.startDate.getTime() + 24 * 60 * 60 * 1000))
        : formatDateTime(new Date(event.startDate.getTime() + 60 * 60 * 1000));

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${formatDateTime(new Date())}`);

    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    } else {
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
    }

    const summary = event.course
      ? `[${event.course.title}] ${event.title}`
      : event.title;
    lines.push(`SUMMARY:${escapeIcal(summary)}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcal(event.description)}`);
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function formatDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function formatDateOnly(date: Date): string {
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

function escapeIcal(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
