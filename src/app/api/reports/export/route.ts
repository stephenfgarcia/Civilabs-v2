import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Export data as CSV (Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "users";

    let csv = "";
    let filename = "";

    switch (type) {
      case "users": {
        const users = await db.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: {
              select: { enrollments: true, certificates: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        csv = "ID,Name,Email,Role,Enrollments,Certificates,Joined\n";
        csv += users
          .map((u) =>
            [
              u.id,
              escapeCsv(u.name || ""),
              u.email,
              u.role,
              u._count.enrollments,
              u._count.certificates,
              u.createdAt.toISOString().split("T")[0],
            ].join(",")
          )
          .join("\n");
        filename = "users-export.csv";
        break;
      }

      case "enrollments": {
        const enrollments = await db.enrollment.findMany({
          include: {
            user: { select: { name: true, email: true } },
            course: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        csv = "Student Name,Student Email,Course,Enrolled Date,Completed Date\n";
        csv += enrollments
          .map((e) =>
            [
              escapeCsv(e.user.name || ""),
              e.user.email,
              escapeCsv(e.course.title),
              e.createdAt.toISOString().split("T")[0],
              e.completedAt ? e.completedAt.toISOString().split("T")[0] : "In Progress",
            ].join(",")
          )
          .join("\n");
        filename = "enrollments-export.csv";
        break;
      }

      case "courses": {
        const courses = await db.course.findMany({
          include: {
            instructor: { select: { name: true } },
            category: { select: { name: true } },
            _count: {
              select: { enrollments: true, chapters: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        csv = "Title,Instructor,Category,Chapters,Enrollments,Published,Created\n";
        csv += courses
          .map((c) =>
            [
              escapeCsv(c.title),
              escapeCsv(c.instructor?.name || ""),
              escapeCsv(c.category?.name || "Uncategorized"),
              c._count.chapters,
              c._count.enrollments,
              c.isPublished ? "Yes" : "No",
              c.createdAt.toISOString().split("T")[0],
            ].join(",")
          )
          .join("\n");
        filename = "courses-export.csv";
        break;
      }

      case "certificates": {
        const certificates = await db.certificate.findMany({
          include: {
            user: { select: { name: true, email: true } },
            course: { select: { title: true } },
          },
          orderBy: { issuedAt: "desc" },
        });

        csv = "Student Name,Student Email,Course,Certificate Code,Issued Date\n";
        csv += certificates
          .map((c) =>
            [
              escapeCsv(c.user.name || ""),
              c.user.email,
              escapeCsv(c.course.title),
              c.uniqueCode,
              c.issuedAt.toISOString().split("T")[0],
            ].join(",")
          )
          .join("\n");
        filename = "certificates-export.csv";
        break;
      }

      case "quiz-attempts": {
        const attempts = await db.quizAttempt.findMany({
          include: {
            user: { select: { name: true, email: true } },
            quiz: {
              select: {
                title: true,
                chapter: {
                  select: {
                    course: { select: { title: true } },
                  },
                },
              },
            },
          },
          orderBy: { completedAt: "desc" },
        });

        csv = "Student Name,Student Email,Course,Quiz,Score,Passed,Date\n";
        csv += attempts
          .map((a) =>
            [
              escapeCsv(a.user.name || ""),
              a.user.email,
              escapeCsv(a.quiz.chapter.course.title),
              escapeCsv(a.quiz.title),
              a.score,
              a.passed ? "Yes" : "No",
              a.completedAt.toISOString().split("T")[0],
            ].join(",")
          )
          .join("\n");
        filename = "quiz-attempts-export.csv";
        break;
      }

      default:
        return NextResponse.json(
          { message: "Invalid export type" },
          { status: 400 }
        );
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
