"use client";

import { useState } from "react";
import { ExternalLink, Download, Maximize2, X, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  fileUrl: string;
  fileName?: string | null;
}

function getFileType(url: string, fileName?: string | null): "pdf" | "image" | "office" | "other" {
  const name = (fileName || url).toLowerCase();

  if (name.endsWith(".pdf")) return "pdf";
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name)) return "image";
  if (/\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(name)) return "office";
  return "other";
}

function getGoogleDocsViewerUrl(fileUrl: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
}

export function FilePreview({ fileUrl, fileName }: FilePreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const fileType = getFileType(fileUrl, fileName);
  const displayName = fileName || "Attached file";

  function FileIcon() {
    switch (fileType) {
      case "pdf":
        return <FileText className="w-4 h-4 text-red-500" />;
      case "image":
        return <Image className="w-4 h-4 text-green-500" />;
      case "office":
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  }

  function renderPreview() {
    switch (fileType) {
      case "pdf":
        return (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={displayName}
          />
        );
      case "image":
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt={displayName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );
      case "office":
        return (
          <iframe
            src={getGoogleDocsViewerUrl(fileUrl)}
            className="w-full h-full border-0"
            title={displayName}
          />
        );
      default:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
            <File className="w-12 h-12 mb-2" />
            <p className="text-sm">Preview not available for this file type</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-blue-600 hover:underline text-sm"
            >
              Open in new tab
            </a>
          </div>
        );
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2 text-sm">
          <FileIcon />
          <span className="font-medium truncate max-w-[200px]">{displayName}</span>
          <span className="text-xs text-gray-400 uppercase">
            {fileType === "other" ? "" : fileType}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Open in new tab">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
          <a href={fileUrl} download={fileName || undefined}>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Download">
              <Download className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>

      {/* Preview area */}
      <div className={expanded ? "h-[500px]" : "h-[200px]"}>
        {renderPreview()}
      </div>
    </div>
  );
}
