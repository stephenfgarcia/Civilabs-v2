import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  BookmarkCheck,
  BookOpen,
  Video,
  FileText,
  Box,
  Type,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const lessonTypeIcons: Record<string, typeof Video> = {
  VIDEO: Video,
  PDF: FileText,
  DOCUMENT: FileText,
  POWERPOINT: FileText,
  SCENE_3D: Box,
  TEXT: Type,
};

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const bookmarks = await db.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      lesson: {
        include: {
          chapter: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group bookmarks by course
  const bookmarksByCourse = bookmarks.reduce(
    (acc, bookmark) => {
      const courseId = bookmark.lesson.chapter.course.id;
      if (!acc[courseId]) {
        acc[courseId] = {
          course: bookmark.lesson.chapter.course,
          bookmarks: [],
        };
      }
      acc[courseId].bookmarks.push(bookmark);
      return acc;
    },
    {} as Record<string, { course: { id: string; title: string; imageUrl: string | null }; bookmarks: typeof bookmarks }>
  );

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <p className="text-muted-foreground mt-1">
          Lessons you&apos;ve saved for quick access
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookmarkCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">No bookmarks yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              Bookmark lessons while learning to quickly find them later.
              Use the bookmark icon on any lesson page.
            </p>
            <Button asChild className="mt-4">
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(bookmarksByCourse).map(({ course, bookmarks: courseBookmarks }) => (
            <Card key={course.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <BookOpen className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {courseBookmarks.length} bookmarked lesson{courseBookmarks.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="divide-y">
                  {courseBookmarks.map((bookmark) => {
                    const Icon = lessonTypeIcons[bookmark.lesson.type] || FileText;
                    return (
                      <Link
                        key={bookmark.id}
                        href={`/courses/${course.id}/learn?lesson=${bookmark.lesson.id}`}
                        className="flex items-center gap-3 py-3 hover:bg-muted/50 px-2 -mx-2 rounded-md transition-colors"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {bookmark.lesson.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {bookmark.lesson.chapter.title}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(bookmark.createdAt).toLocaleDateString()}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
