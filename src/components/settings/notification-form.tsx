"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NotificationPreferences {
  emailEnrollment: boolean;
  emailCourseUpdates: boolean;
  emailCertificates: boolean;
  emailQuizResults: boolean;
  emailForumReplies: boolean;
  emailAnnouncements: boolean;
  emailChatMentions: boolean;
}

interface NotificationFormProps {
  initialPreferences: NotificationPreferences;
}

const NOTIFICATION_LABELS: Record<keyof NotificationPreferences, { label: string; description: string }> = {
  emailEnrollment: {
    label: "Enrollment Notifications",
    description: "Get notified when someone enrolls in your course or you enroll in one",
  },
  emailCourseUpdates: {
    label: "Course Updates",
    description: "Receive updates when course content is modified",
  },
  emailCertificates: {
    label: "Certificate Earned",
    description: "Get notified when you earn a certificate",
  },
  emailQuizResults: {
    label: "Quiz Results",
    description: "Receive results when you complete a quiz",
  },
  emailForumReplies: {
    label: "Forum Replies",
    description: "Get notified when someone replies to your forum thread",
  },
  emailAnnouncements: {
    label: "Announcements",
    description: "Receive platform-wide announcements",
  },
  emailChatMentions: {
    label: "Chat Mentions",
    description: "Get notified when someone mentions you in chat",
  },
};

export function NotificationForm({ initialPreferences }: NotificationFormProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(initialPreferences);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update preferences");
      }

      toast.success("Notification preferences saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose which email notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(Object.keys(NOTIFICATION_LABELS) as Array<keyof NotificationPreferences>).map(
            (key, index) => (
              <div key={key}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={key} className="text-sm font-medium">
                      {NOTIFICATION_LABELS[key].label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {NOTIFICATION_LABELS[key].description}
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={preferences[key]}
                    onCheckedChange={() => handleToggle(key)}
                  />
                </div>
              </div>
            )
          )}

          <Separator />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
