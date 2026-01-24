import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { platformSettingsSchema } from "@/lib/validations";

// GET /api/admin/settings/platform - Get platform settings
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Get the first (singleton) settings record, or return defaults
    let settings = await db.platformSettings.findFirst();

    if (!settings) {
      // Create default settings on first access
      settings = await db.platformSettings.create({
        data: {},
      });
    }

    return NextResponse.json({
      registrationOpen: settings.registrationOpen,
      defaultRole: settings.defaultRole,
      maintenanceMode: settings.maintenanceMode,
      platformName: settings.platformName,
      platformDescription: settings.platformDescription,
      maxFileUploadSize: settings.maxFileUploadSize,
      allowedFileTypes: settings.allowedFileTypes,
    });
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch platform settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/settings/platform - Update platform settings
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = platformSettingsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Ensure a settings record exists
    let existing = await db.platformSettings.findFirst();

    if (!existing) {
      existing = await db.platformSettings.create({
        data: {},
      });
    }

    const settings = await db.platformSettings.update({
      where: { id: existing.id },
      data: {
        registrationOpen: validated.data.registrationOpen,
        defaultRole: validated.data.defaultRole,
        maintenanceMode: validated.data.maintenanceMode,
        platformName: validated.data.platformName,
        platformDescription: validated.data.platformDescription || null,
        maxFileUploadSize: validated.data.maxFileUploadSize,
        allowedFileTypes: validated.data.allowedFileTypes,
      },
    });

    return NextResponse.json({
      registrationOpen: settings.registrationOpen,
      defaultRole: settings.defaultRole,
      maintenanceMode: settings.maintenanceMode,
      platformName: settings.platformName,
      platformDescription: settings.platformDescription,
      maxFileUploadSize: settings.maxFileUploadSize,
      allowedFileTypes: settings.allowedFileTypes,
    });
  } catch (error) {
    console.error("Error updating platform settings:", error);
    return NextResponse.json(
      { message: "Failed to update platform settings" },
      { status: 500 }
    );
  }
}
