"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ScrollText,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Globe,
  Activity,
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
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  userId: string | null;
  targetId: string | null;
  targetType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionCategories = {
  Authentication: ["LOGIN", "LOGOUT", "LOGIN_FAILED", "PASSWORD_CHANGE", "PASSWORD_RESET_REQUEST"],
  "User Management": ["USER_CREATED", "USER_UPDATED", "USER_DELETED", "ROLE_CHANGED"],
  "Course Management": ["COURSE_CREATED", "COURSE_UPDATED", "COURSE_DELETED", "COURSE_PUBLISHED", "COURSE_UNPUBLISHED"],
  Enrollment: ["ENROLLMENT_CREATED", "ENROLLMENT_DELETED", "COURSE_COMPLETED"],
  Content: ["CHAPTER_CREATED", "CHAPTER_UPDATED", "CHAPTER_DELETED", "LESSON_CREATED", "LESSON_UPDATED", "LESSON_DELETED"],
  Quiz: ["QUIZ_ATTEMPTED", "QUIZ_PASSED", "QUIZ_FAILED"],
  Admin: ["SETTINGS_CHANGED", "DATA_EXPORTED", "BULK_ACTION"],
};

const actionColors: Record<string, string> = {
  LOGIN: "bg-green-500",
  LOGOUT: "bg-gray-500",
  LOGIN_FAILED: "bg-red-500",
  PASSWORD_CHANGE: "bg-yellow-500",
  USER_CREATED: "bg-blue-500",
  USER_DELETED: "bg-red-500",
  ROLE_CHANGED: "bg-purple-500",
  COURSE_CREATED: "bg-green-500",
  COURSE_PUBLISHED: "bg-green-600",
  COURSE_DELETED: "bg-red-500",
  ENROLLMENT_CREATED: "bg-blue-500",
  COURSE_COMPLETED: "bg-green-600",
  QUIZ_PASSED: "bg-green-500",
  QUIZ_FAILED: "bg-red-500",
  DATA_EXPORTED: "bg-yellow-500",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (actionFilter !== "all") params.append("action", actionFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground">
          Track and review all system activities and user actions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select
                value={actionFilter}
                onValueChange={setActionFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(actionCategories).map(([category, actions]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {actions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {formatAction(action)}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setActionFilter("all");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {pagination.total} total records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ScrollText className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">No audit logs found</p>
              <p className="text-sm">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full mt-1.5 flex-shrink-0",
                      actionColors[log.action] || "bg-gray-500"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {formatAction(log.action)}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          {log.userId && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              User: {log.userId.slice(0, 8)}...
                            </span>
                          )}
                          {log.targetType && (
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {log.targetType}
                              {log.targetId && `: ${log.targetId.slice(0, 8)}...`}
                            </span>
                          )}
                          {log.ipAddress && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {log.ipAddress}
                            </span>
                          )}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(log.createdAt), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs">
                          {format(new Date(log.createdAt), "h:mm a")}
                        </div>
                        <div className="text-xs mt-1">
                          {formatDistanceToNow(new Date(log.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
