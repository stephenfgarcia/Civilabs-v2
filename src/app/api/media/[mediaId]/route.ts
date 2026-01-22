import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ mediaId: string }>;
}

// GET /api/media/[mediaId] - Get single media item
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { mediaId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const media = await db.media.findUnique({
      where: { id: mediaId },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ message: "Media not found" }, { status: 404 });
    }

    // Check ownership
    if (media.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { message: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// PATCH /api/media/[mediaId] - Update media (rename)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { mediaId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const media = await db.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      return NextResponse.json({ message: "Media not found" }, { status: 404 });
    }

    // Check ownership
    if (media.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, courseId } = body;

    const updatedMedia = await db.media.update({
      where: { id: mediaId },
      data: {
        ...(name && { name }),
        ...(courseId !== undefined && { courseId: courseId || null }),
      },
    });

    return NextResponse.json(updatedMedia);
  } catch (error) {
    console.error("Error updating media:", error);
    return NextResponse.json(
      { message: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE /api/media/[mediaId] - Delete media record
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { mediaId } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const media = await db.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      return NextResponse.json({ message: "Media not found" }, { status: 404 });
    }

    // Check ownership
    if (media.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.media.delete({
      where: { id: mediaId },
    });

    // Note: The actual file on UploadThing should be deleted via their API
    // For now, we just remove the database record

    return NextResponse.json({ message: "Media deleted" });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { message: "Failed to delete media" },
      { status: 500 }
    );
  }
}
