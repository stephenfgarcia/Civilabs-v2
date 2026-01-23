"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BookmarkButtonProps {
  lessonId: string;
  isBookmarked: boolean;
}

export function BookmarkButton({ lessonId, isBookmarked: initial }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initial);
  const [isLoading, setIsLoading] = useState(false);

  const toggleBookmark = async () => {
    setIsLoading(true);
    try {
      if (isBookmarked) {
        const response = await fetch(`/api/bookmarks?lessonId=${lessonId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setIsBookmarked(false);
        }
      } else {
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        });
        if (response.ok) {
          setIsBookmarked(true);
        }
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBookmark}
            disabled={isLoading}
            className="h-9 w-9"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isBookmarked ? "Remove bookmark" : "Bookmark this lesson"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
