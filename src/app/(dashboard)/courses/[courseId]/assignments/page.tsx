"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  points: number;
  dueDate: string | null;
  submissions: Array<{
    status: string;
    grade: number | null;
    isLate: boolean;
  }>;
}

type AssignmentStatus = "UPCOMING" | "SUBMITTED" | "GRADED" | "OVERDUE";

function getAssignmentStatus(assignment: Assignment): AssignmentStatus {
  const latestSubmission = assignment.submissions[0];

  if (latestSubmission?.status === "GRADED") return "GRADED";
  if (latestSubmission?.status === "SUBMITTED") return "SUBMITTED";

  if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
    return "OVERDUE";
  }

  return "UPCOMING";
}

const statusConfig = {
  UPCOMING: {
    label: "Upcoming",
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    icon: Clock,
  },
  SUBMITTED: {
    label: "Submitted",
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    icon: FileText,
  },
  GRADED: {
    label: "Graded",
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
    icon: CheckCircle,
  },
  OVERDUE: {
    label: "Overdue",
    color: "text-red-600 bg-red-100 dark:bg-red-900/30",
    icon: AlertCircle,
  },
};

export default function CourseAssignmentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [assignmentsRes, courseRes] = await Promise.all([
          fetch(`/api/courses/${courseId}/assignments`),
          fetch(`/api/courses/${courseId}`),
        ]);

        if (assignmentsRes.ok) {
          setAssignments(await assignmentsRes.json());
        }
        if (courseRes.ok) {
          const courseData = await courseRes.json();
          setCourseTitle(courseData.title);
        }
      } catch {
        toast.error("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [courseId]);

  if (loading) return <div className="p-6">Loading assignments...</div>;

  // Group assignments by status
  const grouped = {
    OVERDUE: assignments.filter((a) => getAssignmentStatus(a) === "OVERDUE"),
    UPCOMING: assignments.filter((a) => getAssignmentStatus(a) === "UPCOMING"),
    SUBMITTED: assignments.filter((a) => getAssignmentStatus(a) === "SUBMITTED"),
    GRADED: assignments.filter((a) => getAssignmentStatus(a) === "GRADED"),
  };

  const groupOrder: AssignmentStatus[] = ["OVERDUE", "UPCOMING", "SUBMITTED", "GRADED"];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: courseTitle || "Course", href: `/courses/${courseId}` },
          { label: "Assignments" },
        ]}
      />

      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/courses/${courseId}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Course
        </Link>
      </Button>

      <h1 className="text-2xl font-bold">Assignments</h1>

      {assignments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No assignments for this course</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupOrder.map((status) => {
            const items = grouped[status];
            if (items.length === 0) return null;

            const config = statusConfig[status];

            return (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <config.icon className={`h-4 w-4 ${config.color.split(" ")[0]}`} />
                    {config.label}
                    <span className="text-muted-foreground font-normal">
                      ({items.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((assignment) => {
                    const latestSubmission = assignment.submissions[0];

                    return (
                      <Link
                        key={assignment.id}
                        href={`/courses/${courseId}/assignments/${assignment.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{assignment.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{assignment.points} pts</span>
                            <span>{assignment.type.replace("_", " ").toLowerCase()}</span>
                            {assignment.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(assignment.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          {status === "GRADED" && latestSubmission?.grade !== null && (
                            <div className="text-right">
                              <span className="font-medium">
                                {latestSubmission.grade}/{assignment.points}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({Math.round((latestSubmission.grade / assignment.points) * 100)}%)
                              </span>
                            </div>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
