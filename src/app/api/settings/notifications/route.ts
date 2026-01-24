import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notificationPreferenceSchema } from "@/lib/validations";

// Default preferences when no record exists yet
const DEFAULT_PREFERENCES = {
  emailEnrollment: true,
  emailCourseUpdates: true,
  emailCertificates: true,
  emailQuizResults: true,
  emailForumReplies: true,
  emailAnnouncements: true,
  emailChatMentions: false,
};

// GET /api/settings/notifications - Get notification preferences
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const preferences = await db.notificationPreference.findUnique({
      where: { userId: session.user.id },
      select: {
        emailEnrollment: true,
        emailCourseUpdates: true,
        emailCertificates: true,
        emailQuizResults: true,
        emailForumReplies: true,
        emailAnnouncements: true,
        emailChatMentions: true,
      },
    });

    // Return defaults if no record exists
    return NextResponse.json(preferences || DEFAULT_PREFERENCES);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { message: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/notifications - Update notification preferences
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = notificationPreferenceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Upsert: create if doesn't exist, update if it does
    const preferences = await db.notificationPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...validated.data,
      },
      update: validated.data,
      select: {
        emailEnrollment: true,
        emailCourseUpdates: true,
        emailCertificates: true,
        emailQuizResults: true,
        emailForumReplies: true,
        emailAnnouncements: true,
        emailChatMentions: true,
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { message: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
