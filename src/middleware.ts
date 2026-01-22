import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash is configured
const isRateLimitEnabled =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Create Redis client only if configured
const redis = isRateLimitEnabled
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limiters
const generalLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
      analytics: true,
      prefix: "ratelimit:api",
    })
  : null;

const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute for auth
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "127.0.0.1";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (pathname.startsWith("/api")) {
    // Skip rate limiting if not configured
    if (!isRateLimitEnabled || !generalLimiter || !authLimiter) {
      return NextResponse.next();
    }

    // Skip rate limiting for NextAuth session checks (called frequently by SessionProvider)
    // These are read-only operations that don't pose a security risk
    if (
      pathname === "/api/auth/session" ||
      pathname === "/api/auth/csrf" ||
      pathname === "/api/auth/providers"
    ) {
      return NextResponse.next();
    }

    const ip = getClientIp(request);

    // Use stricter limits for auth mutation endpoints (signin, signout, callback)
    const isAuthMutationEndpoint =
      pathname.includes("/api/auth/signin") ||
      pathname.includes("/api/auth/signout") ||
      pathname.includes("/api/auth/callback") ||
      pathname.includes("/api/register") ||
      pathname.includes("/api/login");

    const limiter = isAuthMutationEndpoint ? authLimiter : generalLimiter;

    try {
      const { success, reset, remaining } = await limiter.limit(ip);

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
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
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(reset),
            },
          }
        );
      }

      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      response.headers.set("X-RateLimit-Reset", String(reset));
      return response;
    } catch (error) {
      // If rate limiting fails, allow the request but log the error
      console.error("Rate limiting error:", error);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to API routes only
  matcher: ["/api/:path*"],
};
