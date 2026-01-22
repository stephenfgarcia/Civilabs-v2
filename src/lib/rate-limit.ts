import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limiters for different purposes
// General API: 100 requests per minute
export const generalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:general",
});

// Auth endpoints: 10 requests per minute (stricter for login/register)
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ratelimit:auth",
});

// Upload endpoints: 20 requests per minute
export const uploadRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "ratelimit:upload",
});

// Heavy operations (reports, exports): 5 requests per minute
export const heavyRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "ratelimit:heavy",
});

/**
 * Get the client's IP address from the request
 */
export function getClientIp(request: NextRequest): string {
  // Check various headers that might contain the real IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (shouldn't happen in production)
  return "127.0.0.1";
}

/**
 * Rate limit response helper
 */
export function rateLimitExceededResponse(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: "Too many requests",
      message: "Please slow down. You have exceeded the rate limit.",
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetTime),
      },
    }
  );
}

/**
 * Check rate limit and return result
 */
export async function checkRateLimit(
  request: NextRequest,
  limiter: Ratelimit = generalRateLimiter
): Promise<{ success: boolean; reset: number; remaining: number }> {
  const ip = getClientIp(request);
  const { success, reset, remaining } = await limiter.limit(ip);

  return { success, reset, remaining };
}

/**
 * Rate limit middleware helper for API routes
 * Usage:
 *   const rateLimitResult = await applyRateLimit(request);
 *   if (rateLimitResult) return rateLimitResult; // Returns 429 response if limited
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: Ratelimit = generalRateLimiter
): Promise<NextResponse | null> {
  // Skip rate limiting if Redis is not configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("Rate limiting skipped: Upstash Redis not configured");
    return null;
  }

  try {
    const { success, reset } = await checkRateLimit(request, limiter);

    if (!success) {
      return rateLimitExceededResponse(reset);
    }

    return null; // Request is allowed
  } catch (error) {
    // Log error but don't block the request if rate limiting fails
    console.error("Rate limiting error:", error);
    return null;
  }
}

/**
 * Create a rate-limited API handler wrapper
 * Usage:
 *   export const GET = withRateLimit(async (request) => {
 *     // Your handler code
 *   });
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: Ratelimit = generalRateLimiter
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await applyRateLimit(request, limiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request);
  };
}
