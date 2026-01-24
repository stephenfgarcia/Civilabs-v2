"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Webhook, Key, Plus, Trash2, Send, Eye, EyeOff, Copy, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebhookData {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  isActive: boolean;
  secret?: string;
  createdAt: string;
  _count: { deliveries: number };
}

interface WebhookDetail extends WebhookData {
  deliveries: {
    id: string;
    event: string;
    statusCode: number | null;
    success: boolean;
    attempts: number;
    error: string | null;
    deliveredAt: string;
    completedAt: string | null;
  }[];
}

interface APIKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  key?: string; // Only on creation
}

const WEBHOOK_EVENTS = [
  { value: "ENROLLMENT_CREATED", label: "Enrollment Created" },
  { value: "ENROLLMENT_COMPLETED", label: "Enrollment Completed" },
  { value: "ASSIGNMENT_SUBMITTED", label: "Assignment Submitted" },
  { value: "GRADE_UPDATED", label: "Grade Updated" },
  { value: "COURSE_PUBLISHED", label: "Course Published" },
  { value: "ASSESSMENT_ATTEMPTED", label: "Assessment Attempted" },
  { value: "USER_CREATED", label: "User Created" },
];

const API_PERMISSIONS = [
  { value: "COURSES", label: "Courses" },
  { value: "ENROLLMENTS", label: "Enrollments" },
  { value: "GRADES", label: "Grades" },
  { value: "USERS", label: "Users" },
  { value: "ANALYTICS", label: "Analytics" },
];

export default function DeveloperSettingsPage() {
  const [tab, setTab] = useState<"webhooks" | "apikeys">("webhooks");

  // Webhook state
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [webhookDetail, setWebhookDetail] = useState<WebhookDetail | null>(null);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ url: "", description: "", events: [] as string[] });
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // API Key state
  const [apiKeys, setApiKeys] = useState<APIKeyData[]>([]);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKey, setNewKey] = useState({ name: "", permissions: [] as string[], expiresAt: "" });
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebhooks();
    fetchApiKeys();
  }, []);

  // ---- Webhook Functions ----
  async function fetchWebhooks() {
    try {
      const res = await fetch("/api/webhooks");
      if (res.ok) setWebhooks(await res.json());
    } catch {
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }

  async function createWebhook() {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      toast.error("URL and at least one event are required");
      return;
    }
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedSecret(data.secret);
        toast.success("Webhook created");
        setShowCreateWebhook(false);
        setNewWebhook({ url: "", description: "", events: [] });
        fetchWebhooks();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create webhook");
      }
    } catch {
      toast.error("Error creating webhook");
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Delete this webhook? All delivery history will be lost.")) return;
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Webhook deleted");
        if (webhookDetail?.id === id) setWebhookDetail(null);
        fetchWebhooks();
      }
    } catch {
      toast.error("Error deleting webhook");
    }
  }

  async function toggleWebhook(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        toast.success(isActive ? "Webhook disabled" : "Webhook enabled");
        fetchWebhooks();
      }
    } catch {
      toast.error("Error updating webhook");
    }
  }

  async function testWebhook(id: string) {
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      if (res.ok) {
        toast.success("Test webhook dispatched");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to test");
      }
    } catch {
      toast.error("Error testing webhook");
    }
  }

  async function viewDeliveries(id: string) {
    try {
      const res = await fetch(`/api/webhooks/${id}`);
      if (res.ok) setWebhookDetail(await res.json());
    } catch {
      toast.error("Failed to load deliveries");
    }
  }

  // ---- API Key Functions ----
  async function fetchApiKeys() {
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) setApiKeys(await res.json());
    } catch {
      toast.error("Failed to load API keys");
    }
  }

  async function createApiKey() {
    if (!newKey.name || newKey.permissions.length === 0) {
      toast.error("Name and at least one permission are required");
      return;
    }
    try {
      const body: Record<string, unknown> = { name: newKey.name, permissions: newKey.permissions };
      if (newKey.expiresAt) body.expiresAt = new Date(newKey.expiresAt).toISOString();
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedKey(data.key);
        toast.success("API key created");
        setShowCreateKey(false);
        setNewKey({ name: "", permissions: [], expiresAt: "" });
        fetchApiKeys();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create key");
      }
    } catch {
      toast.error("Error creating API key");
    }
  }

  async function revokeApiKey(id: string) {
    if (!confirm("Revoke this API key? It will immediately stop working.")) return;
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("API key revoked");
        fetchApiKeys();
      }
    } catch {
      toast.error("Error revoking key");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  if (loading) return <div className="p-6">Loading developer settings...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Webhook className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Developer Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "webhooks" ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground"}`}
          onClick={() => setTab("webhooks")}
        >
          <Webhook className="w-4 h-4 inline mr-1" />
          Webhooks
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "apikeys" ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground"}`}
          onClick={() => setTab("apikeys")}
        >
          <Key className="w-4 h-4 inline mr-1" />
          API Keys
        </button>
      </div>

      {/* Created Secret Alert */}
      {createdSecret && (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800">Webhook signing secret (save it now — it won&apos;t be shown again):</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">{createdSecret}</code>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(createdSecret)}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setCreatedSecret(null)}>Dismiss</Button>
        </div>
      )}

      {/* Created Key Alert */}
      {createdKey && (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800">API Key (save it now — it won&apos;t be shown again):</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">{createdKey}</code>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(createdKey)}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setCreatedKey(null)}>Dismiss</Button>
        </div>
      )}

      {/* ========== WEBHOOKS TAB ========== */}
      {tab === "webhooks" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Receive HTTP POST notifications when events occur on the platform.</p>
            <Button size="sm" onClick={() => setShowCreateWebhook(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Webhook
            </Button>
          </div>

          {/* Create Webhook Form */}
          {showCreateWebhook && (
            <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
              <h3 className="font-medium">New Webhook</h3>
              <div>
                <label className="text-xs font-medium">Payload URL</label>
                <input
                  type="url"
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="https://your-server.com/webhook"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Description (optional)</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="e.g., Sync enrollments to external system"
                  value={newWebhook.description}
                  onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Events</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <label key={ev.value} className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(ev.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhook({ ...newWebhook, events: [...newWebhook.events, ev.value] });
                          } else {
                            setNewWebhook({ ...newWebhook, events: newWebhook.events.filter((x) => x !== ev.value) });
                          }
                        }}
                      />
                      {ev.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={createWebhook}>Create</Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreateWebhook(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Webhook List */}
          {webhooks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No webhooks configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div key={wh.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-medium">{wh.url}</code>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${wh.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {wh.isActive ? "Active" : "Disabled"}
                        </span>
                      </div>
                      {wh.description && <p className="text-xs text-muted-foreground mt-1">{wh.description}</p>}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {wh.events.map((ev) => (
                          <span key={ev} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                            {ev.replace(/_/g, " ").toLowerCase()}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{wh._count.deliveries} deliveries</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => testWebhook(wh.id)} title="Test">
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => viewDeliveries(wh.id)} title="View deliveries">
                        {webhookDetail?.id === wh.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleWebhook(wh.id, wh.isActive)} title="Toggle">
                        <span className="text-xs">{wh.isActive ? "Off" : "On"}</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteWebhook(wh.id)} title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Delivery Log (inline) */}
                  {webhookDetail?.id === wh.id && webhookDetail.deliveries.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <h4 className="text-xs font-medium mb-2">Recent Deliveries</h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {webhookDetail.deliveries.map((d) => (
                          <div key={d.id} className="flex items-center gap-2 text-xs py-1 border-b last:border-0">
                            {d.success ? (
                              <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                            ) : d.completedAt ? (
                              <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                            )}
                            <span className="text-muted-foreground">{d.event.replace(/_/g, " ").toLowerCase()}</span>
                            <span className={`ml-auto ${d.success ? "text-green-600" : "text-red-600"}`}>
                              {d.statusCode || "err"}
                            </span>
                            <span className="text-muted-foreground">{new Date(d.deliveredAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== API KEYS TAB ========== */}
      {tab === "apikeys" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Generate API keys to access the CiviLabs API programmatically.</p>
            <Button size="sm" onClick={() => setShowCreateKey(true)}>
              <Plus className="w-4 h-4 mr-1" /> Generate Key
            </Button>
          </div>

          {/* Create Key Form */}
          {showCreateKey && (
            <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
              <h3 className="font-medium">Generate API Key</h3>
              <div>
                <label className="text-xs font-medium">Key Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="e.g., Production Integration"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Permissions</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                  {API_PERMISSIONS.map((perm) => (
                    <label key={perm.value} className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={newKey.permissions.includes(perm.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKey({ ...newKey, permissions: [...newKey.permissions, perm.value] });
                          } else {
                            setNewKey({ ...newKey, permissions: newKey.permissions.filter((x) => x !== perm.value) });
                          }
                        }}
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Expires (optional)</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  value={newKey.expiresAt}
                  onChange={(e) => setNewKey({ ...newKey, expiresAt: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={createApiKey}>Generate</Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreateKey(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* API Key List */}
          {apiKeys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No API keys generated</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{key.name}</span>
                        <code className="text-xs text-muted-foreground">{key.keyPrefix}...</code>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${key.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {key.isActive ? "Active" : "Revoked"}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {key.permissions.map((perm) => (
                          <span key={perm} className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                            {perm.toLowerCase()}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                        {key.lastUsedAt && <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                        {key.expiresAt && <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    {key.isActive && (
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => revokeApiKey(key.id)}>
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
