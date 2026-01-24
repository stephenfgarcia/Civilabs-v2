"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, Link2, RefreshCw, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamic import for FullCalendar (SSR incompatible)
const FullCalendarWrapper = dynamic(() => import("@/components/calendar/calendar-view"), {
  ssr: false,
  loading: () => <div className="h-[600px] flex items-center justify-center">Loading calendar...</div>,
});

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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    allDay: false,
    color: "#3B82F6",
  });

  const fetchEvents = useCallback(async (start?: string, end?: string) => {
    try {
      const params = new URLSearchParams();
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      const res = await fetch(`/api/calendar?${params.toString()}`);
      if (res.ok) setEvents(await res.json());
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function handleDateRangeChange(start: string, end: string) {
    setDateRange({ start, end });
    await fetchEvents(start, end);
  }

  async function createEvent() {
    if (!newEvent.title || !newEvent.startDate) {
      toast.error("Title and start date are required");
      return;
    }

    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          startDate: new Date(newEvent.startDate).toISOString(),
          endDate: newEvent.endDate ? new Date(newEvent.endDate).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        toast.success("Event created");
        setShowCreateModal(false);
        setNewEvent({ title: "", description: "", startDate: "", endDate: "", allDay: false, color: "#3B82F6" });
        fetchEvents(dateRange.start, dateRange.end);
      } else {
        toast.error("Failed to create event");
      }
    } catch {
      toast.error("Error creating event");
    }
  }

  async function deleteEvent(id: string) {
    try {
      const res = await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Event deleted");
        fetchEvents(dateRange.start, dateRange.end);
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete event");
      }
    } catch {
      toast.error("Error deleting event");
    }
  }

  async function generateSubscriptionUrl() {
    try {
      const res = await fetch("/api/calendar/ical", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSubscriptionUrl(data.subscriptionUrl);
        setShowSubscription(true);
      } else {
        toast.error("Failed to generate subscription URL");
      }
    } catch {
      toast.error("Error generating subscription");
    }
  }

  async function syncEvents() {
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Synced: ${data.created} created, ${data.updated} updated`);
        fetchEvents(dateRange.start, dateRange.end);
      } else {
        toast.error("Failed to sync events");
      }
    } catch {
      toast.error("Error syncing events");
    } finally {
      setSyncing(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  if (loading) return <div className="p-6">Loading calendar...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Calendar</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={syncEvents} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
            Sync Events
          </Button>
          <Button size="sm" variant="outline" onClick={generateSubscriptionUrl}>
            <Link2 className="w-4 h-4 mr-1" />
            Subscribe
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Subscription URL Modal */}
      {showSubscription && subscriptionUrl && (
        <div className="border rounded-lg p-4 bg-blue-50/50 space-y-2">
          <h3 className="text-sm font-medium">iCal Subscription URL</h3>
          <p className="text-xs text-muted-foreground">
            Add this URL to Google Calendar, Outlook, or Apple Calendar to auto-sync your events.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={subscriptionUrl}
              readOnly
              className="flex-1 text-xs bg-white border rounded px-2 py-1"
            />
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(subscriptionUrl)}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setShowSubscription(false)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
          <h3 className="font-medium">Create Custom Event</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Title *</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Color</label>
              <input
                type="color"
                className="w-full h-8 border rounded"
                value={newEvent.color}
                onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Start Date *</label>
              <input
                type="datetime-local"
                className="w-full border rounded px-2 py-1 text-sm"
                value={newEvent.startDate}
                onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium">End Date</label>
              <input
                type="datetime-local"
                className="w-full border rounded px-2 py-1 text-sm"
                value={newEvent.endDate}
                onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium">Description</label>
              <textarea
                className="w-full border rounded px-2 py-1 text-sm"
                rows={2}
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={newEvent.allDay}
                onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
              />
              <label htmlFor="allDay" className="text-xs">All day event</label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={createEvent}>Create</Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* FullCalendar View */}
      <FullCalendarWrapper
        events={events}
        onDateRangeChange={handleDateRangeChange}
        onEventDelete={deleteEvent}
      />
    </div>
  );
}
