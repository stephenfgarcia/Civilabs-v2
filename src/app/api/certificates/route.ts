import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendCertificateEmail } from "@/lib/email";

// GET /api/certificates - Get user's certificates
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const certificates = await db.certificate.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            instructor: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return NextResponse.json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { message: "Failed to fetch certificates" },
      { status: 500 }
    );
  }
}

// POST /api/certificates - Generate a certificate for a completed course
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { message: "Course ID is required" },
        { status: 400 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: "You are not enrolled in this course" },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const existingCertificate = await db.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (existingCertificate) {
      return NextResponse.json(existingCertificate);
    }

    // Check if course is completed (all lessons completed and all quizzes passed)
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          where: { isPublished: true },
          include: {
            lessons: true,
            quiz: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    // Get all lesson IDs from published chapters
    const lessonIds = course.chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => lesson.id)
    );

    // Check progress for all lessons
    const completedLessons = await db.userProgress.count({
      where: {
        userId: session.user.id,
        lessonId: { in: lessonIds },
        isCompleted: true,
      },
    });

    if (completedLessons < lessonIds.length) {
      return NextResponse.json(
        {
          message: `Complete all lessons first. Progress: ${completedLessons}/${lessonIds.length}`,
        },
        { status: 400 }
      );
    }

    // Check quiz completion for chapters with quizzes
    const chaptersWithQuizzes = course.chapters.filter(
      (chapter) => chapter.quiz
    );

    for (const chapter of chaptersWithQuizzes) {
      if (!chapter.quiz) continue;

      const quizAttempt = await db.quizAttempt.findFirst({
        where: {
          userId: session.user.id,
          quizId: chapter.quiz.id,
          passed: true,
        },
      });

      if (!quizAttempt) {
        return NextResponse.json(
          {
            message: `Pass the quiz in chapter "${chapter.title}" to get your certificate`,
          },
          { status: 400 }
        );
      }
    }

    // All requirements met - create certificate
    const certificate = await db.certificate.create({
      data: {
        userId: session.user.id,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            instructor: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update enrollment as completed
    await db.enrollment.update({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
      data: {
        completedAt: new Date(),
      },
    });

    // Send certificate email (non-blocking)
    if (session.user.email) {
      sendCertificateEmail(
        session.user.email,
        certificate.user.name || "Student",
        certificate.course.title,
        certificate.uniqueCode
      ).catch((error) => {
        console.error("Failed to send certificate email:", error);
      });
    }

    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    console.error("Error generating certificate:", error);
    return NextResponse.json(
      { message: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
