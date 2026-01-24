"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Users, Lock } from "lucide-react";

interface MFAStats {
  totalUsers: number;
  mfaEnabled: number;
  adoptionRate: number;
  byRole: Array<{ role: string; total: number; mfaEnabled: number }>;
  enforcementEnabled: boolean;
}

export default function MFADashboardPage() {
  const [stats, setStats] = useState<MFAStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/mfa");
      if (res.ok) setStats(await res.json());
    } catch {
      toast.error("Failed to load MFA stats");
    } finally {
      setLoading(false);
    }
  }

  async function toggleEnforcement(enable: boolean) {
    try {
      const res = await fetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireMFA: enable }),
      });

      if (res.ok) {
        toast.success(enable ? "MFA enforcement enabled" : "MFA enforcement disabled");
        fetchStats();
      }
    } catch {
      toast.error("Error updating policy");
    }
  }

  if (loading) return <div className="p-6">Loading MFA dashboard...</div>;
  if (!stats) return <div className="p-6">Failed to load stats</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MFA Management</h1>
        <p className="text-muted-foreground">
          Multi-factor authentication adoption and policy management
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <Shield className="w-6 h-6 mx-auto mb-2 text-green-600" />
          <p className="text-3xl font-bold">{stats.mfaEnabled}</p>
          <p className="text-sm text-muted-foreground">MFA Enabled</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <Lock className="w-6 h-6 mx-auto mb-2 text-purple-600" />
          <p className="text-3xl font-bold">{stats.adoptionRate}%</p>
          <p className="text-sm text-muted-foreground">Adoption Rate</p>
        </div>
      </div>

      {/* By Role */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Adoption by Role</h2>
        {stats.byRole.map((role) => (
          <div key={role.role} className="flex items-center justify-between">
            <span className="text-sm font-medium">{role.role}</span>
            <div className="flex items-center gap-3">
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full"
                  style={{ width: `${role.total > 0 ? (role.mfaEnabled / role.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right">
                {role.mfaEnabled}/{role.total}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Enforcement Policy */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Enforcement Policy</h2>
        <p className="text-sm text-muted-foreground">
          When enabled, all users will be required to set up MFA before accessing the platform.
        </p>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium ${stats.enforcementEnabled ? "text-green-600" : "text-muted-foreground"}`}>
            {stats.enforcementEnabled ? "Enforced" : "Optional"}
          </span>
          <Button
            size="sm"
            variant={stats.enforcementEnabled ? "destructive" : "default"}
            onClick={() => toggleEnforcement(!stats.enforcementEnabled)}
          >
            {stats.enforcementEnabled ? "Disable Enforcement" : "Enable Enforcement"}
          </Button>
        </div>
      </div>
    </div>
  );
}
