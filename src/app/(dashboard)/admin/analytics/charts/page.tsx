"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BarChart3, Users, BookOpen, TrendingUp } from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";

interface PlatformOverview {
  totalUsers: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  newUsersThisMonth: number;
  activeUsersThisWeek: number;
  totalSubmissions: number;
  roleDistribution: { role: string; count: number }[];
}

interface UserGrowthPoint {
  date: string;
  newUsers: number;
  totalUsers: number;
  students: number;
  instructors: number;
}

interface CourseStats {
  id: string;
  title: string;
  enrollments: number;
  chapters: number;
  completions: number;
  completionRate: number;
}

interface EnrollmentTrend {
  date: string;
  new: number;
  total: number;
}

interface ActivitySummary {
  heatmap: number[][];
  eventTypes: { type: string; count: number }[];
  totalActivities: number;
}

export default function AdminChartsDashboard() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthPoint[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [enrollmentTrends, setEnrollmentTrends] = useState<EnrollmentTrend[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [overviewRes, growthRes, courseRes, enrollRes, activityRes] = await Promise.all([
        fetch("/api/analytics/platform?type=overview"),
        fetch("/api/analytics/platform?type=user-growth"),
        fetch("/api/analytics/platform?type=course-stats"),
        fetch("/api/analytics/platform?type=enrollment-trends"),
        fetch("/api/analytics/platform?type=activity-summary"),
      ]);

      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (growthRes.ok) setUserGrowth(await growthRes.json());
      if (courseRes.ok) setCourseStats(await courseRes.json());
      if (enrollRes.ok) setEnrollmentTrends(await enrollRes.json());
      if (activityRes.ok) setActivitySummary(await activityRes.json());
    } catch {
      toast.error("Failed to load platform analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading platform analytics...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Platform Charts & Visualizations</h1>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={overview.totalUsers} sub={`+${overview.newUsersThisMonth} this month`} />
          <StatCard icon={BookOpen} label="Published Courses" value={overview.publishedCourses} sub={`${overview.totalCourses} total`} />
          <StatCard icon={TrendingUp} label="Enrollments" value={overview.totalEnrollments} sub={`${overview.completionRate}% completion`} />
          <StatCard icon={Users} label="Active (7d)" value={overview.activeUsersThisWeek} sub={`${overview.totalSubmissions} submissions`} />
        </div>
      )}

      {/* User Growth Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">User Growth (Last 90 Days)</h3>
          {userGrowth.length > 0 ? (
            <LineChart
              data={userGrowth}
              xKey="date"
              lines={[
                { key: "totalUsers", color: "#3B82F6", name: "Total Users" },
                { key: "students", color: "#22C55E", name: "Students" },
                { key: "instructors", color: "#F59E0B", name: "Instructors" },
              ]}
              height={280}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          )}
        </div>

        {/* Role Distribution Pie */}
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Role Distribution</h3>
          {overview && overview.roleDistribution.length > 0 ? (
            <PieChart
              data={overview.roleDistribution.map((r) => ({
                name: r.role.charAt(0) + r.role.slice(1).toLowerCase(),
                value: r.count,
              }))}
              height={250}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          )}
        </div>
      </div>

      {/* Enrollment Trends */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Platform Enrollment Trends (Last 90 Days)</h3>
        {enrollmentTrends.length > 0 ? (
          <LineChart
            data={enrollmentTrends}
            xKey="date"
            lines={[
              { key: "total", color: "#8B5CF6", name: "Total Enrollments" },
              { key: "new", color: "#EC4899", name: "New (daily)" },
            ]}
            height={250}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No data</p>
        )}
      </div>

      {/* Activity Heatmap */}
      {activitySummary && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">
            Activity Heatmap (Last 30 Days) — {activitySummary.totalActivities.toLocaleString()} total events
          </h3>
          <ActivityHeatmap data={activitySummary.heatmap} />
        </div>
      )}

      {/* Course Comparison */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Course Comparison — Enrollment vs Completion</h3>
        {courseStats.length > 0 ? (
          <BarChart
            data={courseStats.slice(0, 10).map((c) => ({
              name: c.title.length > 20 ? c.title.substring(0, 20) + "..." : c.title,
              enrollments: c.enrollments,
              completions: c.completions,
            }))}
            xKey="name"
            bars={[
              { key: "enrollments", color: "#3B82F6", name: "Enrollments" },
              { key: "completions", color: "#22C55E", name: "Completions" },
            ]}
            height={280}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No courses</p>
        )}
      </div>

      {/* Event Types Breakdown */}
      {activitySummary && activitySummary.eventTypes.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Activity by Event Type</h3>
          <BarChart
            data={activitySummary.eventTypes.sort((a, b) => b.count - a.count)}
            xKey="type"
            bars={[{ key: "count", color: "#6366F1", name: "Events" }]}
            height={200}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; sub: string }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
