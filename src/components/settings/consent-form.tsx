"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Download } from "lucide-react";

interface ConsentItem {
  consentType: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
}

const CONSENT_LABELS: Record<string, { label: string; description: string }> = {
  DATA_PROCESSING: {
    label: "Data Processing",
    description: "Allow us to process your data for platform functionality (required for account use)",
  },
  ANALYTICS: {
    label: "Analytics & Improvement",
    description: "Allow anonymous usage analytics to improve the platform experience",
  },
  MARKETING: {
    label: "Marketing Communications",
    description: "Receive promotional emails and feature announcements",
  },
};

export function ConsentForm() {
  const [consents, setConsents] = useState<ConsentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConsents();
  }, []);

  async function fetchConsents() {
    try {
      const res = await fetch("/api/users/me/consent");
      if (res.ok) setConsents(await res.json());
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  async function updateConsent(consentType: string, granted: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consents: [{ consentType, granted }] }),
      });

      if (res.ok) {
        toast.success("Preference updated");
        fetchConsents();
      } else {
        toast.error("Failed to update preference");
      }
    } catch {
      toast.error("Error updating preference");
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    try {
      const res = await fetch("/api/users/me/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "civilabs-data-export.json";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Data exported successfully");
      } else {
        toast.error("Failed to export data");
      }
    } catch {
      toast.error("Error exporting data");
    }
  }

  if (loading) return null;

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Privacy & Data</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Manage your data processing consent and privacy preferences.
      </p>

      {/* Consent Toggles */}
      <div className="space-y-3">
        {consents.map((consent) => {
          const info = CONSENT_LABELS[consent.consentType];
          if (!info) return null;
          return (
            <div key={consent.consentType} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="text-sm font-medium">{info.label}</p>
                <p className="text-xs text-muted-foreground">{info.description}</p>
              </div>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  consent.granted ? "bg-green-600" : "bg-gray-200"
                }`}
                onClick={() => updateConsent(consent.consentType, !consent.granted)}
                disabled={saving}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    consent.granted ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Data Export */}
      <div className="pt-3 border-t space-y-2">
        <h3 className="text-sm font-medium">Your Data</h3>
        <p className="text-xs text-muted-foreground">
          Download a copy of your personal data (profile, enrollments, grades).
        </p>
        <Button size="sm" variant="outline" onClick={exportData}>
          <Download className="w-3 h-3 mr-1" /> Export My Data
        </Button>
      </div>
    </div>
  );
}
