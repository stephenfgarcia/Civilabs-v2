"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, AlertTriangle, Clock, BookOpen, User,
} from "lucide-react";

interface PendingApproval {
  id: string;
  courseId: string;
  status: string;
  submittedAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    isPublished: boolean;
    instructor: { id: string; name: string | null; email: string; image: string | null };
    _count: { chapters: number; enrollments: number };
  };
}

interface RecentDecision {
  id: string;
  courseId: string;
  status: string;
  reviewedAt: string | null;
  reviewComment: string | null;
  course: {
    id: string;
    title: string;
    instructor: { name: string | null; email: string };
  };
}

export default function ReviewQueuePage() {
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [recent, setRecent] = useState<RecentDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    try {
      const res = await fetch("/api/admin/review-queue");
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending);
        setRecent(data.recentDecisions);
      }
    } catch {
      toast.error("Failed to load review queue");
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(courseId: string, action: "APPROVE" | "REJECT" | "REQUEST_CHANGES") {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: comment || undefined }),
      });

      if (res.ok) {
        toast.success(`Course ${action.toLowerCase().replace("_", " ")}d`);
        setReviewingId(null);
        setComment("");
        fetchQueue();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to process review");
      }
    } catch {
      toast.error("Error processing review");
    }
  }

  if (loading) return <div className="p-6">Loading review queue...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Course Review Queue</h1>
        <p className="text-muted-foreground">
          {pending.length} course{pending.length !== 1 ? "s" : ""} pending review
        </p>
      </div>

      {/* Pending Reviews */}
      <div className="space-y-4">
        {pending.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No courses pending review</p>
          </div>
        ) : (
          pending.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{item.course.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.course.instructor.name || item.course.instructor.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {item.course._count.chapters} chapters
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Submitted {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  Pending Review
                </span>
              </div>

              {item.course.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{item.course.description}</p>
              )}

              {reviewingId === item.courseId ? (
                <div className="space-y-3 pt-3 border-t">
                  <Input
                    placeholder="Add a comment (optional)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleReview(item.courseId, "APPROVE")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-yellow-600 border-yellow-300"
                      onClick={() => handleReview(item.courseId, "REQUEST_CHANGES")}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" /> Request Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReview(item.courseId, "REJECT")}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setReviewingId(null); setComment(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setReviewingId(item.courseId)}>
                  Review
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Recent Decisions */}
      {recent.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Recent Decisions</h2>
          <div className="space-y-2">
            {recent.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium text-sm">{item.course.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    by {item.course.instructor.name || item.course.instructor.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    item.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {item.status}
                  </span>
                  {item.reviewedAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.reviewedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
