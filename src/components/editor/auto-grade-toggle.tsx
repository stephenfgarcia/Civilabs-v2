"use client";

import { useState } from "react";

interface AutoGradeToggleProps {
  courseId: string;
  initialValue: boolean;
}

export function AutoGradeToggle({ courseId, initialValue }: AutoGradeToggleProps) {
  const [enabled, setEnabled] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const newValue = !enabled;
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoGradeSync: newValue }),
      });
      if (res.ok) {
        setEnabled(newValue);
      }
    } catch {
      // Revert on error
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
      <div>
        <p className="text-sm font-medium">Auto-Grade Sync</p>
        <p className="text-xs text-muted-foreground">
          Automatically sync quiz and assignment scores to the gradebook
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-primary" : "bg-gray-300"
        } ${saving ? "opacity-50" : ""}`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
