import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPlatformAnalytics,
  getEnrollmentTrends,
  getTopCourses,
  getCategoryDistribution,
} from "@/lib/analytics";

// GET - Platform analytics (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "overview";

    switch (type) {
      case "overview": {
        const analytics = await getPlatformAnalytics();
        return NextResponse.json(analytics);
      }
      case "trends": {
        const days = parseInt(searchParams.get("days") || "30", 10);
        const trends = await getEnrollmentTrends(days);
        return NextResponse.json(trends);
      }
      case "top-courses": {
        const limit = parseInt(searchParams.get("limit") || "5", 10);
        const courses = await getTopCourses(limit);
        return NextResponse.json(courses);
      }
      case "categories": {
        const distribution = await getCategoryDistribution();
        return NextResponse.json(distribution);
      }
      default:
        return NextResponse.json(
          { message: "Invalid analytics type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
