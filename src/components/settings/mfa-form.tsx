"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Key } from "lucide-react";

interface MFAStatus {
  isEnabled: boolean;
  method: string | null;
  remainingBackupCodes: number;
  isLocked: boolean;
}

export function MFAForm() {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "backup">("idle");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/auth/mfa");
      if (res.ok) setStatus(await res.json());
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  async function startSetup() {
    try {
      const res = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });

      if (res.ok) {
        toast.success("Verification code sent to your email");
        setStep("verify");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to start setup");
      }
    } catch {
      toast.error("Error starting MFA setup");
    }
  }

  async function verifySetup() {
    try {
      const res = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-setup", code }),
      });

      if (res.ok) {
        const data = await res.json();
        setBackupCodes(data.backupCodes);
        setStep("backup");
        setCode("");
        fetchStatus();
      } else {
        const err = await res.json();
        toast.error(err.message || "Invalid code");
      }
    } catch {
      toast.error("Error verifying code");
    }
  }

  async function disableMFA() {
    try {
      const res = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });

      if (res.ok) {
        toast.success("MFA disabled");
        fetchStatus();
        setStep("idle");
      }
    } catch {
      toast.error("Error disabling MFA");
    }
  }

  async function regenerateBackup() {
    try {
      const res = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate-backup" }),
      });

      if (res.ok) {
        const data = await res.json();
        setBackupCodes(data.backupCodes);
        setStep("backup");
        toast.success("New backup codes generated");
        fetchStatus();
      }
    } catch {
      toast.error("Error regenerating codes");
    }
  }

  if (loading) return null;

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Add an extra layer of security to your account with email-based verification codes.
      </p>

      {status?.isEnabled ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded text-green-700 text-sm">
            <Shield className="w-4 h-4" />
            <span>MFA is enabled (Email OTP)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {status.remainingBackupCodes} backup codes remaining
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={regenerateBackup}>
              <Key className="w-3 h-3 mr-1" /> Regenerate Backup Codes
            </Button>
            <Button size="sm" variant="destructive" onClick={disableMFA}>
              Disable MFA
            </Button>
          </div>
        </div>
      ) : step === "idle" ? (
        <Button onClick={startSetup}>Enable MFA</Button>
      ) : step === "verify" ? (
        <div className="space-y-3">
          <p className="text-sm">Enter the 6-digit code sent to your email:</p>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-32 text-center text-lg tracking-widest"
            />
            <Button onClick={verifySetup} disabled={code.length !== 6}>
              Verify
            </Button>
            <Button variant="ghost" onClick={() => { setStep("idle"); setCode(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {/* Backup Codes Display */}
      {step === "backup" && backupCodes.length > 0 && (
        <div className="space-y-3 p-4 border rounded bg-amber-50">
          <div className="flex items-center gap-2 text-amber-700">
            <Key className="w-4 h-4" />
            <Label className="font-semibold">Save Your Backup Codes</Label>
          </div>
          <p className="text-xs text-amber-600">
            Store these codes somewhere safe. Each can only be used once.
          </p>
          <div className="grid grid-cols-2 gap-1">
            {backupCodes.map((code, i) => (
              <code key={i} className="text-sm font-mono bg-white px-2 py-1 rounded border">
                {code}
              </code>
            ))}
          </div>
          <Button size="sm" onClick={() => { setStep("idle"); setBackupCodes([]); }}>
            I&apos;ve saved these codes
          </Button>
        </div>
      )}
    </div>
  );
}
