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

### Sprint Planning
- **Ask questions first**: Before starting a sprint or major feature, ask clarifying questions (mix of multiple choice and open-ended)
- **Explain features**: After completing each feature, explain what was built and document in DEVELOPMENT_PLAN.md
- **Deferred items**: Occasionally remind about deferred items (SAML, SCORM, Peer Review, etc.) when relevant

### Development Cycle
- **Commit after every feature**: Don't batch commits - commit immediately after each feature is complete
- **Push after commits**: Push to remote after committing
- **Run tests after every feature**: Execute `npm run test` and `npm run build` after each feature
- **Write new tests**: Write tests for new features, not just run existing tests
- **Build failures**: If build fails, note it and ask before fixing (don't auto-fix)
- **Schema changes**: Always run `npx prisma db push` and `npx prisma generate` after schema changes

### Code Style
- **Comments**: Keep minimal like existing codebase (no excessive JSDoc)
- **Error messages**: Use both user-friendly message + technical details:
  ```typescript
  return NextResponse.json({
    message: "Failed to fetch course",  // user-friendly
    error: "Connection timeout on course.findUnique"  // technical (in dev/logged)
  }, { status: 500 });
  ```

### Documentation
- **Update DEVELOPMENT_PLAN.md**: Always update after completing each sprint with:
  - Progress tracker row
  - Sprint section with feature table and key files
  - Update log entry

### Scope & Decision Making
- **Related improvements**: If I notice a related improvement or small bug during a feature, note it and ask if you want it included
- **UI/UX decisions**: Match existing patterns but make reasonable improvements if I see better approaches
- **Performance**: Include optimizations when clearly beneficial (caching, query optimization, lazy loading)
- **Dependencies**: Add new npm packages if clearly needed for the feature

### Session Routine
- **Session start**: Automatically read CLAUDE.md + DEVELOPMENT_PLAN.md when starting a new chat
- **Progress updates**: Give status update after each feature completes
- **Context management**: Summarize completed work periodically to free up context in long sessions

### Work Style
- **Sequential work**: Work on features one at a time (safer, easier to track)
- **Code reuse**: Search thoroughly before writing new code to avoid duplication
- **API consistency**: Enforce strict response format consistency across all API routes (refactor existing if needed)

### Quality Standards
- **Security**: Proactively add security measures (rate limiting, input sanitization, RBAC checks)
- **Mobile**: Desktop-first approach, mobile responsiveness added later
