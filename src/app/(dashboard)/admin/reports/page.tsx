"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Loader2,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const reportTypes = [
  {
    id: "enrollments",
    name: "Enrollments Report",
    description: "Student enrollments with progress data",
    icon: GraduationCap,
  },
  {
    id: "users",
    name: "Users Report",
    description: "All users with role and activity info",
    icon: Users,
  },
  {
    id: "courses",
    name: "Courses Report",
    description: "Course statistics and completion rates",
    icon: BookOpen,
  },
  {
    id: "quiz-results",
    name: "Quiz Results Report",
    description: "Quiz attempts and scores",
    icon: ClipboardList,
  },
  {
    id: "progress",
    name: "Progress Report",
    description: "Detailed lesson completion data",
    icon: FileSpreadsheet,
  },
];

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState<"json" | "csv">("csv");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[] | null>(null);

  const handleGenerateReport = async (download: boolean = false) => {
    if (!selectedReport) return;

    setIsGenerating(true);
    try {
      const params = new URLSearchParams({
        type: selectedReport,
        format: download ? format : "json",
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/reports?${params}`);

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      if (download && format === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedReport}-report-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setPreviewData(data.data);
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedReportInfo = reportTypes.find((r) => r.id === selectedReport);

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Reports
        </h1>
        <p className="text-muted-foreground">
          Generate and download detailed reports for your platform
        </p>
      </div>

      {/* Report Selection */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all ${
                selectedReport === report.id
                  ? "ring-2 ring-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => {
                setSelectedReport(report.id);
                setPreviewData(null);
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{report.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{report.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Configuration */}
      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>
              Configure filters and format for your {selectedReportInfo?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select
                  value={format}
                  onValueChange={(v: "json" | "csv") => setFormat(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleGenerateReport(false)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Preview
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleGenerateReport(true)}
                    disabled={isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview */}
            {previewData && (
              <div className="mt-6">
                <h3 className="font-medium mb-3">
                  Preview ({previewData.length} records)
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[400px]">
                    {previewData.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            {Object.keys(previewData[0]).map((key) => (
                              <th
                                key={key}
                                className="px-4 py-2 text-left font-medium"
                              >
                                {key
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/^./, (s) => s.toUpperCase())}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.slice(0, 20).map((row, i) => (
                            <tr key={i} className="border-t">
                              {Object.values(row).map((value, j) => (
                                <td key={j} className="px-4 py-2">
                                  {value instanceof Date
                                    ? value.toLocaleDateString()
                                    : typeof value === "boolean"
                                    ? value
                                      ? "Yes"
                                      : "No"
                                    : String(value ?? "-")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">
                        No data found for the selected filters
                      </p>
                    )}
                  </div>
                  {previewData.length > 20 && (
                    <div className="px-4 py-2 bg-muted border-t text-sm text-muted-foreground">
                      Showing first 20 of {previewData.length} records. Download
                      to see all.
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Quick CSV Export
          </CardTitle>
          <CardDescription>
            Download complete data exports in CSV format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { type: "users", label: "All Users", icon: Users },
              { type: "enrollments", label: "All Enrollments", icon: GraduationCap },
              { type: "courses", label: "All Courses", icon: BookOpen },
              { type: "certificates", label: "All Certificates", icon: GraduationCap },
              { type: "quiz-attempts", label: "Quiz Attempts", icon: ClipboardList },
            ].map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant="outline"
                className="justify-start h-auto py-3"
                onClick={() => {
                  window.open(`/api/reports/export?type=${type}`, "_blank");
                }}
              >
                <Icon className="h-4 w-4 mr-2 shrink-0" />
                <span className="text-left">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">Export as CSV</span>
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
