"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Activity, AlertTriangle, Clock, BookOpen, FileText } from "lucide-react";

interface StudentActivity {
  id: string;
  name: string | null;
  email: string;
  lastActivity: string | null;
  daysSinceActivity: number;
  eventCount: number;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  submissionCount: number;
  isAtRisk: boolean;
}

export default function ActivityPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => { fetchActivity(); }, [period]);

  async function fetchActivity() {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/activity?days=${period}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch { toast.error("Failed to load activity data"); }
    finally { setLoading(false); }
  }

  const atRiskCount = students.filter((s) => s.isAtRisk).length;
  const avgProgress = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + s.progressPercent, 0) / students.length)
    : 0;

  if (loading) return <div className="p-6">Loading activity data...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Student Activity</h1>
          <p className="text-sm text-muted-foreground">{students.length} students tracked over {period} days</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 60].map((d) => (
            <Button key={d} size="sm" variant={period === d ? "default" : "outline"} onClick={() => setPeriod(d)}>
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <AlertTriangle className="w-4 h-4" />
            At-Risk Students
          </div>
          <div className="text-2xl font-bold text-red-600">{atRiskCount}</div>
          <div className="text-xs text-muted-foreground">No activity 7+ days or &lt;30% progress</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <BookOpen className="w-4 h-4" />
            Avg. Progress
          </div>
          <div className="text-2xl font-bold">{avgProgress}%</div>
          <div className="text-xs text-muted-foreground">Lessons completed</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Activity className="w-4 h-4" />
            Total Events
          </div>
          <div className="text-2xl font-bold">{students.reduce((sum, s) => sum + s.eventCount, 0)}</div>
          <div className="text-xs text-muted-foreground">In last {period} days</div>
        </div>
      </div>

      {/* Student List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Student</th>
              <th className="text-center p-3">Last Active</th>
              <th className="text-center p-3">Progress</th>
              <th className="text-center p-3">Events</th>
              <th className="text-center p-3">Submissions</th>
              <th className="text-center p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className={`border-t ${student.isAtRisk ? "bg-red-50/50" : ""}`}>
                <td className="p-3">
                  <div className="font-medium">{student.name || "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{student.email}</div>
                </td>
                <td className="p-3 text-center">
                  {student.lastActivity ? (
                    <div>
                      <div className="text-xs">{new Date(student.lastActivity).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {student.daysSinceActivity}d ago
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Never</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${student.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs">{student.progressPercent}%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {student.completedLessons}/{student.totalLessons}
                  </div>
                </td>
                <td className="p-3 text-center text-xs">{student.eventCount}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs">
                    <FileText className="w-3 h-3" />
                    {student.submissionCount}
                  </div>
                </td>
                <td className="p-3 text-center">
                  {student.isAtRisk ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> At Risk
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
