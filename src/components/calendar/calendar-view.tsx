"use client";

import { useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  type: string;
  color: string | null;
  courseId: string | null;
  course: { id: string; title: string } | null;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateRangeChange: (start: string, end: string) => void;
  onEventDelete: (id: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  ASSIGNMENT_DUE: "#EF4444",
  ASSESSMENT_OPEN: "#3B82F6",
  ASSESSMENT_CLOSE: "#F59E0B",
  CONTENT_AVAILABLE: "#22C55E",
  ATTENDANCE_SESSION: "#8B5CF6",
  CUSTOM: "#6B7280",
};

export default function CalendarView({ events, onDateRangeChange, onEventDelete }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  const handleDatesSet = useCallback((arg: { startStr: string; endStr: string }) => {
    onDateRangeChange(arg.startStr, arg.endStr);
  }, [onDateRangeChange]);

  const fullCalendarEvents = events.map((event) => ({
    id: event.id,
    title: event.course ? `[${event.course.title}] ${event.title}` : event.title,
    start: event.startDate,
    end: event.endDate || undefined,
    allDay: event.allDay,
    backgroundColor: event.color || TYPE_COLORS[event.type] || TYPE_COLORS.CUSTOM,
    borderColor: event.color || TYPE_COLORS[event.type] || TYPE_COLORS.CUSTOM,
    extendedProps: {
      description: event.description,
      type: event.type,
      courseId: event.courseId,
      courseName: event.course?.title,
    },
  }));

  return (
    <div className="bg-white rounded-lg border p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek",
        }}
        events={fullCalendarEvents}
        datesSet={handleDatesSet}
        eventClick={(info) => {
          const type = info.event.extendedProps.type;
          if (type === "CUSTOM" && confirm(`Delete "${info.event.title}"?`)) {
            onEventDelete(info.event.id);
          }
        }}
        height="auto"
        aspectRatio={1.8}
        dayMaxEvents={3}
        eventDisplay="block"
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
        }}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-muted-foreground">
              {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
