import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserActivitySummary } from "@/lib/analytics";

// GET - User activity summary
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId") || session.user.id;

    // Only admin can view other user's analytics
    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const analytics = await getUserActivitySummary(userId);

    if (!analytics) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
