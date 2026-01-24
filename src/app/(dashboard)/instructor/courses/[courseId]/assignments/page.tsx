"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus, FileText, Link2, Type, Trash2,
  Edit2, Eye, EyeOff, Calendar, Users,
} from "lucide-react";
import NextLink from "next/link";

interface Assignment {
  id: string;
  title: string;
  type: string;
  points: number;
  dueDate: string | null;
  isPublished: boolean;
  _count: { submissions: number };
  chapter: { id: string; title: string } | null;
}

export default function InstructorAssignmentsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [title, setTitle] = useState("");
  const [type, setType] = useState("FILE_UPLOAD");
  const [points, setPoints] = useState(100);
  const [dueDate, setDueDate] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [maxSubmissions, setMaxSubmissions] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      const res = await fetch(`/api/courses/${courseId}/assignments`);
      if (res.ok) {
        setAssignments(await res.json());
      }
    } catch {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }

  async function createAssignment() {
    setCreating(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          points,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          isPublished,
          maxSubmissions,
        }),
      });
      if (res.ok) {
        toast.success("Assignment created");
        fetchAssignments();
        setShowCreate(false);
        setTitle("");
        setDueDate("");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create");
      }
    } catch {
      toast.error("Error creating assignment");
    } finally {
      setCreating(false);
    }
  }

  async function togglePublish(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/courses/${courseId}/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !current }),
      });
      if (res.ok) {
        fetchAssignments();
        toast.success(current ? "Unpublished" : "Published");
      }
    } catch {
      toast.error("Error toggling publish state");
    }
  }

  async function deleteAssignment(id: string) {
    if (!confirm("Delete this assignment? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/assignments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAssignments();
        toast.success("Assignment deleted");
      }
    } catch {
      toast.error("Error deleting assignment");
    }
  }

  function getTypeIcon(t: string) {
    switch (t) {
      case "FILE_UPLOAD": return <FileText className="w-4 h-4" />;
      case "URL_LINK": return <Link2 className="w-4 h-4" />;
      case "TEXT_ENTRY": return <Type className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  }

  if (loading) {
    return <div className="p-6">Loading assignments...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Manage course assignments and submissions</p>
        </div>
        <div className="flex gap-2">
          <NextLink href={`/instructor/courses/${courseId}/grading`}>
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Grading Queue
            </Button>
          </NextLink>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <h3 className="font-medium">Create Assignment</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
                  <SelectItem value="TEXT_ENTRY">Text Entry</SelectItem>
                  <SelectItem value="URL_LINK">URL Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Points</Label>
              <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} min={1} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Max Submissions</Label>
              <Input type="number" value={maxSubmissions} onChange={(e) => setMaxSubmissions(Number(e.target.value))} min={1} max={100} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <Label>Publish immediately</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={createAssignment} disabled={creating || !title.trim()}>
              {creating ? "Creating..." : "Create"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No assignments yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-2 bg-muted rounded">
                {getTypeIcon(a.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{a.title}</span>
                  {!a.isPublished && (
                    <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Draft</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{a.points} pts</span>
                  <span>{a.type.replace("_", " ").toLowerCase()}</span>
                  {a.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(a.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <span>{a._count.submissions} submission{a._count.submissions !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => togglePublish(a.id, a.isPublished)} title={a.isPublished ? "Unpublish" : "Publish"}>
                  {a.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteAssignment(a.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
