"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
}

interface Annotation {
  id: string;
  startOffset: number;
  endOffset: number;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
}

interface FeedbackPanelProps {
  courseId: string;
  assignmentId: string;
  submissionId: string;
  textContent?: string | null;
  currentUserId: string;
}

export function FeedbackPanel({
  courseId,
  assignmentId,
  submissionId,
  textContent,
  currentUserId,
}: FeedbackPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // For annotation creation
  const [selectedText, setSelectedText] = useState<{ start: number; end: number; text: string } | null>(null);
  const [annotationComment, setAnnotationComment] = useState("");

  const baseUrl = `/api/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}`;

  const fetchFeedback = useCallback(async () => {
    try {
      const [commentsRes, annotationsRes] = await Promise.all([
        fetch(`${baseUrl}/comments`),
        fetch(`${baseUrl}/annotations`),
      ]);

      if (commentsRes.ok) {
        setComments(await commentsRes.json());
      }
      if (annotationsRes.ok) {
        setAnnotations(await annotationsRes.json());
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  async function addComment() {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${baseUrl}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } catch {
      // Silent fail
    } finally {
      setSending(false);
    }
  }

  async function addAnnotation() {
    if (!selectedText || !annotationComment.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${baseUrl}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startOffset: selectedText.start,
          endOffset: selectedText.end,
          content: annotationComment.trim(),
        }),
      });
      if (res.ok) {
        const annotation = await res.json();
        setAnnotations((prev) => [...prev, annotation]);
        setSelectedText(null);
        setAnnotationComment("");
      }
    } catch {
      // Silent fail
    } finally {
      setSending(false);
    }
  }

  async function deleteAnnotation(id: string) {
    try {
      const res = await fetch(`${baseUrl}/annotations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // Silent fail
    }
  }

  function handleTextSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !textContent) return;

    const textEl = document.getElementById("submission-text-content");
    if (!textEl) return;

    const range = selection.getRangeAt(0);
    // Calculate offsets relative to the text content
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(textEl);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + range.toString().length;

    if (start < end && end <= textContent.length) {
      setSelectedText({ start, end, text: range.toString() });
    }
  }

  function renderAnnotatedText() {
    if (!textContent) return null;

    // Sort annotations by start offset
    const sorted = [...annotations].sort((a, b) => a.startOffset - b.startOffset);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((ann, idx) => {
      // Add text before annotation
      if (ann.startOffset > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {textContent.slice(lastIndex, ann.startOffset)}
          </span>
        );
      }
      // Add highlighted annotation
      parts.push(
        <span
          key={`ann-${ann.id}`}
          className="bg-yellow-200 border-b-2 border-yellow-500 cursor-pointer relative group"
          title={ann.content}
        >
          {textContent.slice(ann.startOffset, ann.endOffset)}
          <span className="absolute bottom-full left-0 hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded shadow-lg max-w-xs z-10">
            <strong>{ann.author.name || "Instructor"}:</strong> {ann.content}
          </span>
        </span>
      );
      lastIndex = ann.endOffset;
    });

    // Add remaining text
    if (lastIndex < textContent.length) {
      parts.push(
        <span key="text-end">{textContent.slice(lastIndex)}</span>
      );
    }

    return parts;
  }

  return (
    <div className="mt-4 border-t pt-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <MessageSquare className="w-4 h-4" />
        Feedback & Comments
      </div>

      {/* Text content with annotations (only for text submissions) */}
      {textContent && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Select text below to add an annotation:
          </p>
          <div
            id="submission-text-content"
            onMouseUp={handleTextSelection}
            className="p-3 bg-gray-50 border rounded text-sm whitespace-pre-wrap select-text cursor-text max-h-60 overflow-auto"
          >
            {renderAnnotatedText()}
          </div>

          {/* Annotation form */}
          {selectedText && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded space-y-2">
              <p className="text-xs text-yellow-800">
                Selected: &ldquo;{selectedText.text.substring(0, 50)}
                {selectedText.text.length > 50 ? "..." : ""}&rdquo;
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={annotationComment}
                  onChange={(e) => setAnnotationComment(e.target.value)}
                  placeholder="Add comment for this selection..."
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <Button size="sm" onClick={addAnnotation} disabled={sending || !annotationComment.trim()}>
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedText(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Annotations list */}
          {annotations.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600">Annotations:</p>
              {annotations.map((ann) => (
                <div key={ann.id} className="flex items-start gap-2 text-xs p-2 bg-yellow-50 rounded">
                  <div className="flex-1">
                    <span className="font-medium">{ann.author.name || "Instructor"}: </span>
                    <span className="text-gray-600">{ann.content}</span>
                  </div>
                  {ann.author.id === currentUserId && (
                    <button
                      onClick={() => deleteAnnotation(ann.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comment thread */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600">
          Comments ({comments.length})
        </p>

        {loading ? (
          <div className="text-xs text-gray-400">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="text-xs text-gray-400">No comments yet</div>
        ) : (
          <div className="space-y-2 max-h-40 overflow-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="p-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-medium">{comment.author.name || "User"}</span>
                  <span className="text-gray-400">
                    {comment.author.role === "INSTRUCTOR" || comment.author.role === "ADMIN"
                      ? "(Instructor)"
                      : "(Student)"}
                  </span>
                  <span className="text-gray-400 ml-auto">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add comment form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addComment()}
            placeholder="Add a comment..."
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <Button size="sm" onClick={addComment} disabled={sending || !newComment.trim()}>
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
