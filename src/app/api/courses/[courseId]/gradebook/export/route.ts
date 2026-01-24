import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// GET /api/courses/[courseId]/gradebook/export - Export gradebook as CSV
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, title: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Get all grade data
    const categories = await db.gradeCategory.findMany({
      where: { courseId },
      orderBy: { position: "asc" },
      include: {
        gradeItems: {
          orderBy: { createdAt: "asc" },
          include: {
            studentGrades: true,
          },
        },
      },
    });

    const enrollments = await db.enrollment.findMany({
      where: { courseId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Build CSV header
    const allItems = categories.flatMap((c) => c.gradeItems);
    const headers = ["Student Name", "Email", ...allItems.map((i) => i.title), "Weighted Total (%)"];

    // Build rows
    const rows = enrollments.map((enrollment) => {
      const student = enrollment.user;
      const scores: string[] = [];
      let weightedTotal = 0;
      let totalWeight = 0;

      for (const category of categories) {
        let categoryEarned = 0;
        let categoryPossible = 0;

        for (const item of category.gradeItems) {
          const grade = item.studentGrades.find((g) => g.userId === student.id);
          const effectiveScore = grade?.overrideScore ?? grade?.score;
          scores.push(effectiveScore !== undefined && effectiveScore !== null ? String(effectiveScore) : "");
          if (effectiveScore !== undefined && effectiveScore !== null) {
            categoryEarned += effectiveScore;
            categoryPossible += item.points;
          }
        }

        if (categoryPossible > 0 && category.weight > 0) {
          weightedTotal += (categoryEarned / categoryPossible) * category.weight;
          totalWeight += category.weight;
        }
      }

      const finalPercent = totalWeight > 0 ? ((weightedTotal / totalWeight) * 100).toFixed(1) : "";

      return [student.name || "Unknown", student.email, ...scores, finalPercent];
    });

    // Generate CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gradebook-${course.title.replace(/[^a-zA-Z0-9]/g, "_")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting gradebook:", error);
    return NextResponse.json({ message: "Failed to export gradebook" }, { status: 500 });
  }
}
