"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PrivacyFormProps {
  profileVisibility: boolean;
}

export function PrivacyForm({ profileVisibility: initialVisibility }: PrivacyFormProps) {
  const [profileVisibility, setProfileVisibility] = useState(initialVisibility);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/settings/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileVisibility }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update privacy settings");
      }

      toast.success("Privacy settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save privacy settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>Control who can see your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="profileVisibility" className="text-sm font-medium">
                Public Profile
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, other students and instructors can see your profile details
              </p>
            </div>
            <Switch
              id="profileVisibility"
              checked={profileVisibility}
              onCheckedChange={setProfileVisibility}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Privacy Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
