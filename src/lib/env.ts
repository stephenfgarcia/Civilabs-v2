/**
 * Environment variable validation
 * This ensures all required environment variables are set before the app runs
 */

const requiredEnvVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
] as const;

const optionalEnvVars = [
  // Auth providers
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",

  // Real-time chat
  "PUSHER_APP_ID",
  "PUSHER_KEY",
  "PUSHER_SECRET",
  "PUSHER_CLUSTER",
  "NEXT_PUBLIC_PUSHER_KEY",
  "NEXT_PUBLIC_PUSHER_CLUSTER",

  // File uploads
  "UPLOADTHING_SECRET",
  "UPLOADTHING_APP_ID",

  // Email
  "RESEND_API_KEY",

  // Error tracking
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_AUTH_TOKEN",

  // Rate limiting
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

type RequiredEnvVar = typeof requiredEnvVars[number];
type OptionalEnvVar = typeof optionalEnvVars[number];

interface EnvConfig {
  // Required
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;

  // Optional with defaults
  NODE_ENV: "development" | "production" | "test";
}

/**
 * Validates that all required environment variables are set
 * Call this at app startup
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join("\n")}\n\n` +
      `Please check your .env file or Vercel environment settings.`
    );
  }
}

/**
 * Get environment configuration with type safety
 */
export function getEnvConfig(): EnvConfig {
  validateEnv();

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) || "development",
  };
}

/**
 * Check if optional features are enabled based on env vars
 */
export const features = {
  googleAuth: () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  pusher: () => !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET),
  uploadthing: () => !!(process.env.UPLOADTHING_SECRET && process.env.UPLOADTHING_APP_ID),
  email: () => !!process.env.RESEND_API_KEY,
  sentry: () => !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  rateLimit: () => !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
};

/**
 * Log which features are enabled (useful for debugging)
 */
export function logFeatureStatus(): void {
  console.log("=== CiviLabs Feature Status ===");
  console.log(`Google Auth: ${features.googleAuth() ? "✓ Enabled" : "✗ Disabled"}`);
  console.log(`Real-time Chat (Pusher): ${features.pusher() ? "✓ Enabled" : "✗ Disabled"}`);
  console.log(`File Uploads (UploadThing): ${features.uploadthing() ? "✓ Enabled" : "✗ Disabled"}`);
  console.log(`Email (Resend): ${features.email() ? "✓ Enabled" : "✗ Disabled"}`);
  console.log(`Error Tracking (Sentry): ${features.sentry() ? "✓ Enabled" : "✗ Disabled"}`);
  console.log(`Rate Limiting (Upstash): ${features.rateLimit() ? "✓ Enabled" : "✗ Disabled"}`);
  console.log("================================");
}

/**
 * Check if we're in production
 */
export const isProduction = process.env.NODE_ENV === "production";

/**
 * Check if we're in development
 */
export const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // For server-side
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}
