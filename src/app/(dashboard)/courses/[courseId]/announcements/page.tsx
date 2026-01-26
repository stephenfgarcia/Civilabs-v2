"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Megaphone, Pin, ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  publishedAt: string;
  attachmentUrl: string | null;
  author: { id: string; name: string | null; image: string | null };
}

export default function CourseAnnouncementsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_data() {
      try {
        const [annRes, courseRes] = await Promise.all([
          fetch(`/api/courses/${courseId}/announcements`),
          fetch(`/api/courses/${courseId}`),
        ]);
        if (annRes.ok) { setAnnouncements(await annRes.json()); }
        if (courseRes.ok) {
          const courseData = await courseRes.json();
          setCourseTitle(courseData.title);
        }
      } catch { toast.error("Failed to load announcements"); }
      finally { setLoading(false); }
    }
    fetch_data();
  }, [courseId]);

  if (loading) return <div className="p-6">Loading announcements...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: courseTitle || "Course", href: `/courses/${courseId}` },
          { label: "Announcements" },
        ]}
      />

      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/courses/${courseId}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Course
        </Link>
      </Button>

      <h1 className="text-2xl font-bold">Announcements</h1>

      {announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No announcements for this course</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann.id} className={`border rounded-lg p-4 ${ann.isPinned ? "border-blue-200 bg-blue-50/30" : ""}`}>
              <div className="flex items-center gap-2 mb-2">
                {ann.isPinned && <Pin className="w-3 h-3 text-blue-600" />}
                <h3 className="font-medium">{ann.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ann.content}</p>
              {ann.attachmentUrl && (
                <a href={ann.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                  View Attachment
                </a>
              )}
              <div className="text-xs text-muted-foreground mt-3">
                {ann.author.name} &middot; {new Date(ann.publishedAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
