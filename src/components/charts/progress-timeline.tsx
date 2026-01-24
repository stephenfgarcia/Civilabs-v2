"use client";

import { useState, useEffect } from "react";
import { BookOpen, CheckCircle, XCircle, Upload, GraduationCap, UserPlus } from "lucide-react";

interface TimelineEvent {
  date: string;
  type: string;
  title: string;
  courseTitle: string;
  details?: string;
}

interface ProgressTimelineProps {
  courseId?: string;
  userId?: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  lesson: { icon: BookOpen, color: "text-blue-500 bg-blue-100" },
  quiz_passed: { icon: CheckCircle, color: "text-green-500 bg-green-100" },
  quiz_failed: { icon: XCircle, color: "text-red-500 bg-red-100" },
  submission: { icon: Upload, color: "text-purple-500 bg-purple-100" },
  submission_graded: { icon: CheckCircle, color: "text-emerald-500 bg-emerald-100" },
  course_completed: { icon: GraduationCap, color: "text-amber-500 bg-amber-100" },
  enrollment: { icon: UserPlus, color: "text-indigo-500 bg-indigo-100" },
};

export function ProgressTimeline({ courseId, userId }: ProgressTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const params = new URLSearchParams();
        if (courseId) params.set("courseId", courseId);
        if (userId) params.set("userId", userId);
        const res = await fetch(`/api/analytics/progress-timeline?${params.toString()}`);
        if (res.ok) setEvents(await res.json());
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [courseId, userId]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading timeline...</div>;
  if (events.length === 0) return <div className="text-sm text-muted-foreground text-center py-4">No activity yet</div>;

  // Group events by date
  const grouped = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const dateKey = new Date(event.date).toLocaleDateString();
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(event);
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([dateKey, dayEvents]) => (
        <div key={dateKey}>
          <p className="text-xs font-medium text-muted-foreground mb-2">{dateKey}</p>
          <div className="space-y-2 ml-2 border-l pl-4">
            {dayEvents.map((event, idx) => {
              const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.lesson;
              const Icon = config.icon;
              return (
                <div key={idx} className="flex items-start gap-2 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 -ml-[25px] ${config.color}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{event.courseTitle}</span>
                      {event.details && <span>• {event.details}</span>}
                      <span>• {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
