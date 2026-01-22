import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MediaLibrary } from "@/components/media/media-library";

export default async function MediaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get user's courses for filtering
  const courses = await db.course.findMany({
    where: { instructorId: session.user.id },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  // Get initial media
  const media = await db.media.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      course: {
        select: { id: true, title: true },
      },
    },
  });

  const totalCount = await db.media.count({
    where: { userId: session.user.id },
  });

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-3xl font-bold">Media Library</h1>
        <p className="text-muted-foreground mt-1">
          Manage your uploaded files - images, videos, documents, and 3D models
        </p>
      </div>

      <MediaLibrary
        initialMedia={media}
        initialTotal={totalCount}
        courses={courses}
      />
    </div>
  );
}
