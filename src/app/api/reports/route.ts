import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generateEnrollmentReport,
  generateProgressReport,
  generateQuizResultReport,
  generateUsersReport,
  generateCoursesReport,
  convertToCSV,
} from "@/lib/reports";

// GET - Generate reports (admin only)
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
    const type = searchParams.get("type");
    const format = searchParams.get("format") || "json";
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const courseId = searchParams.get("courseId") || undefined;
    const userId = searchParams.get("userId") || undefined;

    if (!type) {
      return NextResponse.json(
        { message: "Report type is required" },
        { status: 400 }
      );
    }

    const config = {
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      courseId,
      userId,
    };

    let data: Record<string, unknown>[];

    switch (type) {
      case "enrollments":
        data = (await generateEnrollmentReport(config)) as unknown as Record<string, unknown>[];
        break;
      case "progress":
        data = (await generateProgressReport(config)) as unknown as Record<string, unknown>[];
        break;
      case "quiz-results":
        data = (await generateQuizResultReport(config)) as unknown as Record<string, unknown>[];
        break;
      case "users":
        data = (await generateUsersReport(config)) as unknown as Record<string, unknown>[];
        break;
      case "courses":
        data = (await generateCoursesReport()) as unknown as Record<string, unknown>[];
        break;
      default:
        return NextResponse.json(
          { message: "Invalid report type" },
          { status: 400 }
        );
    }

    if (format === "csv") {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
