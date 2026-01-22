"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Box,
  X,
  Upload,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ModelUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
}: ModelUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading: uploadThingUploading } = useUploadThing("lessonModel", {
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
        // Check file size (64MB limit)
        if (file.size > 64 * 1024 * 1024) {
          setError("3D model must be less than 64MB");
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
      "model/gltf-binary": [".glb"],
      "model/gltf+json": [".gltf"],
      "application/octet-stream": [".glb"],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const isLoading = isUploading || uploadThingUploading;

  if (value) {
    const fileName = value.split("/").pop() || "3D Model";
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Box className="h-8 w-8 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
            >
              <ExternalLink className="h-3 w-3" />
              View file
            </a>
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
            ? "border-purple-500 bg-purple-500/5"
            : "border-muted-foreground/25 hover:border-purple-500/50",
          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
            <div className="w-full max-w-xs">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center mt-2">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          </div>
        ) : isDragActive ? (
          <>
            <Upload className="h-10 w-10 text-purple-500" />
            <p className="text-sm text-purple-500">Drop the 3D model here</p>
          </>
        ) : (
          <>
            <div className="p-4 rounded-full bg-purple-500/10">
              <Box className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Drag and drop a 3D model, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                GLB, GLTF up to 64MB
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
