"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Loader2, ImagePlus, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  endpoint: "courseImage" | "userAvatar";
  disabled?: boolean;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  endpoint,
  disabled = false,
  className,
  aspectRatio = "video",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading: uploadThingUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        onChange(res[0].ufsUrl);
        setError(null);
      }
      setIsUploading(false);
    },
    onUploadError: (err) => {
      setError(err.message);
      setIsUploading(false);
    },
    onUploadBegin: () => {
      setIsUploading(true);
      setError(null);
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
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[3/1]",
  }[aspectRatio];

  const isLoading = isUploading || uploadThingUploading;

  if (value) {
    return (
      <div className={cn("relative", aspectRatioClass, className)}>
        <Image
          src={value}
          alt="Uploaded image"
          fill
          className="object-cover rounded-lg"
        />
        {!disabled && onRemove && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          aspectRatioClass,
          "flex flex-col items-center justify-center gap-2",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <>
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : isDragActive ? (
          <>
            <Upload className="h-10 w-10 text-primary" />
            <p className="text-sm text-primary">Drop the image here</p>
          </>
        ) : (
          <>
            <ImagePlus className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center px-4">
              Drag and drop an image, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to {endpoint === "userAvatar" ? "2MB" : "4MB"}
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
