"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Shield, Database, Plus, Trash2, Clock,
} from "lucide-react";

interface RetentionPolicy {
  id: string;
  dataType: string;
  retentionDays: number;
  action: string;
  isActive: boolean;
  lastExecutedAt: string | null;
  description: string | null;
}

interface DataVolume {
  type: string;
  count: number;
}

const DATA_TYPE_LABELS: Record<string, string> = {
  USER_DATA: "User Profiles",
  ENROLLMENTS: "Enrollments",
  SUBMISSIONS: "Assignment Submissions",
  TELEMETRY: "Activity Telemetry",
  AUDIT_LOGS: "Audit Logs",
  CHAT_MESSAGES: "Chat Messages",
  FORUM_POSTS: "Forum Posts",
};

export default function RetentionPage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [volumes, setVolumes] = useState<DataVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Form state
  const [dataType, setDataType] = useState("");
  const [retentionDays, setRetentionDays] = useState("365");
  const [action, setAction] = useState("ARCHIVE");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function fetchPolicies() {
    try {
      const res = await fetch("/api/admin/retention");
      if (res.ok) {
        const data = await res.json();
        setPolicies(data.policies);
        setVolumes(data.volumes);
      }
    } catch {
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  }

  async function createPolicy() {
    try {
      const res = await fetch("/api/admin/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataType,
          retentionDays: parseInt(retentionDays),
          action,
          isActive: true,
          description: description || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Policy saved");
        setShowCreate(false);
        resetForm();
        fetchPolicies();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to save policy");
      }
    } catch {
      toast.error("Error saving policy");
    }
  }

  async function deletePolicy(dt: string) {
    try {
      const res = await fetch(`/api/admin/retention?dataType=${dt}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Policy deleted");
        fetchPolicies();
      }
    } catch {
      toast.error("Error deleting policy");
    }
  }

  async function executeNow() {
    setExecuting(true);
    try {
      const res = await fetch("/api/cron/retention", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Executed: ${data.results.length} policies affected data`);
        fetchPolicies();
      } else {
        toast.error("Execution failed");
      }
    } catch {
      toast.error("Error running retention");
    } finally {
      setExecuting(false);
    }
  }

  function resetForm() {
    setDataType("");
    setRetentionDays("365");
    setAction("ARCHIVE");
    setDescription("");
  }

  if (loading) return <div className="p-6">Loading retention policies...</div>;

  const existingTypes = new Set(policies.map((p) => p.dataType));
  const availableTypes = Object.keys(DATA_TYPE_LABELS).filter((t) => !existingTypes.has(t));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Retention & Compliance</h1>
          <p className="text-muted-foreground">
            Manage data lifecycle policies (GDPR/FERPA compliance)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={executeNow} disabled={executing}>
            <Clock className="w-4 h-4 mr-2" />
            {executing ? "Running..." : "Run Now"}
          </Button>
          {availableTypes.length > 0 && (
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="w-4 h-4 mr-2" /> Add Policy
            </Button>
          )}
        </div>
      </div>

      {/* Data Volumes */}
      <div className="grid grid-cols-4 gap-3">
        {volumes.map((v) => (
          <div key={v.type} className="border rounded-lg p-3 text-center">
            <Database className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{v.count.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{DATA_TYPE_LABELS[v.type] || v.type}</p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <h3 className="font-semibold">Add Retention Policy</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Data Type</Label>
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
              >
                <option value="">Select...</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>{DATA_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Retention (days)</Label>
              <Input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                min={1}
                max={3650}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Action After Expiry</Label>
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="ARCHIVE">Archive</option>
                <option value="ANONYMIZE">Anonymize</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Policy description..." />
          </div>
          <div className="flex gap-2">
            <Button onClick={createPolicy} disabled={!dataType || !retentionDays}>
              Save Policy
            </Button>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Policy List */}
      <div className="space-y-3">
        <h2 className="font-semibold">Active Policies</h2>
        {policies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No retention policies configured</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Data Type</th>
                  <th className="text-left p-3 font-medium">Retention</th>
                  <th className="text-left p-3 font-medium">Action</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Last Run</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id} className="border-t">
                    <td className="p-3 font-medium">{DATA_TYPE_LABELS[policy.dataType] || policy.dataType}</td>
                    <td className="p-3">{policy.retentionDays} days</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        policy.action === "DELETE" ? "bg-red-100 text-red-700" :
                        policy.action === "ANONYMIZE" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {policy.action}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        policy.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {policy.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {policy.lastExecutedAt ? new Date(policy.lastExecutedAt).toLocaleString() : "Never"}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => deletePolicy(policy.dataType)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
