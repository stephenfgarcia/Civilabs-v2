"use client";

import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

interface CourseReviewsProps {
  courseId: string;
  isEnrolled: boolean;
  userId?: string;
}

function StarRating({
  rating,
  onRate,
  interactive = false,
  size = "sm",
}: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
  size?: "sm" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "lg" ? "h-6 w-6" : "h-4 w-4";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => onRate?.(star)}
        >
          <Star
            className={`${sizeClass} ${
              star <= (hovered || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

export function CourseReviews({ courseId, isEnrolled, userId }: CourseReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userReview, setUserReview] = useState<Review | null>(null);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setStats(data.stats);

        // Check if user already has a review
        if (userId) {
          const existing = data.reviews.find((r: Review) => r.user.id === userId);
          if (existing) {
            setUserReview(existing);
            setRating(existing.rating);
            setTitle(existing.title || "");
            setContent(existing.content || "");
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const handleSubmitReview = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          content: content.trim() || undefined,
        }),
      });
      if (response.ok) {
        setShowForm(false);
        fetchReviews();
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Student Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary */}
        {stats && stats.totalReviews > 0 && (
          <div className="flex gap-6 items-start">
            <div className="text-center">
              <p className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</p>
              <StarRating rating={Math.round(stats.averageRating)} />
              <p className="text-sm text-muted-foreground mt-1">
                {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star] || 0;
                const percentage = stats.totalReviews > 0
                  ? (count / stats.totalReviews) * 100
                  : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-3">{star}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <Progress value={percentage} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-6">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Write Review Button / Form */}
        {isEnrolled && (
          <div>
            {showForm ? (
              <div className="space-y-3 p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium mb-2">Your Rating</p>
                  <StarRating rating={rating} onRate={setRating} interactive size="lg" />
                </div>
                <Input
                  placeholder="Review title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Share your experience with this course..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={rating === 0 || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {userReview ? "Update Review" : "Submit Review"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Star className="h-4 w-4 mr-2" />
                {userReview ? "Edit Your Review" : "Write a Review"}
              </Button>
            )}
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 && !isEnrolled ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No reviews yet. Be the first to review this course!
          </p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No reviews yet.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={review.user.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {review.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{review.user.name || "Student"}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                  {review.title && (
                    <p className="text-sm font-medium mt-1">{review.title}</p>
                  )}
                  {review.content && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
