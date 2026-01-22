import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// GET - List all published learning paths
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const includeUnpublished = searchParams.get("includeUnpublished") === "true";

    // Only admins can see unpublished paths
    let canSeeUnpublished = false;
    if (session?.user && includeUnpublished) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      canSeeUnpublished = user?.role === "ADMIN";
    }

    const learningPaths = await db.learningPath.findMany({
      where: canSeeUnpublished ? {} : { isPublished: true },
      include: {
        courses: {
          orderBy: { position: "asc" },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                imageUrl: true,
                description: true,
                _count: {
                  select: { chapters: true },
                },
              },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { position: "asc" },
    });

    // If user is authenticated, include their enrollment status
    if (session?.user) {
      const enrollments = await db.learningPathEnrollment.findMany({
        where: {
          userId: session.user.id,
          learningPathId: { in: learningPaths.map((lp) => lp.id) },
        },
      });

      const enrollmentMap = new Map(
        enrollments.map((e) => [e.learningPathId, e])
      );

      return NextResponse.json(
        learningPaths.map((lp) => ({
          ...lp,
          enrollment: enrollmentMap.get(lp.id) || null,
        }))
      );
    }

    return NextResponse.json(learningPaths);
  } catch (error) {
    console.error("Error fetching learning paths:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a learning path (Admin only)
const createPathSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional(),
  courseIds: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only admins can create learning paths
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = createPathSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { title, description, imageUrl, courseIds } = validation.data;

    // Generate slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    let counter = 1;
    while (await db.learningPath.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Get max position
    const maxPosition = await db.learningPath.aggregate({
      _max: { position: true },
    });

    const learningPath = await db.learningPath.create({
      data: {
        title,
        slug,
        description,
        imageUrl,
        position: (maxPosition._max.position || 0) + 1,
        courses: courseIds
          ? {
              create: courseIds.map((courseId, index) => ({
                courseId,
                position: index + 1,
              })),
            }
          : undefined,
      },
      include: {
        courses: {
          include: {
            course: true,
          },
        },
      },
    });

    return NextResponse.json(learningPath, { status: 201 });
  } catch (error) {
    console.error("Error creating learning path:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
