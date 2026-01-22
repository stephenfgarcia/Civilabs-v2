"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Video, X, Upload, Play, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

export function VideoUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading: uploadThingUploading } = useUploadThing("lessonVideo", {
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
        const file = acceptedFiles[0];
        // Check file size (512MB limit)
        if (file.size > 512 * 1024 * 1024) {
          setError("Video must be less than 512MB");
          return;
        }
        setIsUploading(true);
        await startUpload(acceptedFiles);
      }
    },
    [startUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".webm", ".mov", ".avi", ".mkv"],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const isLoading = isUploading || uploadThingUploading;

  if (value) {
    return (
      <div className={cn("relative", className)}>
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
          <video
            src={value}
            className="w-full h-full object-contain"
            controls
          />
          {!disabled && onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 truncate">
          {value.split("/").pop()}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          "aspect-video flex flex-col items-center justify-center gap-3",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 w-full px-8">
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
            <p className="text-sm text-primary">Drop the video here</p>
          </>
        ) : (
          <>
            <div className="p-4 rounded-full bg-muted">
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm text-muted-foreground">
                Drag and drop a video, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, WebM, MOV up to 512MB
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
