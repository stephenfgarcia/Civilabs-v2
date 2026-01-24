"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Mail, Plus, Send, Clock, CheckCircle, XCircle, Trash2,
} from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  recipientFilter: Record<string, unknown>;
  status: string;
  sentAt: string | null;
  scheduledFor: string | null;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterCourseId, setFilterCourseId] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/admin/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign() {
    const recipientFilter: Record<string, unknown> = {};
    if (filterRole) recipientFilter.role = filterRole;
    if (filterCourseId) recipientFilter.courseId = filterCourseId;

    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subject, content, recipientFilter }),
      });

      if (res.ok) {
        toast.success("Campaign created");
        setShowCreate(false);
        resetForm();
        fetchCampaigns();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create campaign");
      }
    } catch {
      toast.error("Error creating campaign");
    }
  }

  async function sendCampaign(campaignId: string) {
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", campaignId }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Sent to ${data.sentCount} recipients`);
        fetchCampaigns();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to send");
      }
    } catch {
      toast.error("Error sending campaign");
    }
  }

  async function deleteCampaign(campaignId: string) {
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Campaign deleted");
        fetchCampaigns();
      }
    } catch {
      toast.error("Error deleting campaign");
    }
  }

  function resetForm() {
    setTitle("");
    setSubject("");
    setContent("");
    setFilterRole("");
    setFilterCourseId("");
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "SENT": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "FAILED": return <XCircle className="w-4 h-4 text-red-600" />;
      case "SCHEDULED": return <Clock className="w-4 h-4 text-blue-600" />;
      case "SENDING": return <Mail className="w-4 h-4 text-yellow-600 animate-pulse" />;
      default: return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) return <div className="p-6">Loading campaigns...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground">{campaigns.length} campaigns</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <h3 className="font-semibold">Create Campaign</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Campaign name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Content (HTML)</Label>
            <textarea
              className="w-full min-h-[120px] p-3 border rounded-md text-sm resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<h2>Hello!</h2><p>Your email content...</p>"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Filter: Role (optional)</Label>
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">All users</option>
                <option value="STUDENT">Students only</option>
                <option value="INSTRUCTOR">Instructors only</option>
                <option value="ADMIN">Admins only</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Filter: Course ID (optional)</Label>
              <Input value={filterCourseId} onChange={(e) => setFilterCourseId(e.target.value)} placeholder="Course ID" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={createCampaign} disabled={!title || !subject || !content}>
              Create Draft
            </Button>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Campaign List */}
      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No campaigns yet</p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(campaign.status)}
                  <div>
                    <h3 className="font-medium">{campaign.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {campaign.subject} &middot; Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === "SENT" && (
                    <span className="text-xs text-muted-foreground">
                      {campaign.sentCount} sent, {campaign.failedCount} failed
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    campaign.status === "SENT" ? "bg-green-100 text-green-700" :
                    campaign.status === "FAILED" ? "bg-red-100 text-red-700" :
                    campaign.status === "SCHEDULED" ? "bg-blue-100 text-blue-700" :
                    campaign.status === "SENDING" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {campaign.status}
                  </span>
                  {campaign.status === "DRAFT" && (
                    <>
                      <Button size="sm" onClick={() => sendCampaign(campaign.id)}>
                        <Send className="w-3 h-3 mr-1" /> Send
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteCampaign(campaign.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
