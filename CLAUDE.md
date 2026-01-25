# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CiviLabs LMS is a Learning Management System for engineering education with 3D scene capabilities. It's a full-stack Next.js application with role-based access (Student, Instructor, Admin).

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production (runs prisma generate first)
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run db:seed      # Seed database with initial data

# Database
npx prisma generate  # Generate Prisma client after schema changes
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma database browser
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Neon serverless) with Prisma ORM
- **Auth**: NextAuth.js v5 (Google OAuth + Credentials)
- **UI**: Tailwind CSS 4 + Radix UI components
- **Real-time**: Pusher
- **File Uploads**: UploadThing
- **3D**: React Three Fiber + drei
- **Testing**: Jest + React Testing Library

### Data Flow
```
Client → API Routes (/api/*) → Prisma → Neon PostgreSQL
                ↓
         Auth (NextAuth) validates session
                ↓
         Rate Limiting (Upstash Redis) in middleware
```

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/app/(auth)/` - Login, register, password reset pages
- `src/app/(dashboard)/` - Protected dashboard routes (student/instructor/admin)
- `src/app/api/` - REST API endpoints
- `src/components/` - React components (ui/, layout/, editor/, learn/, etc.)
- `src/lib/` - Core utilities (db, auth, validations, notifications, etc.)
- `prisma/schema.prisma` - Database schema

### Core Utilities (src/lib/)
- `db.ts` - Prisma client singleton with Neon adapter
- `auth.ts` - NextAuth configuration with JWT sessions
- `validations.ts` - Zod schemas for all API inputs
- `notifications.ts` - In-app notification helpers
- `grade-sync.ts` - Auto-sync grades to gradebook
- `release-conditions.ts` - Content availability logic
- `audit.ts` - Audit log recording

### API Route Pattern
All API routes follow this structure:
```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { someSchema } from "@/lib/validations";

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validation = someSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: "Invalid input", errors: validation.error.issues }, { status: 400 });
  }

  // Database operations with db.model.action()
}
```

### User Roles
- `STUDENT` - Browse courses, enroll, learn, submit assignments
- `INSTRUCTOR` - Create courses, grade submissions, view analytics
- `ADMIN` - Full system access, user management, platform settings

### Route Params Pattern (Next.js 16)
Dynamic route params are now async Promises:
```typescript
interface RouteParams {
  params: Promise<{ courseId: string; chapterId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const { courseId, chapterId } = await params;
}
```

## Database Schema Highlights

Major model groups in `prisma/schema.prisma`:
- **Auth**: User, Account, Session
- **Courses**: Course, Chapter, Lesson, Category
- **Assessments**: Quiz, Question, QuizAttempt, QuestionBank
- **Assignments**: Assignment, AssignmentSubmission, SubmissionComment
- **Grading**: Rubric, GradeCategory, GradeItem, StudentGrade
- **Communication**: ForumCategory, ForumThread, ChatRoom, Message, Announcement
- **Scheduling**: ReleaseCondition, CalendarEvent, AttendanceSession

## Testing

Tests are in `src/__tests__/`. Jest is configured with:
- jsdom environment for React components
- Mocked `next/navigation`, `next-auth/react`
- Path alias `@/` → `./src/`
- 50% coverage threshold

Run a single test file:
```bash
npm run test -- path/to/file.test.ts
```

## Environment Variables

Required for development:
- `DATABASE_URL` - Neon PostgreSQL connection (pooled)
- `DIRECT_URL` - Neon direct connection
- `NEXTAUTH_SECRET` - Session encryption key
- `NEXTAUTH_URL` - Base URL (http://localhost:3000 for dev)

Optional integrations:
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth
- `UPLOADTHING_SECRET/APP_ID` - File uploads
- `PUSHER_*` - Real-time chat
- `UPSTASH_REDIS_*` - Rate limiting
- `SENTRY_*` - Error tracking
- `RESEND_API_KEY` - Email sending

See `PRODUCTION_CHECKLIST.md` for full deployment configuration.

## Key Patterns

### Validation
All user input is validated with Zod schemas from `src/lib/validations.ts`. Always use `.safeParse()` and return 400 on validation failure.

### Prisma JSON Fields
Use `Prisma.JsonNull` for null JSON values, not JavaScript `null`:
```typescript
data: {
  rubricScores: rubricScores ? (rubricScores as Prisma.InputJsonValue) : Prisma.JsonNull,
}
```

### Fire-and-Forget Operations
Non-critical async operations (notifications, grade sync) use void pattern:
```typescript
void syncGradeToGradebook({ courseId, userId, score });
void notifyAssignmentGraded(userId, title, courseId);
```

### Component Structure
UI components use shadcn/ui pattern with Radix primitives and Tailwind. Base components are in `src/components/ui/`, feature components in domain folders (editor/, learn/, grading/, etc.).

## Workflow Preferences

- **Ask questions first**: Before starting a sprint or major feature, ask clarifying questions to improve work output
- **Commit after every feature**: Don't batch commits - commit immediately after each feature is complete
- **Run tests after every feature**: Execute `npm run test` and `npm run build` after each feature implementation
- **Update DEVELOPMENT_PLAN.md**: Always update the development plan after completing each sprint with progress, key files, and update log entry
- **Push after commits**: Push to remote after committing
