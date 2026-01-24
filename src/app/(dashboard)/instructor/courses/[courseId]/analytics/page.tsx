"use client";

import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { BarChart3, TrendingUp, Clock, Target } from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";

interface OverviewData {
  totalEnrollments: number;
  completions: number;
  completionRate: number;
  averageGrade: number | null;
  activeStudentsLast7Days: number;
}

interface EnrollmentTrend {
  date: string;
  new: number;
  total: number;
}

interface GradeDistribution {
  buckets: { range: string; count: number }[];
  assignmentDistributions: {
    id: string;
    title: string;
    count: number;
    averagePercent: number;
  }[];
}

interface CompletionRate {
  id: string;
  title: string;
  position: number;
  completionRate: number;
  completedStudents: number;
  totalStudents: number;
}

interface TimeOnTask {
  lessonId: string;
  title: string;
  type: string;
  avgMinutes: number;
  totalViewers: number;
}

interface ItemAnalysis {
  id: string;
  text: string;
  type: string;
  quizTitle: string;
  attempts: number;
  successRate: number;
  difficulty: string;
}

export default function CourseAnalyticsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [enrollmentTrends, setEnrollmentTrends] = useState<EnrollmentTrend[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution | null>(null);
  const [completionRates, setCompletionRates] = useState<CompletionRate[]>([]);
  const [timeOnTask, setTimeOnTask] = useState<TimeOnTask[]>([]);
  const [itemAnalysis, setItemAnalysis] = useState<ItemAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "grades" | "time" | "items">("overview");

  useEffect(() => {
    fetchAllData();
  }, [courseId]);

  async function fetchAllData() {
    try {
      const [overviewRes, trendsRes, gradesRes, completionRes, timeRes, itemsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/analytics?type=overview`),
        fetch(`/api/courses/${courseId}/analytics?type=enrollment-trends`),
        fetch(`/api/courses/${courseId}/analytics?type=grade-distribution`),
        fetch(`/api/courses/${courseId}/analytics?type=completion-rates`),
        fetch(`/api/courses/${courseId}/analytics?type=time-on-task`),
        fetch(`/api/courses/${courseId}/analytics?type=item-analysis`),
      ]);

      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (trendsRes.ok) setEnrollmentTrends(await trendsRes.json());
      if (gradesRes.ok) setGradeDistribution(await gradesRes.json());
      if (completionRes.ok) setCompletionRates(await completionRes.json());
      if (timeRes.ok) setTimeOnTask(await timeRes.json());
      if (itemsRes.ok) setItemAnalysis(await itemsRes.json());
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading analytics...</div>;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: TrendingUp },
    { id: "grades" as const, label: "Grades", icon: BarChart3 },
    { id: "time" as const, label: "Time on Task", icon: Clock },
    { id: "items" as const, label: "Question Analysis", icon: Target },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Course Analytics</h1>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Enrollments" value={overview.totalEnrollments} />
          <StatCard label="Completions" value={overview.completions} />
          <StatCard label="Completion Rate" value={`${overview.completionRate}%`} />
          <StatCard label="Avg Grade" value={overview.averageGrade ? `${overview.averageGrade}%` : "N/A"} />
          <StatCard label="Active (7d)" value={overview.activeStudentsLast7Days} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Enrollment Trends */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Enrollment Trends (Last 90 Days)</h3>
            {enrollmentTrends.length > 0 ? (
              <LineChart
                data={enrollmentTrends}
                xKey="date"
                lines={[
                  { key: "total", color: "#3B82F6", name: "Total Enrollments" },
                  { key: "new", color: "#22C55E", name: "New (daily)" },
                ]}
                height={280}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No enrollment data available</p>
            )}
          </div>

          {/* Completion by Chapter */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Completion Rate by Chapter</h3>
            {completionRates.length > 0 ? (
              <BarChart
                data={completionRates.map((c) => ({
                  name: c.title.length > 20 ? c.title.substring(0, 20) + "..." : c.title,
                  rate: c.completionRate,
                }))}
                xKey="name"
                bars={[{ key: "rate", color: "#3B82F6", name: "Completion %" }]}
                height={250}
                yLabel="%"
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No completion data</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "grades" && (
        <div className="space-y-6">
          {/* Grade Distribution Histogram */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Overall Grade Distribution</h3>
            {gradeDistribution && gradeDistribution.buckets.some((b) => b.count > 0) ? (
              <BarChart
                data={gradeDistribution.buckets}
                xKey="range"
                bars={[{ key: "count", color: "#8B5CF6", name: "Students" }]}
                height={250}
                xLabel="Grade Range (%)"
                yLabel="Count"
                colorByValue
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No grade data available</p>
            )}
          </div>

          {/* Per-Assignment Averages */}
          {gradeDistribution && gradeDistribution.assignmentDistributions.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Average Grade by Assignment</h3>
              <BarChart
                data={gradeDistribution.assignmentDistributions.map((a) => ({
                  name: a.title.length > 25 ? a.title.substring(0, 25) + "..." : a.title,
                  avg: a.averagePercent,
                }))}
                xKey="name"
                bars={[{ key: "avg", color: "#22C55E", name: "Average %" }]}
                height={250}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === "time" && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Average Time on Task (Top 20 Lessons)</h3>
          {timeOnTask.length > 0 ? (
            <BarChart
              data={timeOnTask.map((t) => ({
                name: t.title.length > 25 ? t.title.substring(0, 25) + "..." : t.title,
                minutes: t.avgMinutes,
                viewers: t.totalViewers,
              }))}
              xKey="name"
              bars={[{ key: "minutes", color: "#F59E0B", name: "Avg Minutes" }]}
              height={350}
              yLabel="Minutes"
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No telemetry data available</p>
          )}
        </div>
      )}

      {activeTab === "items" && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Question Item Analysis</h3>
          {itemAnalysis.length > 0 ? (
            <div className="space-y-1">
              <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground py-2 border-b">
                <div className="col-span-5">Question</div>
                <div className="col-span-2">Quiz</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-1 text-right">Attempts</div>
                <div className="col-span-2 text-right">Success Rate</div>
                <div className="col-span-1 text-right">Difficulty</div>
              </div>
              {itemAnalysis.map((item) => (
                <div key={item.id} className="grid grid-cols-12 text-sm py-2 border-b last:border-0 items-center">
                  <div className="col-span-5 truncate">{item.text}</div>
                  <div className="col-span-2 truncate text-muted-foreground text-xs">{item.quizTitle}</div>
                  <div className="col-span-1 text-xs">{item.type.replace("_", " ")}</div>
                  <div className="col-span-1 text-right">{item.attempts}</div>
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.successRate > 80 ? "bg-green-500" :
                            item.successRate > 50 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${item.successRate}%` }}
                        />
                      </div>
                      <span className="text-xs w-8">{item.successRate}%</span>
                    </div>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      item.difficulty === "Easy" ? "bg-green-100 text-green-700" :
                      item.difficulty === "Medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {item.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No question data available</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded-lg p-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
