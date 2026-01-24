import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { privacySettingsSchema } from "@/lib/validations";

// GET /api/settings/privacy - Get privacy settings
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { profileVisibility: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ profileVisibility: user.profileVisibility });
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch privacy settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/privacy - Update privacy settings (student only)
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = privacySettingsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { profileVisibility: validated.data.profileVisibility },
      select: { profileVisibility: true },
    });

    return NextResponse.json({ profileVisibility: user.profileVisibility });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return NextResponse.json(
      { message: "Failed to update privacy settings" },
      { status: 500 }
    );
  }
}
