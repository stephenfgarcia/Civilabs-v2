"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlatformSettings {
  registrationOpen: boolean;
  defaultRole: "STUDENT" | "INSTRUCTOR";
  maintenanceMode: boolean;
  platformName: string;
  platformDescription: string | null;
  maxFileUploadSize: number;
  allowedFileTypes: string;
}

interface PlatformFormProps {
  initialSettings: PlatformSettings;
}

export function PlatformForm({ initialSettings }: PlatformFormProps) {
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!settings.platformName.trim()) {
      toast.error("Platform name is required");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/settings/platform", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          platformDescription: settings.platformDescription || "",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update platform settings");
      }

      toast.success("Platform settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Configuration</CardTitle>
        <CardDescription>Manage platform-wide settings and access controls</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Platform Identity */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Platform Identity</h4>
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                placeholder="CiviLabs"
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platformDescription">Platform Description</Label>
              <Textarea
                id="platformDescription"
                value={settings.platformDescription || ""}
                onChange={(e) => setSettings({ ...settings, platformDescription: e.target.value })}
                placeholder="A brief description of your platform..."
                maxLength={500}
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Access Controls */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Access Controls</h4>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="registrationOpen" className="text-sm font-medium">
                  Open Registration
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow new users to register on the platform
                </p>
              </div>
              <Switch
                id="registrationOpen"
                checked={settings.registrationOpen}
                onCheckedChange={(checked) => setSettings({ ...settings, registrationOpen: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode" className="text-sm font-medium">
                  Maintenance Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, only admins can access the platform
                </p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultRole">Default Role for New Users</Label>
              <Select
                value={settings.defaultRole}
                onValueChange={(value: "STUDENT" | "INSTRUCTOR") =>
                  setSettings({ ...settings, defaultRole: value })
                }
              >
                <SelectTrigger id="defaultRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* File Upload Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">File Upload Settings</h4>

            <div className="space-y-2">
              <Label htmlFor="maxFileUploadSize">Max Upload Size (MB)</Label>
              <Input
                id="maxFileUploadSize"
                type="number"
                min={1}
                max={100}
                value={settings.maxFileUploadSize}
                onChange={(e) =>
                  setSettings({ ...settings, maxFileUploadSize: parseInt(e.target.value) || 10 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                value={settings.allowedFileTypes}
                onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
                placeholder="image/*,application/pdf,video/*"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated MIME types (e.g., image/*, application/pdf)
              </p>
            </div>
          </div>

          <Separator />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Platform Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
