import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { autoAssignGroupsSchema } from "@/lib/validations";

// POST /api/courses/[courseId]/groups/auto-assign - Auto-create and assign groups
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    // Only instructor/admin
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, title: true },
    });
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }
    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = autoAssignGroupsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { strategy, groupSize, groupNamePrefix } = validation.data;

    // Get all enrolled students who are NOT already in a group
    const enrolledStudents = await db.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    });

    const existingMembers = await db.groupMember.findMany({
      where: { group: { courseId } },
      select: { userId: true },
    });
    const existingMemberIds = new Set(existingMembers.map((m) => m.userId));

    const unassignedStudents = enrolledStudents
      .map((e) => e.userId)
      .filter((id) => !existingMemberIds.has(id));

    if (unassignedStudents.length === 0) {
      return NextResponse.json(
        { message: "No unassigned students to group" },
        { status: 400 }
      );
    }

    // Shuffle for random assignment
    let orderedStudents = [...unassignedStudents];

    if (strategy === "RANDOM") {
      // Fisher-Yates shuffle
      for (let i = orderedStudents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedStudents[i], orderedStudents[j]] = [orderedStudents[j], orderedStudents[i]];
      }
    } else if (strategy === "BALANCED") {
      // Balance by progress: fetch completion percentages
      const progressData = await db.userProgress.groupBy({
        by: ["userId"],
        where: {
          userId: { in: orderedStudents },
          lesson: { chapter: { courseId } },
          isCompleted: true,
        },
        _count: { id: true },
      });

      const progressMap = new Map(progressData.map((p) => [p.userId, p._count.id]));

      // Sort by progress (high to low)
      orderedStudents.sort(
        (a, b) => (progressMap.get(b) || 0) - (progressMap.get(a) || 0)
      );

      // Snake-draft: distribute alternating high/low performers across groups
      const numGroups = Math.ceil(orderedStudents.length / groupSize);
      const groups: string[][] = Array.from({ length: numGroups }, () => []);
      let forward = true;

      for (let i = 0; i < orderedStudents.length; i++) {
        const groupIndex = forward
          ? i % numGroups
          : numGroups - 1 - (i % numGroups);
        groups[groupIndex].push(orderedStudents[i]);
        if ((i + 1) % numGroups === 0) forward = !forward;
      }

      // Flatten back (already distributed)
      orderedStudents = groups.flat();
    }

    // Create groups and assign members
    const numGroups = Math.ceil(orderedStudents.length / groupSize);
    const existingGroupCount = await db.courseGroup.count({ where: { courseId } });

    const createdGroups = [];

    for (let i = 0; i < numGroups; i++) {
      const groupStudents = orderedStudents.slice(i * groupSize, (i + 1) * groupSize);
      const groupNumber = existingGroupCount + i + 1;

      const group = await db.courseGroup.create({
        data: {
          name: `${groupNamePrefix} ${groupNumber}`,
          courseId,
          maxMembers: groupSize,
          createdBy: session.user.id,
          members: {
            create: groupStudents.map((userId, idx) => ({
              userId,
              role: idx === 0 ? "LEADER" : "MEMBER", // First member is leader
            })),
          },
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          _count: { select: { members: true } },
        },
      });

      createdGroups.push(group);
    }

    return NextResponse.json({
      groupsCreated: createdGroups.length,
      studentsAssigned: orderedStudents.length,
      groups: createdGroups,
    }, { status: 201 });
  } catch (error) {
    console.error("Error auto-assigning groups:", error);
    return NextResponse.json({ message: "Failed to auto-assign groups" }, { status: 500 });
  }
}
