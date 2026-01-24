"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ClipboardList, Plus, Check, X, Clock, UserCheck } from "lucide-react";

interface AttendanceSession {
  id: string;
  date: string;
  title: string | null;
  type: string;
  notes: string | null;
  records: AttendanceRecord[];
  _count: { records: number };
}

interface AttendanceRecord {
  id: string;
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  notes: string | null;
  user: { id: string; name: string | null; email: string };
}

interface Student {
  id: string;
  name: string | null;
  email: string;
}

export default function AttendancePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("IN_PERSON");
  const [rollCall, setRollCall] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE" | "EXCUSED">>({});

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [sessRes, studRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/attendance`),
        fetch(`/api/courses/${courseId}/gradebook`), // Reuse for student list
      ]);
      if (sessRes.ok) { setSessions(await sessRes.json()); }
      if (studRes.ok) {
        const data = await studRes.json();
        setStudents(data.students || []);
      }
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }

  async function createSession() {
    // Initialize roll call with all students as PRESENT
    const initialRoll: Record<string, "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"> = {};
    students.forEach((s) => { initialRoll[s.id] = "PRESENT"; });

    try {
      const res = await fetch(`/api/courses/${courseId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle || undefined,
          type: newType,
          records: Object.entries(initialRoll).map(([userId, status]) => ({ userId, status })),
        }),
      });

      if (res.ok) {
        toast.success("Session created");
        setShowNew(false); setNewTitle(""); setNewType("IN_PERSON");
        fetchData();
      } else {
        const e = await res.json();
        toast.error(e.message);
      }
    } catch { toast.error("Error creating session"); }
  }

  async function updateRecords(sessionId: string) {
    try {
      const res = await fetch(`/api/courses/${courseId}/attendance/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: Object.entries(rollCall).map(([userId, status]) => ({ userId, status })),
        }),
      });

      if (res.ok) {
        toast.success("Attendance updated");
        setActiveSession(null); setRollCall({});
        fetchData();
      }
    } catch { toast.error("Error updating attendance"); }
  }

  async function deleteSession(sessionId: string) {
    if (!confirm("Delete this session?")) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/attendance/${sessionId}`, { method: "DELETE" });
      if (res.ok) { toast.success("Deleted"); fetchData(); }
    } catch { toast.error("Error deleting session"); }
  }

  function openRollCall(session: AttendanceSession) {
    setActiveSession(session.id);
    const initial: Record<string, "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"> = {};
    students.forEach((s) => {
      const record = session.records.find((r) => r.userId === s.id);
      initial[s.id] = record?.status || "PRESENT";
    });
    setRollCall(initial);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "PRESENT": return "bg-green-100 text-green-700";
      case "ABSENT": return "bg-red-100 text-red-700";
      case "LATE": return "bg-yellow-100 text-yellow-700";
      case "EXCUSED": return "bg-blue-100 text-blue-700";
      default: return "";
    }
  }

  if (loading) return <div className="p-6">Loading attendance...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">{sessions.length} sessions, {students.length} students</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Session
        </Button>
      </div>

      {showNew && (
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">New Attendance Session</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Title (optional)</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Week 5 Lab" />
            </div>
            <div className="w-40 space-y-1">
              <Label className="text-xs">Type</Label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full border rounded-md h-9 px-2 text-sm">
                <option value="IN_PERSON">In-Person</option>
                <option value="VIRTUAL">Virtual</option>
                <option value="ASYNC">Async</option>
              </select>
            </div>
            <Button size="sm" onClick={createSession}>Create & Take Roll</Button>
            <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Roll Call View */}
      {activeSession && (
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">Roll Call</h3>
          <div className="space-y-2">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm font-medium">{student.name || student.email}</span>
                <div className="flex gap-1">
                  {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setRollCall((prev) => ({ ...prev, [student.id]: status }))}
                      className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                        rollCall[student.id] === status ? getStatusColor(status) : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {status === "PRESENT" && <Check className="w-3 h-3 inline" />}
                      {status === "ABSENT" && <X className="w-3 h-3 inline" />}
                      {status === "LATE" && <Clock className="w-3 h-3 inline" />}
                      {status === "EXCUSED" && <UserCheck className="w-3 h-3 inline" />}
                      {" "}{status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => updateRecords(activeSession)}>Save Attendance</Button>
            <Button size="sm" variant="outline" onClick={() => { setActiveSession(null); setRollCall({}); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Session History */}
      {sessions.length === 0 && !showNew ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No attendance sessions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="border rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{s.title || new Date(s.date).toLocaleDateString()}</div>
                <div className="text-xs text-muted-foreground">
                  {s.type} &middot; {new Date(s.date).toLocaleDateString()} &middot; {s._count.records} records
                </div>
                {s.records.length > 0 && (
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-green-600">{s.records.filter((r) => r.status === "PRESENT").length} present</span>
                    <span className="text-xs text-red-600">{s.records.filter((r) => r.status === "ABSENT").length} absent</span>
                    <span className="text-xs text-yellow-600">{s.records.filter((r) => r.status === "LATE").length} late</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openRollCall(s)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteSession(s.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
