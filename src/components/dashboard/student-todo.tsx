"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  FileText,
  BookOpen,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TodoItem {
  id: string;
  type: "ASSIGNMENT" | "LESSON" | "QUIZ" | "COURSE";
  title: string;
  subtitle?: string;
  courseId: string;
  courseTitle: string;
  href: string;
  dueDate?: string;
  urgency: "OVERDUE" | "TODAY" | "THIS_WEEK" | "UPCOMING" | "NO_DEADLINE";
  progress?: number;
}

const typeIcons = {
  ASSIGNMENT: FileText,
  LESSON: BookOpen,
  QUIZ: HelpCircle,
  COURSE: BookOpen,
};

const urgencyStyles = {
  OVERDUE: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900",
  TODAY: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900",
  THIS_WEEK: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900",
  UPCOMING: "bg-muted/50 border-muted",
  NO_DEADLINE: "bg-muted/30 border-muted",
};

const urgencyLabels = {
  OVERDUE: { text: "Overdue", color: "text-red-600 dark:text-red-400" },
  TODAY: { text: "Due Today", color: "text-amber-600 dark:text-amber-400" },
  THIS_WEEK: { text: "Due This Week", color: "text-blue-600 dark:text-blue-400" },
  UPCOMING: { text: "Upcoming", color: "text-muted-foreground" },
  NO_DEADLINE: { text: "", color: "text-muted-foreground" },
};

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff < 0) {
    const hours = Math.abs(Math.round(diff / (1000 * 60 * 60)));
    if (hours < 24) return `${hours}h overdue`;
    const days = Math.round(hours / 24);
    return `${days}d overdue`;
  }

  if (diff < 60 * 60 * 1000) {
    return `${Math.round(diff / (60 * 1000))}m left`;
  }
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.round(diff / (60 * 60 * 1000))}h left`;
  }
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function StudentTodo() {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTodo() {
      try {
        const res = await fetch("/api/student/todo");
        if (res.ok) {
          setItems(await res.json());
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchTodo();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Your To-Do
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            All Caught Up!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You have no pending assignments or incomplete lessons. Great job!
          </p>
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link href="/courses">Browse More Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group items by urgency for display
  const urgentItems = items.filter(
    (i) => i.urgency === "OVERDUE" || i.urgency === "TODAY"
  );
  const otherItems = items.filter(
    (i) => i.urgency !== "OVERDUE" && i.urgency !== "TODAY"
  );

  const displayItems = [...urgentItems, ...otherItems].slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Your To-Do
            {urgentItems.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
                {urgentItems.length} urgent
              </span>
            )}
          </CardTitle>
          {items.length > 5 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/progress">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayItems.map((item) => {
          const Icon = typeIcons[item.type];
          const urgencyStyle = urgencyStyles[item.urgency];
          const urgencyLabel = urgencyLabels[item.urgency];

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${urgencyStyle}`}
            >
              <div className="flex-shrink-0">
                {item.urgency === "OVERDUE" ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Icon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.courseTitle}
                  {item.subtitle && ` - ${item.subtitle}`}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                {item.dueDate && (
                  <p className={`text-xs font-medium ${urgencyLabel.color}`}>
                    {formatDueDate(item.dueDate)}
                  </p>
                )}
                {item.progress !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {item.progress}% complete
                  </p>
                )}
                {!item.dueDate && item.progress === undefined && urgencyLabel.text && (
                  <p className={`text-xs ${urgencyLabel.color}`}>
                    {urgencyLabel.text}
                  </p>
                )}
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
