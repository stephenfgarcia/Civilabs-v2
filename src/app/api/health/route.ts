import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { features } from "@/lib/env";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: CheckResult;
    redis?: CheckResult;
  };
  features: {
    googleAuth: boolean;
    pusher: boolean;
    uploadthing: boolean;
    email: boolean;
    sentry: boolean;
    rateLimit: boolean;
  };
}

interface CheckResult {
  status: "pass" | "fail";
  latency?: number;
  message?: string;
}

const startTime = Date.now();

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return {
      status: "pass",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "fail",
      message: error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      status: "pass",
      message: "Redis not configured (optional)",
    };
  }

  const start = Date.now();
  try {
    const response = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/ping`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
      }
    );

    if (response.ok) {
      return {
        status: "pass",
        latency: Date.now() - start,
      };
    }

    return {
      status: "fail",
      message: `Redis returned status ${response.status}`,
    };
  } catch (error) {
    return {
      status: "fail",
      message: error instanceof Error ? error.message : "Redis connection failed",
    };
  }
}

// GET /api/health - Health check endpoint
export async function GET() {
  try {
    const [databaseCheck, redisCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
    ]);

    const checks = {
      database: databaseCheck,
      ...(process.env.UPSTASH_REDIS_REST_URL && { redis: redisCheck }),
    };

    // Determine overall status
    const allPassing = Object.values(checks).every((c) => c.status === "pass");
    const anyFailing = Object.values(checks).some((c) => c.status === "fail");

    let overallStatus: HealthStatus["status"] = "healthy";
    if (anyFailing) {
      // If database fails, it's unhealthy; if only optional services fail, it's degraded
      overallStatus = databaseCheck.status === "fail" ? "unhealthy" : "degraded";
    }

    const health: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks,
      features: {
        googleAuth: features.googleAuth(),
        pusher: features.pusher(),
        uploadthing: features.uploadthing(),
        email: features.email(),
        sentry: features.sentry(),
        rateLimit: features.rateLimit(),
      },
    };

    const statusCode = overallStatus === "unhealthy" ? 503 : 200;

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}

// HEAD /api/health - Simple health check (for monitoring tools)
export async function HEAD() {
  try {
    await db.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
