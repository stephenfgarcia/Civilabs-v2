"use client";

import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";

interface UpcomingEvent {
  id: string;
  title: string;
  startDate: string;
  type: string;
  color: string | null;
  course: { id: string; title: string } | null;
}

export function UpcomingDeadlines() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const res = await fetch("/api/calendar/upcoming");
        if (res.ok) setEvents(await res.json());
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    fetchUpcoming();
  }, []);

  if (loading) return null;
  if (events.length === 0) return null;

  function getTimeRemaining(dateStr: string): string {
    const now = new Date();
    const target = new Date(dateStr);
    const diff = target.getTime() - now.getTime();

    if (diff < 0) return "Past due";
    if (diff < 60 * 60 * 1000) return `${Math.round(diff / (60 * 1000))}m`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / (60 * 60 * 1000))}h`;
    return `${Math.round(diff / (24 * 60 * 60 * 1000))}d`;
  }

  function isUrgent(dateStr: string): boolean {
    const diff = new Date(dateStr).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000; // Less than 24h
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <h3 className="text-sm font-semibold">Upcoming Deadlines</h3>
      </div>

      <div className="space-y-2">
        {events.slice(0, 5).map((event) => (
          <div
            key={event.id}
            className={`flex items-center justify-between p-2 rounded text-sm ${
              isUrgent(event.startDate) ? "bg-red-50 border border-red-200" : "bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: event.color || "#6B7280" }}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{event.title}</p>
                {event.course && (
                  <p className="text-xs text-muted-foreground truncate">{event.course.title}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {isUrgent(event.startDate) && <AlertCircle className="w-3 h-3 text-red-500" />}
              <span className={`text-xs font-medium ${isUrgent(event.startDate) ? "text-red-600" : "text-muted-foreground"}`}>
                {getTimeRemaining(event.startDate)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {events.length > 5 && (
        <a href="/calendar" className="text-xs text-blue-600 hover:underline">
          View all {events.length} upcoming events
        </a>
      )}
    </div>
  );
}
