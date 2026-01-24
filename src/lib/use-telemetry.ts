"use client";

import { useCallback, useRef } from "react";

interface TelemetryEvent {
  courseId?: string;
  lessonId?: string;
  eventType: "VIEW" | "SCROLL" | "VIDEO_PLAY" | "VIDEO_PAUSE" | "SUBMIT" | "LOGIN" | "IDLE";
  metadata?: Record<string, unknown>;
}

const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

export function useTelemetry() {
  const buffer = useRef<TelemetryEvent[]>([]);
  const sessionId = useRef<string>(generateSessionId());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const flush = useCallback(async () => {
    if (buffer.current.length === 0) return;

    const events = [...buffer.current];
    buffer.current = [];

    try {
      await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: events.map((e) => ({ ...e, sessionId: sessionId.current })),
        }),
      });
    } catch {
      // Re-add failed events to buffer (up to limit)
      buffer.current = [...events, ...buffer.current].slice(0, 100);
    }
  }, []);

  const track = useCallback((event: TelemetryEvent) => {
    buffer.current.push(event);

    if (buffer.current.length >= BATCH_SIZE) {
      flush();
    }

    // Set up periodic flush if not already set
    if (!timerRef.current) {
      timerRef.current = setInterval(flush, FLUSH_INTERVAL);
    }
  }, [flush]);

  const trackView = useCallback((courseId: string, lessonId: string) => {
    track({ courseId, lessonId, eventType: "VIEW" });
  }, [track]);

  const trackScroll = useCallback((courseId: string, lessonId: string, scrollDepth: number) => {
    track({ courseId, lessonId, eventType: "SCROLL", metadata: { scrollDepth } });
  }, [track]);

  const trackVideoPlay = useCallback((courseId: string, lessonId: string, videoPercent: number) => {
    track({ courseId, lessonId, eventType: "VIDEO_PLAY", metadata: { videoPercent } });
  }, [track]);

  const trackVideoPause = useCallback((courseId: string, lessonId: string, videoPercent: number) => {
    track({ courseId, lessonId, eventType: "VIDEO_PAUSE", metadata: { videoPercent } });
  }, [track]);

  return { track, trackView, trackScroll, trackVideoPlay, trackVideoPause, flush };
}
