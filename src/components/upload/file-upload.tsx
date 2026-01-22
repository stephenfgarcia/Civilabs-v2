"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  FileText,
  X,
  Upload,
  File,
  FileSpreadsheet,
  Presentation,
  AlertCircle,
  Download,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FileEndpoint = "lessonPdf" | "lessonDocument" | "attachment" | "forumAttachment";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  endpoint: FileEndpoint;
  disabled?: boolean;
  className?: string;
  accept?: Record<string, string[]>;
  maxSize?: string;
}

const defaultAccept: Record<FileEndpoint, Record<string, string[]>> = {
  lessonPdf: {
    "application/pdf": [".pdf"],
  },
  lessonDocument: {
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "application/vnd.ms-powerpoint": [".ppt"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  },
  attachment: {
    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    "application/pdf": [".pdf"],
    "application/zip": [".zip"],
  },
  forumAttachment: {
    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    "application/pdf": [".pdf"],
  },
};

const maxSizes: Record<FileEndpoint, string> = {
  lessonPdf: "16MB",
  lessonDocument: "32MB",
  attachment: "64MB",
  forumAttachment: "8MB",
};

function getFileIcon(url: string) {
  const ext = url.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return <FileText className="h-8 w-8 text-red-500" />;
    case "doc":
    case "docx":
      return <FileText className="h-8 w-8 text-blue-500" />;
    case "xls":
    case "xlsx":
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    case "ppt":
    case "pptx":
      return <Presentation className="h-8 w-8 text-orange-500" />;
    default:
      return <File className="h-8 w-8 text-muted-foreground" />;
  }
}

function getFileName(url: string) {
  return url.split("/").pop() || "Unknown file";
}

export function FileUpload({
  value,
  onChange,
  onRemove,
  endpoint,
  disabled = false,
  className,
  accept,
  maxSize,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading: uploadThingUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        onChange(res[0].ufsUrl);
        setError(null);
      }
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadError: (err) => {
      setError(err.message);
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadBegin: () => {
      setIsUploading(true);
      setError(null);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setIsUploading(true);
        await startUpload(acceptedFiles);
      }
    },
    [startUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || defaultAccept[endpoint],
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const isLoading = isUploading || uploadThingUploading;
  const displayMaxSize = maxSize || maxSizes[endpoint];

  if (value) {
    const fileName = getFileName(value);
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
          {getFileIcon(value)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <div className="flex items-center gap-2 mt-1">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Open
              </a>
              <a
                href={value}
                download
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            </div>
          </div>
          {!disabled && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg cursor-pointer transition-colors p-8",
          "flex flex-col items-center justify-center gap-3",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="w-full max-w-xs">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center mt-2">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          </div>
        ) : isDragActive ? (
          <>
            <Upload className="h-10 w-10 text-primary" />
            <p className="text-sm text-primary">Drop the file here</p>
          </>
        ) : (
          <>
            <div className="p-3 rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Drag and drop a file, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max file size: {displayMaxSize}
              </p>
            </div>
          </>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
