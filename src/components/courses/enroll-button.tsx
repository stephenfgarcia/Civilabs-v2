"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnrollButtonProps {
  courseId: string;
}

export function EnrollButton({ courseId }: EnrollButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnroll = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        router.refresh();
      } else if (response.status === 401) {
        // Not logged in, redirect to login
        router.push(`/login?callbackUrl=/courses/${courseId}`);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to enroll");
      }
    } catch (error) {
      console.error("Failed to enroll:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleEnroll}
      disabled={isLoading}
      className="w-full btn-hover-lift"
      size="lg"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <BookOpen className="h-4 w-4 mr-2" />
      )}
      Enroll Now
    </Button>
  );
}
