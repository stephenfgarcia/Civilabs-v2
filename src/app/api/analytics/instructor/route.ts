import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInstructorAnalytics } from "@/lib/analytics";

// GET - Instructor analytics (instructor or admin)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const instructorId = searchParams.get("instructorId") || session.user.id;

    // Only admin can view other instructor's analytics
    if (instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const analytics = await getInstructorAnalytics(instructorId);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching instructor analytics:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
