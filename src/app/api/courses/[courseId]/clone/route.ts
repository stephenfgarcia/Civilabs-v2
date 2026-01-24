import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { courseCloneSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

function shiftDate(date: Date | null, days: number): Date | null {
  if (!date) return null;
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

// POST /api/courses/[courseId]/clone - Deep clone a course
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || (course.instructorId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = courseCloneSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const opts = validation.data;
    const dateShift = opts.dateShiftDays || 0;

    // Fetch full source course (always include all, filter during clone)
    const sourceCourse = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { position: "asc" },
          include: {
            lessons: { orderBy: { position: "asc" } },
            quiz: { include: { questions: { orderBy: { position: "asc" } } } },
            assignments: true,
          },
        },
        rubrics: { include: { criteria: { orderBy: { position: "asc" } } } },
        releaseConditions: true,
        announcements: true,
      },
    });

    if (!sourceCourse) {
      return NextResponse.json({ message: "Source course not found" }, { status: 404 });
    }

    // Generate unique slug
    const baseSlug = sourceCourse.slug + "-copy";
    let slug = baseSlug;
    let counter = 1;
    while (await db.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the new course
    const newCourse = await db.course.create({
      data: {
        title: opts.title,
        slug,
        description: sourceCourse.description,
        imageUrl: sourceCourse.imageUrl,
        isPublished: false, // Always start as draft
        instructorId: session.user.id,
        categoryId: sourceCourse.categoryId,
      },
    });

    // Clone rubrics first (needed for assignment references)
    const rubricMap: Record<string, string> = {};
    if (opts.includeRubrics && sourceCourse.rubrics) {
      for (const rubric of sourceCourse.rubrics) {
        const newRubric = await db.rubric.create({
          data: {
            title: rubric.title,
            description: rubric.description,
            courseId: newCourse.id,
            isTemplate: rubric.isTemplate,
            createdBy: session.user.id,
          },
        });
        rubricMap[rubric.id] = newRubric.id;

        if (rubric.criteria.length > 0) {
          await db.rubricCriterion.createMany({
            data: rubric.criteria.map((c) => ({
              rubricId: newRubric.id,
              title: c.title,
              description: c.description,
              position: c.position,
              maxPoints: c.maxPoints,
              levels: c.levels as Prisma.InputJsonValue,
            })),
          });
        }
      }
    }

    // Clone chapters, lessons, quizzes, assignments
    const chapterMap: Record<string, string> = {};

    for (const chapter of sourceCourse.chapters) {
      const newChapter = await db.chapter.create({
        data: {
          title: chapter.title,
          description: chapter.description,
          position: chapter.position,
          isPublished: false,
          isFree: chapter.isFree,
          courseId: newCourse.id,
          availableFrom: shiftDate(chapter.availableFrom, dateShift),
          availableUntil: shiftDate(chapter.availableUntil, dateShift),
        },
      });
      chapterMap[chapter.id] = newChapter.id;

      // Clone lessons
      for (const lesson of chapter.lessons) {
        await db.lesson.create({
          data: {
            title: lesson.title,
            description: lesson.description,
            type: lesson.type,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            attachmentUrl: lesson.attachmentUrl,
            sceneConfig: lesson.sceneConfig as Prisma.InputJsonValue ?? undefined,
            position: lesson.position,
            duration: lesson.duration,
            chapterId: newChapter.id,
            availableFrom: shiftDate(lesson.availableFrom, dateShift),
            availableUntil: shiftDate(lesson.availableUntil, dateShift),
          },
        });
      }

      // Clone quiz/assessment
      if (opts.includeAssessments && chapter.quiz) {
        const quiz = chapter.quiz;
        const newQuiz = await db.quiz.create({
          data: {
            title: quiz.title,
            description: quiz.description,
            passingScore: quiz.passingScore,
            chapterId: newChapter.id,
            assessmentType: quiz.assessmentType,
            timeLimit: quiz.timeLimit,
            attemptLimit: quiz.attemptLimit,
            availableFrom: shiftDate(quiz.availableFrom, dateShift),
            availableUntil: shiftDate(quiz.availableUntil, dateShift),
            shuffleQuestions: quiz.shuffleQuestions,
            shuffleOptions: quiz.shuffleOptions,
            showAnswersAfter: quiz.showAnswersAfter,
            isProctored: quiz.isProctored,
            passwordProtected: quiz.passwordProtected,
            ipRestrictions: quiz.ipRestrictions as Prisma.InputJsonValue ?? undefined,
            honorCodeRequired: quiz.honorCodeRequired,
            lateGracePeriod: quiz.lateGracePeriod,
            lateSubmissionPolicy: quiz.lateSubmissionPolicy,
            latePenaltyPercent: quiz.latePenaltyPercent,
            poolSize: quiz.poolSize,
          },
        });

        // Clone questions
        if (quiz.questions.length > 0) {
          await db.question.createMany({
            data: quiz.questions.map((q) => ({
              text: q.text,
              type: q.type,
              options: q.options as Prisma.InputJsonValue ?? undefined,
              correctAnswer: q.correctAnswer,
              points: q.points,
              position: q.position,
              quizId: newQuiz.id,
              explanation: q.explanation,
              acceptedAnswers: q.acceptedAnswers as Prisma.InputJsonValue ?? undefined,
              matchingPairs: q.matchingPairs as Prisma.InputJsonValue ?? undefined,
              orderingItems: q.orderingItems as Prisma.InputJsonValue ?? undefined,
              correctBoolAnswer: q.correctBoolAnswer,
              blanks: q.blanks as Prisma.InputJsonValue ?? undefined,
              multiSelectAnswers: q.multiSelectAnswers as Prisma.InputJsonValue ?? undefined,
              partialCreditEnabled: q.partialCreditEnabled,
              essayWordLimit: q.essayWordLimit,
            })),
          });
        }
      }

      // Clone assignments
      if (opts.includeAssignments && chapter.assignments) {
        for (const assignment of chapter.assignments) {
          await db.assignment.create({
            data: {
              title: assignment.title,
              description: assignment.description,
              type: assignment.type,
              courseId: newCourse.id,
              chapterId: newChapter.id,
              dueDate: shiftDate(assignment.dueDate, dateShift),
              points: assignment.points,
              isPublished: false,
              position: assignment.position,
              allowedFileTypes: assignment.allowedFileTypes,
              maxFileSize: assignment.maxFileSize,
              maxSubmissions: assignment.maxSubmissions,
              latePolicy: assignment.latePolicy,
              latePenaltyPercent: assignment.latePenaltyPercent,
              availableFrom: shiftDate(assignment.availableFrom, dateShift),
              availableUntil: shiftDate(assignment.availableUntil, dateShift),
              rubricId: assignment.rubricId ? rubricMap[assignment.rubricId] ?? null : null,
              isGroupAssignment: assignment.isGroupAssignment,
            },
          });
        }
      }
    }

    // Clone release conditions
    if (opts.includeReleaseConditions && sourceCourse.releaseConditions) {
      for (const condition of sourceCourse.releaseConditions) {
        // Map targetId to new IDs
        let newTargetId = condition.targetId;
        if (condition.targetType === "CHAPTER" && chapterMap[condition.targetId]) {
          newTargetId = chapterMap[condition.targetId];
        }

        await db.releaseCondition.create({
          data: {
            targetType: condition.targetType,
            targetId: newTargetId,
            courseId: newCourse.id,
            conditionType: condition.conditionType,
            conditionValue: condition.conditionValue as Prisma.InputJsonValue,
            operator: condition.operator,
            position: condition.position,
          },
        });
      }
    }

    // Clone announcements
    if (opts.includeAnnouncements && sourceCourse.announcements) {
      for (const ann of sourceCourse.announcements) {
        await db.announcement.create({
          data: {
            title: ann.title,
            content: ann.content,
            courseId: newCourse.id,
            authorId: session.user.id,
            isPinned: ann.isPinned,
            isPublished: false, // Draft until instructor publishes
            attachmentUrl: ann.attachmentUrl,
          },
        });
      }
    }

    return NextResponse.json({
      id: newCourse.id,
      title: newCourse.title,
      slug: newCourse.slug,
      message: "Course cloned successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Error cloning course:", error);
    return NextResponse.json({ message: "Failed to clone course" }, { status: 500 });
  }
}
