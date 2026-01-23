"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LearningPathEnrollButtonProps {
  pathId: string;
}

export function LearningPathEnrollButton({ pathId }: LearningPathEnrollButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnroll = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/learning-paths/${pathId}/enroll`, {
        method: "POST",
      });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to enroll:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleEnroll} disabled={isLoading} size="sm">
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <GraduationCap className="h-4 w-4 mr-2" />
      )}
      Enroll
    </Button>
  );
}
