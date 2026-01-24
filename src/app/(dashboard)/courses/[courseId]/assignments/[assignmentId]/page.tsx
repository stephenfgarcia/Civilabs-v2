"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import {
  FileText, Upload, Link2, Clock, CheckCircle,
  AlertTriangle, Send,
} from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  points: number;
  dueDate: string | null;
  maxSubmissions: number;
  allowedFileTypes: string | null;
  submissions: Array<{
    id: string;
    status: string;
    grade: number | null;
    feedback: string | null;
    submittedAt: string | null;
    submissionNumber: number;
    fileUrl: string | null;
    fileName: string | null;
    textContent: string | null;
    urlLink: string | null;
    isLate: boolean;
  }>;
}

export default function StudentAssignmentPage({ params }: { params: Promise<{ courseId: string; assignmentId: string }> }) {
  const { courseId, assignmentId } = use(params);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Submission form
  const [textContent, setTextContent] = useState("");
  const [urlLink, setUrlLink] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);

  useEffect(() => {
    fetchAssignment();
  }, []);

  async function fetchAssignment() {
    try {
      const res = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}`);
      if (res.ok) {
        setAssignment(await res.json());
      } else {
        toast.error("Assignment not found");
      }
    } catch {
      toast.error("Failed to load assignment");
    } finally {
      setLoading(false);
    }
  }

  async function submitWork() {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      switch (assignment?.type) {
        case "FILE_UPLOAD":
          body.fileUrl = fileUrl;
          body.fileName = fileName;
          body.fileSize = fileSize;
          break;
        case "TEXT_ENTRY":
          body.textContent = textContent;
          break;
        case "URL_LINK":
          body.urlLink = urlLink;
          break;
      }

      const res = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Assignment submitted!");
        fetchAssignment();
        setTextContent("");
        setUrlLink("");
        setFileUrl("");
        setFileName("");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to submit");
      }
    } catch {
      toast.error("Error submitting assignment");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!assignment) return <div className="p-6">Assignment not found</div>;

  const latestSubmission = assignment.submissions[0];
  const submissionCount = assignment.submissions.filter((s) => s.status !== "DRAFT").length;
  const canSubmit = submissionCount < assignment.maxSubmissions;
  const isDue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const isGraded = latestSubmission?.status === "GRADED";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>{assignment.points} points</span>
          <span>{assignment.type.replace("_", " ").toLowerCase()}</span>
          {assignment.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Due: {new Date(assignment.dueDate).toLocaleString()}
              {isDue && <span className="text-red-500 font-medium ml-1">(Past Due)</span>}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {assignment.description && (
        <div className="prose prose-sm max-w-none p-4 bg-muted/30 rounded-lg">
          <p>{assignment.description}</p>
        </div>
      )}

      {/* Previous Submissions */}
      {assignment.submissions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Your Submissions</h2>
          {assignment.submissions.map((sub) => (
            <div key={sub.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Submission #{sub.submissionNumber}</span>
                  {sub.isLate && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Late</span>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    sub.status === "GRADED" ? "bg-green-100 text-green-700" :
                    sub.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {sub.status}
                  </span>
                </div>
                {sub.submittedAt && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {sub.status === "GRADED" && (
                <div className="p-3 bg-muted/50 rounded space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Grade: {sub.grade}/{assignment.points}</span>
                    <span className="text-sm text-muted-foreground">
                      ({Math.round(((sub.grade || 0) / assignment.points) * 100)}%)
                    </span>
                  </div>
                  {sub.feedback && (
                    <p className="text-sm text-muted-foreground mt-2">{sub.feedback}</p>
                  )}
                </div>
              )}

              {sub.fileUrl && (
                <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {sub.fileName || "Attached file"}
                </a>
              )}
              {sub.textContent && (
                <p className="text-sm text-muted-foreground line-clamp-3">{sub.textContent}</p>
              )}
              {sub.urlLink && (
                <a href={sub.urlLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <Link2 className="w-3 h-3" /> {sub.urlLink}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Form */}
      {canSubmit && !isGraded ? (
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-semibold">
            {submissionCount > 0 ? "Resubmit" : "Submit Your Work"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {assignment.maxSubmissions - submissionCount} submission{assignment.maxSubmissions - submissionCount !== 1 ? "s" : ""} remaining
          </p>

          {assignment.type === "FILE_UPLOAD" && (
            <div className="space-y-2">
              <Label>Upload File</Label>
              {fileUrl ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{fileName}</span>
                  <Button variant="ghost" size="sm" onClick={() => { setFileUrl(""); setFileName(""); }}>Remove</Button>
                </div>
              ) : (
                <UploadButton<OurFileRouter, "assignmentSubmission">
                  endpoint="assignmentSubmission"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]) {
                      setFileUrl(res[0].ufsUrl);
                      setFileName(res[0].name);
                      setFileSize(res[0].size);
                    }
                  }}
                  onUploadError={(error) => {
                    toast.error(error.message || "Upload failed");
                  }}
                />
              )}
              {assignment.allowedFileTypes && (
                <p className="text-xs text-muted-foreground">Allowed: {assignment.allowedFileTypes}</p>
              )}
            </div>
          )}

          {assignment.type === "TEXT_ENTRY" && (
            <div className="space-y-2">
              <Label>Your Response</Label>
              <textarea
                className="w-full min-h-[200px] p-3 border rounded-md text-sm resize-y"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Write your response here..."
              />
            </div>
          )}

          {assignment.type === "URL_LINK" && (
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                type="url"
                value={urlLink}
                onChange={(e) => setUrlLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          {isDue && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded text-amber-700 text-sm">
              <AlertTriangle className="w-4 h-4" />
              This assignment is past due. Your submission will be marked as late.
            </div>
          )}

          <Button
            onClick={submitWork}
            disabled={submitting || (assignment.type === "FILE_UPLOAD" && !fileUrl) || (assignment.type === "TEXT_ENTRY" && !textContent.trim()) || (assignment.type === "URL_LINK" && !urlLink.trim())}
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      ) : (
        !canSubmit && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Maximum submissions reached
          </div>
        )
      )}
    </div>
  );
}
