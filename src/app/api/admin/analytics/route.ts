import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/analytics - Get platform analytics
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const periodDays = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get user growth data
    const usersByDay = await db.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get enrollment data
    const enrollmentsByDay = await db.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM enrollments
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get top courses by enrollments
    const topCourses = await db.course.findMany({
      where: { isPublished: true },
      orderBy: {
        enrollments: {
          _count: "desc",
        },
      },
      take: 10,
      include: {
        instructor: {
          select: { name: true },
        },
        _count: {
          select: { enrollments: true, certificates: true },
        },
      },
    });

    // Get top instructors
    const topInstructors = await db.user.findMany({
      where: { role: "INSTRUCTOR" },
      orderBy: {
        courses: {
          _count: "desc",
        },
      },
      take: 10,
      select: {
        id: true,
        name: true,
        image: true,
        _count: {
          select: { courses: true },
        },
        courses: {
          select: {
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
    });

    // Calculate completion rate
    const totalEnrollments = await db.enrollment.count();
    const completedEnrollments = await db.enrollment.count({
      where: { completedAt: { not: null } },
    });
    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    // Get category distribution
    const categoryStats = await db.category.findMany({
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });

    // Get quiz statistics
    const quizStats = await db.quizAttempt.aggregate({
      _avg: { score: true },
      _count: true,
    });

    const passedQuizzes = await db.quizAttempt.count({
      where: { passed: true },
    });

    return NextResponse.json({
      userGrowth: usersByDay.map((item) => ({
        date: item.date,
        count: Number(item.count),
      })),
      enrollmentGrowth: enrollmentsByDay.map((item) => ({
        date: item.date,
        count: Number(item.count),
      })),
      topCourses: topCourses.map((course) => ({
        id: course.id,
        title: course.title,
        instructor: course.instructor.name,
        enrollments: course._count.enrollments,
        certificates: course._count.certificates,
      })),
      topInstructors: topInstructors.map((instructor) => ({
        id: instructor.id,
        name: instructor.name,
        image: instructor.image,
        courseCount: instructor._count.courses,
        totalStudents: instructor.courses.reduce(
          (acc, course) => acc + course._count.enrollments,
          0
        ),
      })),
      completionRate,
      categoryDistribution: categoryStats.map((cat) => ({
        name: cat.name,
        courses: cat._count.courses,
      })),
      quizStats: {
        totalAttempts: quizStats._count,
        averageScore: Math.round(quizStats._avg.score || 0),
        passRate:
          quizStats._count > 0
            ? Math.round((passedQuizzes / quizStats._count) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { message: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
