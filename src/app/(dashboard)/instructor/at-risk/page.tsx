"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, Clock, TrendingDown, FileX, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AtRiskStudent {
  userId: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  courseId: string;
  courseName: string;
  risks: string[];
  riskScore: number;
  lastActivity: string | null;
  progressPercent: number;
  missedAssignments: number;
  enrolledAt: string;
}

interface AtRiskData {
  students: AtRiskStudent[];
  summary: {
    total: number;
    inactive: number;
    lowProgress: number;
    missedAssignments: number;
  };
  courses: { id: string; title: string; atRiskCount: number }[];
}

export default function AtRiskPage() {
  const [data, setData] = useState<AtRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, [courseFilter, riskFilter]);

  async function fetchData() {
    try {
      const params = new URLSearchParams();
      if (courseFilter) params.set("courseId", courseFilter);
      if (riskFilter) params.set("risk", riskFilter);
      const res = await fetch(`/api/analytics/at-risk?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } catch {
      toast.error("Failed to load at-risk data");
    } finally {
      setLoading(false);
    }
  }

  function getTimeSince(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  }

  function getRiskBadge(risk: string) {
    switch (risk) {
      case "inactive":
        return { label: "Inactive", color: "bg-orange-100 text-orange-700", icon: Clock };
      case "low_progress":
        return { label: "Low Progress", color: "bg-red-100 text-red-700", icon: TrendingDown };
      case "missed_assignments":
        return { label: "Missed Work", color: "bg-purple-100 text-purple-700", icon: FileX };
      default:
        return { label: risk, color: "bg-gray-100 text-gray-700", icon: AlertTriangle };
    }
  }

  if (loading) return <div className="p-6">Loading at-risk students...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-amber-500" />
        <h1 className="text-2xl font-bold">At-Risk Students</h1>
      </div>

      {/* Summary Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{data.summary.total}</p>
            <p className="text-xs text-muted-foreground">Total At-Risk</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{data.summary.inactive}</p>
            <p className="text-xs text-muted-foreground">Inactive (7+ days)</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{data.summary.lowProgress}</p>
            <p className="text-xs text-muted-foreground">Low Progress (&lt;30%)</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{data.summary.missedAssignments}</p>
            <p className="text-xs text-muted-foreground">Missed Assignments</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          className="border rounded px-2 py-1 text-sm"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="">All Courses</option>
          {data?.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.atRiskCount})
            </option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="">All Risks</option>
          <option value="inactive">Inactive</option>
          <option value="failing">Low Progress</option>
          <option value="missed">Missed Assignments</option>
        </select>
        {(courseFilter || riskFilter) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setCourseFilter(""); setRiskFilter(""); }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Student List */}
      {data && data.students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No at-risk students found</p>
          <p className="text-sm mt-1">All students are on track</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr className="text-xs font-medium text-muted-foreground">
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Course</th>
                <th className="text-left p-3">Risks</th>
                <th className="text-right p-3">Progress</th>
                <th className="text-right p-3">Last Activity</th>
                <th className="text-right p-3">Missed</th>
              </tr>
            </thead>
            <tbody>
              {data?.students.map((student, idx) => (
                <tr key={`${student.userId}-${student.courseId}-${idx}`} className="border-t hover:bg-muted/20">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {student.user.name?.charAt(0) || student.user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{student.user.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{student.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{student.courseName}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {student.risks.map((risk) => {
                        const badge = getRiskBadge(risk);
                        return (
                          <span key={risk} className={`text-xs px-1.5 py-0.5 rounded ${badge.color}`}>
                            {badge.label}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.progressPercent > 60 ? "bg-green-500" :
                            student.progressPercent > 30 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${student.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-7">{student.progressPercent}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-right text-xs text-muted-foreground">
                    {getTimeSince(student.lastActivity)}
                  </td>
                  <td className="p-3 text-right">
                    {student.missedAssignments > 0 && (
                      <span className="text-xs font-medium text-red-600">{student.missedAssignments}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
