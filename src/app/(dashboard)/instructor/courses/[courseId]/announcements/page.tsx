"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Megaphone, Plus, Pin, Trash2, Edit, Eye, EyeOff } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: string;
  scheduledFor: string | null;
  attachmentUrl: string | null;
  author: { id: string; name: string | null; image: string | null };
}

export default function AnnouncementsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => { fetchAnnouncements(); }, []);

  async function fetchAnnouncements() {
    try {
      const res = await fetch(`/api/courses/${courseId}/announcements`);
      if (res.ok) { setAnnouncements(await res.json()); }
    } catch { toast.error("Failed to load announcements"); }
    finally { setLoading(false); }
  }

  async function saveAnnouncement() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    try {
      const url = editingId
        ? `/api/courses/${courseId}/announcements/${editingId}`
        : `/api/courses/${courseId}/announcements`;

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, isPinned }),
      });

      if (res.ok) {
        toast.success(editingId ? "Updated" : "Posted");
        resetForm();
        fetchAnnouncements();
      } else {
        const e = await res.json();
        toast.error(e.message);
      }
    } catch { toast.error("Error saving announcement"); }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/announcements/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Deleted"); fetchAnnouncements(); }
    } catch { toast.error("Error deleting"); }
  }

  async function togglePublish(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/courses/${courseId}/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !current }),
      });
      if (res.ok) { fetchAnnouncements(); }
    } catch { toast.error("Error toggling visibility"); }
  }

  async function togglePin(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/courses/${courseId}/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !current }),
      });
      if (res.ok) { fetchAnnouncements(); }
    } catch { toast.error("Error toggling pin"); }
  }

  function editAnnouncement(ann: Announcement) {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setIsPinned(ann.isPinned);
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setTitle(""); setContent(""); setIsPinned(false);
  }

  if (loading) return <div className="p-6">Loading announcements...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground">{announcements.length} announcement{announcements.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Announcement
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">{editingId ? "Edit" : "New"} Announcement</h3>
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Content</Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              className="w-full min-h-[120px] border rounded-md p-3 text-sm resize-y"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
              Pin to top
            </label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveAnnouncement}>{editingId ? "Update" : "Post"}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className={`border rounded-lg p-4 ${ann.isPinned ? "border-blue-200 bg-blue-50/50" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {ann.isPinned && <Pin className="w-3 h-3 text-blue-600" />}
                    <h3 className="font-medium">{ann.title}</h3>
                    {!ann.isPublished && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Draft</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{ann.content}</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {ann.author.name} &middot; {new Date(ann.publishedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  <Button size="sm" variant="ghost" onClick={() => togglePin(ann.id, ann.isPinned)}>
                    <Pin className={`w-3 h-3 ${ann.isPinned ? "text-blue-600" : ""}`} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => togglePublish(ann.id, ann.isPublished)}>
                    {ann.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => editAnnouncement(ann)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteAnnouncement(ann.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
