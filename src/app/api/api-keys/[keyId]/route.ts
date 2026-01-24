import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE /api/api-keys/[keyId] - Revoke an API key
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { keyId } = await params;

    const existing = await db.aPIKey.findFirst({
      where: { id: keyId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ message: "API key not found" }, { status: 404 });
    }

    // Soft-revoke: mark as inactive rather than delete (preserves audit trail)
    await db.aPIKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "API key revoked" });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return NextResponse.json({ message: "Failed to revoke API key" }, { status: 500 });
  }
}
