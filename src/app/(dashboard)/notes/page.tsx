import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { StickyNote, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const notes = await db.note.findMany({
    where: { userId: session.user.id },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          chapter: {
            select: {
              id: true,
              title: true,
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group notes by course
  const notesByCourse = notes.reduce(
    (acc, note) => {
      const courseId = note.lesson.chapter.course.id;
      if (!acc[courseId]) {
        acc[courseId] = {
          course: note.lesson.chapter.course,
          notes: [],
        };
      }
      acc[courseId].notes.push(note);
      return acc;
    },
    {} as Record<string, { course: { id: string; title: string }; notes: typeof notes }>
  );

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold">My Notes</h1>
        <p className="text-muted-foreground mt-1">
          Personal notes taken across your courses
        </p>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <StickyNote className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">No notes yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              Take notes while learning to review key points later.
              Use the notes icon on any lesson page.
            </p>
            <Button asChild className="mt-4">
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(notesByCourse).map(({ course, notes: courseNotes }) => (
            <Card key={course.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {courseNotes.length} note{courseNotes.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {courseNotes.map((note) => (
                    <Link
                      key={note.id}
                      href={`/courses/${course.id}/learn?lesson=${note.lesson.id}`}
                      className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-medium text-primary">
                          {note.lesson.chapter.title} &rsaquo; {note.lesson.title}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
