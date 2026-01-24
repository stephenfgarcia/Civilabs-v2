# CiviLabs LMS - Development Plan & Progress Tracker

> **Last Updated:** January 2026
> **Overall Progress:** Phase 1-9, 11-19 + Sprint A Complete | Production Ready & Deployed

---

## Project Overview

CiviLabs LMS is a Learning Management System designed for engineering education with 3D scene capabilities.

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Authentication:** NextAuth.js v5
- **Styling:** Tailwind CSS + shadcn/ui
- **Real-time:** Pusher
- **3D Rendering:** React Three Fiber + @react-three/drei
- **Deployment:** Vercel

### User Roles

1. **Student** - Browse courses, enroll, learn, take quizzes, earn certificates
2. **Instructor** - Create and manage courses, chapters, lessons, quizzes
3. **Admin** - Full system management, user management, analytics

---

## Progress Tracker

### Legend

- [x] Completed
- [ ] Not Started
- [~] In Progress

---

## Phase 1: Foundation & Authentication

**Status: COMPLETED**

| Feature               | Status | Files                                                                      |
| --------------------- | ------ | -------------------------------------------------------------------------- |
| Project Setup         | [x]    | `package.json`, `tsconfig.json`, `tailwind.config.ts`                      |
| Database Schema       | [x]    | `prisma/schema.prisma`                                                     |
| Prisma + Neon Setup   | [x]    | `src/lib/db.ts`                                                            |
| NextAuth.js v5 Config | [x]    | `src/lib/auth.ts`, `auth.config.ts`                                        |
| Credential Provider   | [x]    | `src/lib/auth.ts`                                                          |
| Login Page            | [x]    | `src/app/(auth)/login/page.tsx`                                            |
| Register Page         | [x]    | `src/app/(auth)/register/page.tsx`                                         |
| Auth API Routes       | [x]    | `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/register/route.ts` |
| Session Provider      | [x]    | `src/components/providers/session-provider.tsx`                            |
| Protected Routes      | [x]    | `src/middleware.ts`                                                        |

**Completion Date:** Earlier Session

---

## Phase 2: Core LMS Features

**Status: COMPLETED**

### 2.1 UI Foundation

| Feature             | Status | Files                                 |
| ------------------- | ------ | ------------------------------------- |
| Theme Configuration | [x]    | `src/app/globals.css`                 |
| Button Component    | [x]    | `src/components/ui/button.tsx`        |
| Card Component      | [x]    | `src/components/ui/card.tsx`          |
| Input Component     | [x]    | `src/components/ui/input.tsx`         |
| Label Component     | [x]    | `src/components/ui/label.tsx`         |
| Textarea Component  | [x]    | `src/components/ui/textarea.tsx`      |
| Badge Component     | [x]    | `src/components/ui/badge.tsx`         |
| Avatar Component    | [x]    | `src/components/ui/avatar.tsx`        |
| Dropdown Menu       | [x]    | `src/components/ui/dropdown-menu.tsx` |
| Sheet (Sidebar)     | [x]    | `src/components/ui/sheet.tsx`         |
| Dialog/Modal        | [x]    | `src/components/ui/dialog.tsx`        |
| Select Component    | [x]    | `src/components/ui/select.tsx`        |
| Switch Component    | [x]    | `src/components/ui/switch.tsx`        |
| Separator Component | [x]    | `src/components/ui/separator.tsx`     |

### 2.2 Dashboard Layout

| Feature            | Status | Files                                   |
| ------------------ | ------ | --------------------------------------- |
| Dashboard Layout   | [x]    | `src/app/(dashboard)/layout.tsx`        |
| Sidebar Navigation | [x]    | `src/components/layout/sidebar.tsx`     |
| Navbar             | [x]    | `src/components/layout/navbar.tsx`      |
| Mobile Navigation  | [x]    | `src/components/layout/mobile-nav.tsx`  |
| User Button        | [x]    | `src/components/layout/user-button.tsx` |

### 2.3 Instructor - Course Management

| Feature                 | Status | Files                                                        |
| ----------------------- | ------ | ------------------------------------------------------------ |
| Courses List Page       | [x]    | `src/app/(dashboard)/instructor/courses/page.tsx`            |
| Create Course API       | [x]    | `src/app/api/courses/route.ts`                               |
| Course CRUD API         | [x]    | `src/app/api/courses/[courseId]/route.ts`                    |
| Course Editor Page      | [x]    | `src/app/(dashboard)/instructor/courses/[courseId]/page.tsx` |
| Course Title Form       | [x]    | `src/components/editor/course-title-form.tsx`                |
| Course Description Form | [x]    | `src/components/editor/course-description-form.tsx`          |
| Course Image Form       | [x]    | `src/components/editor/course-image-form.tsx`                |
| Course Category Form    | [x]    | `src/components/editor/course-category-form.tsx`             |
| Course Price Form       | [x]    | `src/components/editor/course-price-form.tsx`                |
| Course Actions          | [x]    | `src/components/editor/course-actions.tsx`                   |

### 2.4 Instructor - Chapter Management

| Feature                  | Status | Files                                                                             |
| ------------------------ | ------ | --------------------------------------------------------------------------------- |
| Chapters List Component  | [x]    | `src/components/editor/chapters-list.tsx`                                         |
| Chapters Form            | [x]    | `src/components/editor/chapters-form.tsx`                                         |
| Chapters API             | [x]    | `src/app/api/courses/[courseId]/chapters/route.ts`                                |
| Chapter CRUD API         | [x]    | `src/app/api/courses/[courseId]/chapters/[chapterId]/route.ts`                    |
| Chapter Editor Page      | [x]    | `src/app/(dashboard)/instructor/courses/[courseId]/chapters/[chapterId]/page.tsx` |
| Chapter Title Form       | [x]    | `src/components/editor/chapter-title-form.tsx`                                    |
| Chapter Description Form | [x]    | `src/components/editor/chapter-description-form.tsx`                              |
| Chapter Actions          | [x]    | `src/components/editor/chapter-actions.tsx`                                       |
| Chapter Reorder API      | [x]    | `src/app/api/courses/[courseId]/chapters/reorder/route.ts`                        |

### 2.5 Instructor - Lesson Management

| Feature                | Status | Files                                                                                                |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Lessons List Component | [x]    | `src/components/editor/lessons-list.tsx`                                                             |
| Lessons Form           | [x]    | `src/components/editor/lessons-form.tsx`                                                             |
| Lessons API            | [x]    | `src/app/api/courses/[courseId]/chapters/[chapterId]/lessons/route.ts`                               |
| Lesson CRUD API        | [x]    | `src/app/api/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]/route.ts`                    |
| Lesson Editor Page     | [x]    | `src/app/(dashboard)/instructor/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]/page.tsx` |
| Lesson Edit Form       | [x]    | `src/components/editor/lesson-edit-form.tsx`                                                         |
| Lesson Content Editor  | [x]    | `src/components/editor/lesson-content-editor.tsx`                                                    |
| Lesson Actions         | [x]    | `src/components/editor/lesson-actions.tsx`                                                           |
| Lesson Reorder API     | [x]    | `src/app/api/courses/[courseId]/chapters/[chapterId]/lessons/reorder/route.ts`                       |
| File Upload Component  | [x]    | `src/components/upload/file-upload.tsx`                                                              |

### 2.6 Instructor - Quiz Management

| Feature                | Status | Files                                                                                      |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Quiz Builder Component | [x]    | `src/components/editor/quiz-builder.tsx`                                                   |
| Quiz API               | [x]    | `src/app/api/courses/[courseId]/chapters/[chapterId]/quiz/route.ts`                        |
| Quiz Questions API     | [x]    | `src/app/api/courses/[courseId]/chapters/[chapterId]/quiz/questions/route.ts`              |
| Question CRUD API      | [x]    | `src/app/api/courses/[courseId]/chapters/[chapterId]/quiz/questions/[questionId]/route.ts` |

### 2.7 Student - Course Discovery

| Feature             | Status | Files                                             |
| ------------------- | ------ | ------------------------------------------------- |
| Course Catalog Page | [x]    | `src/app/(dashboard)/courses/page.tsx`            |
| Course Filters      | [x]    | `src/components/courses/course-filters.tsx`       |
| Course Detail Page  | [x]    | `src/app/(dashboard)/courses/[courseId]/page.tsx` |
| Enroll Button       | [x]    | `src/components/courses/enroll-button.tsx`        |
| Enrollment API      | [x]    | `src/app/api/enrollments/route.ts`                |

### 2.8 Student - Learning Experience

| Feature           | Status | Files                                                                       |
| ----------------- | ------ | --------------------------------------------------------------------------- |
| Learn Page        | [x]    | `src/app/(dashboard)/courses/[courseId]/learn/page.tsx`                     |
| Course Sidebar    | [x]    | `src/components/learn/course-sidebar.tsx`                                   |
| Lesson Viewer     | [x]    | `src/components/learn/lesson-viewer.tsx`                                    |
| Quiz Player       | [x]    | `src/components/learn/quiz-player.tsx`                                      |
| Progress API      | [x]    | `src/app/api/progress/route.ts`                                             |
| Quiz Attempt API  | [x]    | `src/app/api/courses/[courseId]/chapters/[chapterId]/quiz/attempt/route.ts` |
| Student Dashboard | [x]    | `src/app/(dashboard)/dashboard/page.tsx`                                    |

### 2.9 Certificate System

| Feature                 | Status | Files                                                 |
| ----------------------- | ------ | ----------------------------------------------------- |
| Certificates List Page  | [x]    | `src/app/(dashboard)/certificates/page.tsx`           |
| Certificate View Page   | [x]    | `src/app/certificates/[code]/page.tsx`                |
| Certificate Verify Page | [x]    | `src/app/verify/page.tsx`                             |
| Certificates API        | [x]    | `src/app/api/certificates/route.ts`                   |
| Certificate Get API     | [x]    | `src/app/api/certificates/[certificateId]/route.ts`   |
| Certificate Verify API  | [x]    | `src/app/api/certificates/verify/[code]/route.ts`     |
| Certificate Download    | [x]    | `src/components/certificate/certificate-download.tsx` |

**Completion Date:** Current Session

---

## Phase 3: Discussion Forums

**Status: COMPLETED**

| Feature                   | Status | Files                                                              |
| ------------------------- | ------ | ------------------------------------------------------------------ |
| Forum Categories Model    | [x]    | `prisma/schema.prisma` (ForumCategory, ForumThread, ForumReply)    |
| Forums List Page          | [x]    | `src/app/(dashboard)/forums/page.tsx`                              |
| Forum Category Page       | [x]    | `src/app/(dashboard)/forums/[categorySlug]/page.tsx`               |
| Thread Detail Page        | [x]    | `src/app/(dashboard)/forums/[categorySlug]/[threadId]/page.tsx`    |
| Forum Admin Page          | [x]    | `src/app/(dashboard)/forums/admin/page.tsx`                        |
| Create Thread Dialog      | [x]    | `src/components/forums/create-thread-dialog.tsx`                   |
| Reply Form                | [x]    | `src/components/forums/reply-form.tsx`                             |
| Thread Actions            | [x]    | `src/components/forums/thread-actions.tsx`                         |
| Category List             | [x]    | `src/components/forums/category-list.tsx`                          |
| Create Category Dialog    | [x]    | `src/components/forums/create-category-dialog.tsx`                 |
| Edit Category Dialog      | [x]    | `src/components/forums/edit-category-dialog.tsx`                   |
| Forums API                | [x]    | `src/app/api/forums/route.ts`                                      |
| Category API              | [x]    | `src/app/api/forums/[categoryId]/route.ts`                         |
| Threads API               | [x]    | `src/app/api/forums/[categoryId]/threads/route.ts`                 |
| Thread CRUD API           | [x]    | `src/app/api/forums/threads/[threadId]/route.ts`                   |
| Replies API               | [x]    | `src/app/api/forums/threads/[threadId]/replies/route.ts`           |
| Reply CRUD API            | [x]    | `src/app/api/forums/threads/[threadId]/replies/[replyId]/route.ts` |
| Alert Dialog Component    | [x]    | `src/components/ui/alert-dialog.tsx`                               |
| Sidebar Navigation Update | [x]    | `src/components/layout/sidebar.tsx`                                |

**Completion Date:** Current Session

---

## Phase 4: Real-time Chat

**Status: COMPLETED**

| Feature              | Status | Files                                                        |
| -------------------- | ------ | ------------------------------------------------------------ |
| Pusher Configuration | [x]    | `src/lib/pusher.ts`                                          |
| Chat Room Model      | [x]    | `prisma/schema.prisma` (ChatRoom, Message - already existed) |
| Chat Page            | [x]    | `src/app/(dashboard)/chat/page.tsx`                          |
| Chat Room Page       | [x]    | `src/app/(dashboard)/chat/[roomId]/page.tsx`                 |
| Chat Room Component  | [x]    | `src/components/chat/chat-room.tsx`                          |
| Message List         | [x]    | `src/components/chat/message-list.tsx`                       |
| Message Input        | [x]    | `src/components/chat/message-input.tsx`                      |
| Chat API             | [x]    | `src/app/api/chat/route.ts`                                  |
| Chat Room API        | [x]    | `src/app/api/chat/[roomId]/route.ts`                         |
| Messages API         | [x]    | `src/app/api/chat/[roomId]/messages/route.ts`                |
| Message Delete API   | [x]    | `src/app/api/chat/[roomId]/messages/[messageId]/route.ts`    |
| Pusher Auth API      | [x]    | `src/app/api/pusher/auth/route.ts`                           |

**Completion Date:** Current Session

---

## Phase 5: Admin Dashboard

**Status: COMPLETED**

| Feature                 | Status | Files                                                |
| ----------------------- | ------ | ---------------------------------------------------- |
| Admin Layout            | [x]    | `src/app/(dashboard)/admin/layout.tsx`               |
| Admin Dashboard         | [x]    | `src/app/(dashboard)/admin/page.tsx`                 |
| User Management Page    | [x]    | `src/app/(dashboard)/admin/users/page.tsx`           |
| User Edit Page          | [x]    | `src/app/(dashboard)/admin/users/[userId]/page.tsx`  |
| Course Management Page  | [x]    | `src/app/(dashboard)/admin/courses/page.tsx`         |
| Category Management     | [x]    | `src/app/(dashboard)/admin/categories/page.tsx`      |
| Analytics Dashboard     | [x]    | `src/app/(dashboard)/admin/analytics/page.tsx`       |
| Forums Admin Redirect   | [x]    | `src/app/(dashboard)/admin/forums/page.tsx`          |
| Admin Users API         | [x]    | `src/app/api/admin/users/route.ts`                   |
| Admin User CRUD API     | [x]    | `src/app/api/admin/users/[userId]/route.ts`          |
| Admin Courses API       | [x]    | `src/app/api/admin/courses/route.ts`                 |
| Admin Course CRUD API   | [x]    | `src/app/api/admin/courses/[courseId]/route.ts`      |
| Admin Analytics API     | [x]    | `src/app/api/admin/analytics/route.ts`               |
| Admin Categories API    | [x]    | `src/app/api/admin/categories/route.ts`              |


| User Search Component   | [x]    | `src/components/admin/user-search.tsx`               |
| User Role Select        | [x]    | `src/components/admin/user-role-select.tsx`          |
| User Delete Button      | [x]    | `src/components/admin/user-delete-button.tsx`        |
| Course Search Component | [x]    | `src/components/admin/course-search.tsx`             |
| Category List Component | [x]    | `src/components/admin/category-list.tsx`             |
| Create Category Dialog  | [x]    | `src/components/admin/create-category-dialog.tsx`    |
| Edit Category Dialog    | [x]    | `src/components/admin/edit-category-dialog.tsx`      |

**Completion Date:** Current Session

---

## Phase 6: 3D Scene Viewer

**Status: COMPLETED**

| Feature                      | Status | Files                                                         |
| ---------------------------- | ------ | ------------------------------------------------------------- |
| Three.js Setup               | [x]    | `package.json` (three, @react-three/fiber, @react-three/drei) |
| Scene Config Types           | [x]    | `src/types/scene.ts`                                          |
| Scene Viewer Component       | [x]    | `src/components/3d/scene-viewer.tsx`                          |
| Model Loader                 | [x]    | `src/components/3d/model-loader.tsx`                          |
| Primitive Object Renderer    | [x]    | `src/components/3d/primitive-object.tsx`                      |
| Scene Lights                 | [x]    | `src/components/3d/scene-lights.tsx`                          |
| Scene Controls               | [x]    | `src/components/3d/scene-controls.tsx`                        |
| Annotation System            | [x]    | `src/components/3d/annotations.tsx`                           |
| 3D Components Index          | [x]    | `src/components/3d/index.ts`                                  |
| Scene Editor (Instructor)    | [x]    | `src/components/editor/scene-editor.tsx`                      |
| Scene Lesson Editor          | [x]    | `src/components/editor/scene-lesson-editor.tsx`               |
| Lesson Viewer 3D Integration | [x]    | `src/components/learn/lesson-viewer.tsx` (updated)            |
| Lesson Content Editor 3D     | [x]    | `src/components/editor/lesson-content-editor.tsx` (updated)   |
| Tooltip Component            | [x]    | `src/components/ui/tooltip.tsx`                               |

**Completion Date:** Current Session

---

## Architecture Overview

```
src/
├── app/
│   ├── (auth)/                 # Auth pages (login, register)
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── admin/              # Admin-only pages
│   │   │   ├── audit-logs/     # Audit logs viewer
│   │   │   ├── reports/        # Admin reports
│   │   │   ├── analytics/      # Platform analytics
│   │   │   └── settings/       # Admin settings page
│   │   ├── instructor/         # Instructor-only pages
│   │   │   ├── courses/        # Course management
│   │   │   ├── media/          # Media library
│   │   │   └── settings/       # Instructor settings page
│   │   ├── student/            # Student-only pages
│   │   │   └── settings/       # Student settings page
│   │   ├── courses/            # Student course pages
│   │   ├── certificates/       # Certificate management
│   │   ├── bookmarks/          # Bookmarked lessons (Phase 9)
│   │   ├── notes/              # Personal notes (Phase 9)
│   │   ├── learning-paths/     # Learning path listings (Phase 9)
│   │   ├── progress/           # Student progress reports (Phase 13)
│   │   ├── chat/               # Real-time chat (Phase 4)
│   │   ├── forums/             # Discussion forums (Phase 3)
│   │   ├── notifications/      # Notification center (Phase 8)
│   │   └── dashboard/          # Student dashboard
│   ├── api/
│   │   ├── auth/               # NextAuth routes
│   │   ├── courses/            # Course CRUD
│   │   ├── enrollments/        # Enrollment management
│   │   ├── progress/           # Progress tracking
│   │   ├── certificates/       # Certificate generation
│   │   ├── chat/               # Chat API (Phase 4)
│   │   ├── forums/             # Forums API (Phase 3)
│   │   ├── admin/              # Admin API (Phase 5) + Platform Settings API
│   │   ├── profile/            # User profile API (Settings)
│   │   ├── settings/           # Notification & Privacy settings APIs
│   │   ├── bookmarks/           # Bookmarks CRUD API (Phase 9)
│   │   ├── notes/               # Notes CRUD API (Phase 9)
│   │   ├── learning-paths/      # Learning paths API (Phase 9)
│   │   ├── reports/             # CSV export API (Phase 13)
│   │   ├── audit-logs/         # Audit logs API (Production)
│   │   ├── health/             # Health check endpoint (Production)
│   │   ├── media/              # Media library API (Phase 7)
│   │   ├── notifications/      # Notifications API (Phase 8)
│   │   └── uploadthing/        # File upload API (Phase 7)
│   ├── certificates/           # Public certificate view
│   └── verify/                 # Public certificate verification
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Layout components
│   ├── editor/                 # Course editor components
│   ├── courses/                # Course display components
│   ├── learn/                  # Learning interface components
│   ├── certificate/            # Certificate components
│   ├── chat/                   # Chat components (Phase 4)
│   ├── forums/                 # Forum components (Phase 3)
│   ├── settings/               # Settings form components (Settings)
│   ├── 3d/                     # 3D viewer components (Phase 6)
│   ├── upload/                 # File upload components (Phase 7)
│   └── providers/              # Context providers
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── db.ts                   # Prisma client
│   ├── pusher.ts               # Pusher config (Phase 4)
│   ├── audit.ts                # Audit logging (Production)
│   ├── env.ts                  # Environment validation (Production)
│   ├── rate-limit.ts           # Rate limiting utils (Production)
│   ├── notifications.ts        # Notification helpers (Phase 8)
│   └── utils.ts                # Utility functions
├── __tests__/                  # Test suites (Phase 12)
│   ├── api/                   # API route tests
│   ├── components/            # Component tests
│   ├── lib/                   # Utility tests
│   └── test-utils.tsx         # Test helpers & mock data
├── middleware.ts               # Rate limiting middleware (Production)
├── instrumentation.ts          # Sentry instrumentation (Production)
└── types/                      # TypeScript types

Root Config Files:
├── sentry.client.config.ts     # Sentry browser config
├── sentry.server.config.ts     # Sentry server config
├── sentry.edge.config.ts       # Sentry edge config
├── vercel.json                 # Vercel deployment config
└── PRODUCTION_CHECKLIST.md     # Deployment guide
```

---

## Database Schema Summary

### Models (Implemented)

- **User** - Authentication and profile
- **Account** - OAuth accounts (NextAuth)
- **Course** - Course information
- **Chapter** - Course chapters
- **Lesson** - Individual lessons (VIDEO, TEXT, PDF, DOCUMENT, POWERPOINT, SCENE_3D)
- **Quiz** - Chapter quizzes
- **Question** - Quiz questions
- **QuizAttempt** - Student quiz attempts
- **Enrollment** - Course enrollments
- **UserProgress** - Lesson completion tracking
- **Certificate** - Completion certificates
- **Category** - Course categories
- **ForumCategory** - Forum categories (Phase 3)
- **ForumThread** - Forum threads (Phase 3)
- **ForumReply** - Thread replies (Phase 3)
- **ChatRoom** - Chat rooms (Phase 4)
- **ChatMessage** - Chat messages (Phase 4)
- **Media** - Media library items (Phase 7)
- **Notification** - User notifications (Phase 8)
- **AuditLog** - Admin audit trail (Production)
- **NotificationPreference** - Per-user notification toggles (Settings)
- **PlatformSettings** - Admin platform configuration singleton (Settings)
- **Bookmark** - Lesson bookmarks (Phase 9)
- **Note** - Personal lesson notes (Phase 9)
- **Review** - Course ratings/reviews (Phase 9)
- **LearningPath** - Curated course sequences (Phase 9)
- **LearningPathCourse** - Path-course relationships (Phase 9)
- **LearningPathEnrollment** - User path enrollment (Phase 9)
- **CoursePrerequisite** - Course dependencies (Phase 9)

### Models (Planned — Phase 14-19)

**Phase 14 — Assessment & Assignments:**
- **Assignment** - File/text submission assignments
- **AssignmentSubmission** - Student submissions with grading and status
- **Rubric** - Grading rubrics with criteria
- **RubricCriterion** - Individual rubric criteria and level definitions
- **QuestionBank** - Reusable question pools per course
- **QuestionBankItem** - Links questions to banks
- *Updated:* Quiz → Assessment (renamed, expanded fields)
- *Updated:* QuizAttempt → AssessmentAttempt (expanded fields)
- *Updated:* Question (new type enum, matching/ordering/blank fields)

**Phase 15 — Gradebook & Scheduling:**
- **GradingScale** - Custom grading scales with configurable levels
- **GradeCategory** - Weighted grade categories per course
- **GradeItem** - Individual gradeable items linked to assignments/assessments
- **StudentGrade** - Per-student grades with override support
- **ReleaseCondition** - Brightspace-style content release rules
- **ReleaseConditionGroup** - AND/OR grouping for nested conditions
- **Announcement** - Course and global announcements
- **AttendanceSession** - Attendance session records
- **AttendanceRecord** - Per-student attendance entries
- **AttendancePolicy** - Attendance rules and grade impact
- **UserActivity** - Full telemetry event tracking

**Phase 16 — Admin Security & Compliance:**
- **MFAConfig** - Multi-factor auth settings per user
- **CourseApproval** - Course review workflow records
- **EmailCampaign** - Admin email broadcast campaigns
- **RetentionPolicy** - Per-data-type retention rules
- **ConsentRecord** - GDPR consent tracking per user

**Phase 17 — Calendar, Groups & Collaboration (COMPLETED):**
- **CalendarEvent** - Course and personal calendar events with 6 event types
- **CalendarToken** - Unique per-user token for iCal subscription URL
- **CourseGroup** - Student groups within courses with max member limits
- **GroupMember** - Group membership with LEADER/MEMBER roles

**Phase 18 — Analytics (COMPLETED):**
- No new models (read-only visualization layer over existing data)

**Phase 19 — Integrations (COMPLETED — Webhooks & API Keys):**
- **Webhook** - Developer webhook subscriptions with URL, events, HMAC secret
- **WebhookDelivery** - Delivery logs with retry tracking (attempts, nextRetryAt, success)
- **APIKey** - API keys with SHA-256 hash, resource-level permissions, expiry
- **WebhookEvent** enum - 7 event types
- **APIKeyPermission** enum - 5 resource permissions (COURSES, ENROLLMENTS, GRADES, USERS, ANALYTICS)
- (Deferred: SAMLConfig, SCORMPackage, SCORMData, Competency, CompetencyMapping, StudentCompetency)

---

## Progress Summary

| Phase              | Description                        | Status      | Completion |
| ------------------ | ---------------------------------- | ----------- | ---------- |
| Phase 1            | Foundation & Authentication        | COMPLETED   | 100%       |
| Phase 2            | Core LMS Features                  | COMPLETED   | 100%       |
| Phase 3            | Discussion Forums                  | COMPLETED   | 100%       |
| Phase 4            | Real-time Chat                     | COMPLETED   | 100%       |
| Phase 5            | Admin Dashboard                    | COMPLETED   | 100%       |
| Phase 6            | 3D Scene Viewer                    | COMPLETED   | 100%       |
| Phase 7            | File Upload & Media                | COMPLETED   | 100%       |
| Phase 8            | Notifications                      | COMPLETED   | 100%       |
| Phase 9            | Advanced Learning                  | COMPLETED   | 100%       |
| Phase 10           | Mobile & PWA                       | SKIPPED     | N/A        |
| Phase 11           | Performance & SEO                  | COMPLETED   | 100%       |
| Phase 12           | Testing & Quality                  | COMPLETED   | 100%       |
| Phase 13           | Analytics & Reporting              | COMPLETED   | 100%       |
| Phase 14           | Instructor Core: Assessment & Assignments | COMPLETED   | 100%  |
| Phase 15           | Instructor Core: Gradebook & Scheduling   | COMPLETED   | 100%  |
| Phase 16           | Admin Core: Security & Compliance         | COMPLETED   | 100%  |
| Phase 17           | Cross-Role: Calendar, Groups & Collab     | COMPLETED   | 100%  |
| Phase 18           | Cross-Role: Advanced Analytics & Charts   | COMPLETED   | 100%  |
| Phase 19           | Integrations: Webhooks & API Keys         | COMPLETED   | 100%  |
| Sprint A           | UI Completion (6 deferred UI items)       | COMPLETED   | 100%  |
| User Settings      | Profile, Password, Notifications, Privacy, Platform | COMPLETED | 100% |
| Production Ready   | Error Tracking, Rate Limit         | COMPLETED   | 100%       |
| Deployment         | Vercel, Domain, OAuth              | COMPLETED   | 100%       |

**Core Features (Phase 1-13): 100% Complete**
**Competitive Parity Features (Phase 14-19): 100% Complete**
**Sprint A (UI Completion): 100% Complete**
**Production Readiness: 100%**
**Deployment: 100% (Live at civilabsreview.com)**
**Overall Project Completion: 92% (All phases + Sprint A complete)**

---

## Phase 7: File Upload & Media Management

**Status: COMPLETED**

| Feature             | Status | Files                                          |
| ------------------- | ------ | ---------------------------------------------- |
| UploadThing Setup   | [x]    | `src/app/api/uploadthing/core.ts`              |
| Image Upload        | [x]    | `src/components/upload/file-upload.tsx`        |
| Video Upload        | [x]    | Integrated with UploadThing                    |
| PDF/Document Upload | [x]    | Supported via UploadThing                      |
| 3D Model Upload     | [x]    | GLTF/GLB support in lesson editor              |
| Media Library       | [x]    | `src/app/(dashboard)/instructor/media/page.tsx`|
| Media API           | [x]    | `src/app/api/media/route.ts`                   |

**Completion Date:** Current Session

---

## Phase 8: Notifications & Communication

**Status: COMPLETED**

| Feature              | Status | Files                                                      |
| -------------------- | ------ | ---------------------------------------------------------- |
| Notification Model   | [x]    | `prisma/schema.prisma` (Notification)                      |
| In-App Notifications | [x]    | `src/components/layout/notification-bell.tsx`              |
| Notification Center  | [x]    | `src/app/(dashboard)/notifications/page.tsx`               |
| Notifications API    | [x]    | `src/app/api/notifications/route.ts`                       |
| Notification Library | [x]    | `src/lib/notifications.ts`                                 |
| Email Service Setup  | [x]    | `src/lib/email.ts` with Resend                             |
| Welcome Email        | [x]    | Triggered on user registration                             |
| Enrollment Email     | [x]    | Triggered on course enrollment                             |
| Certificate Email    | [x]    | Triggered on certificate generation                        |
| Quiz Result Email    | [x]    | Triggered on quiz submission                               |
| Forum Reply Email    | [x]    | Triggered when someone replies to your thread              |
| Push Notifications   | [ ]    | Optional - Browser push (can be added later)               |

**Completion Date:** January 2026

---

## Production Readiness

**Status: COMPLETED**

| Feature                | Status | Files                                           |
| ---------------------- | ------ | ----------------------------------------------- |
| Sentry Error Tracking  | [x]    | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` |
| Sentry Instrumentation | [x]    | `src/instrumentation.ts`                        |
| Global Error Page      | [x]    | `src/app/global-error.tsx`                      |
| Rate Limiting          | [x]    | `src/middleware.ts`, `src/lib/rate-limit.ts`    |
| Upstash Redis Setup    | [x]    | Rate limiting with Upstash                      |
| Audit Logging          | [x]    | `src/lib/audit.ts`                              |
| Audit Logs API         | [x]    | `src/app/api/audit-logs/route.ts`               |
| Audit Logs Admin Page  | [x]    | `src/app/(dashboard)/admin/audit-logs/page.tsx` |
| Environment Validation | [x]    | `src/lib/env.ts`                                |
| Feature Flags          | [x]    | `src/lib/env.ts` (features object)              |
| Health Check Endpoint  | [x]    | `src/app/api/health/route.ts`                   |
| Vercel Configuration   | [x]    | `vercel.json`                                   |
| Security Headers       | [x]    | `vercel.json` (X-Frame-Options, XSS, etc.)      |
| Production Checklist   | [x]    | `PRODUCTION_CHECKLIST.md`                       |

**Completion Date:** January 2026

---

## Deployment & Domain Setup

**Status: COMPLETED**

| Feature                     | Status | Details                                              |
| --------------------------- | ------ | ---------------------------------------------------- |
| Vercel Deployment           | [x]    | Auto-deploy from `main` branch                       |
| Custom Domain               | [x]    | `civilabsreview.com` (Hostinger DNS → Vercel)        |
| SSL/HTTPS                   | [x]    | Auto-provisioned by Vercel                           |
| Google OAuth (Production)   | [x]    | Google Cloud Console, published app                  |
| OAuth Account Linking       | [x]    | `src/lib/auth.ts` - signIn callback                  |
| Environment Variables       | [x]    | AUTH_SECRET, AUTH_TRUST_HOST, GOOGLE_CLIENT_ID/SECRET |
| Build Configuration         | [x]    | `prisma generate && next build`                      |
| DNS Configuration           | [x]    | A record (76.76.21.21) + CNAME (www)                 |

**Environment Variables (Vercel):**
- `DATABASE_URL` / `DIRECT_URL` - Neon PostgreSQL
- `AUTH_SECRET` / `NEXTAUTH_SECRET` - JWT signing
- `AUTH_TRUST_HOST` - Vercel host trust
- `NEXTAUTH_URL` - `https://civilabsreview.com`
- `NEXT_PUBLIC_APP_URL` - `https://civilabsreview.com`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth
- `RESEND_API_KEY` / `FROM_EMAIL` - Email service
- `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN`
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Rate limiting

**Completion Date:** January 2026

---

## Future Phases (Enhancements)

---

### Phase 9: Advanced Learning Features

**Status: COMPLETED**

| Feature                   | Status | Files                                                                                        |
| ------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Bookmarks API             | [x]    | `src/app/api/bookmarks/route.ts`                                                             |
| Bookmark Button Component | [x]    | `src/components/learn/bookmark-button.tsx`                                                    |
| Bookmarks List Page       | [x]    | `src/app/(dashboard)/bookmarks/page.tsx`                                                     |
| Notes API                 | [x]    | `src/app/api/notes/route.ts`, `src/app/api/notes/[noteId]/route.ts`                          |
| Note Editor Component     | [x]    | `src/components/learn/note-editor.tsx`                                                        |
| Notes List Page           | [x]    | `src/app/(dashboard)/notes/page.tsx`                                                          |
| Course Reviews API        | [x]    | `src/app/api/courses/[courseId]/reviews/route.ts`                                              |
| Course Reviews Component  | [x]    | `src/components/courses/course-reviews.tsx`                                                    |
| Learning Paths API        | [x]    | `src/app/api/learning-paths/route.ts`, `src/app/api/learning-paths/[pathId]/enroll/route.ts`  |
| Learning Paths Page       | [x]    | `src/app/(dashboard)/learning-paths/page.tsx`                                                  |
| Learning Path Enroll      | [x]    | `src/components/courses/learning-path-enroll-button.tsx`                                       |
| Prerequisites API         | [x]    | `src/app/api/courses/[courseId]/prerequisites/route.ts`                                        |
| Prerequisites UI          | [x]    | Prerequisites warning card on course detail page                                              |
| Prerequisites Enforcement | [x]    | `src/app/api/enrollments/route.ts` (blocks enrollment if unmet)                                |
| Sheet UI Component        | [x]    | `src/components/ui/sheet.tsx`                                                                  |

**Completion Date:** January 2026

---

### Phase 10: Mobile & PWA

**Status: SKIPPED** (Web-only version preferred)

---

### Phase 11: Performance & SEO

**Status: COMPLETED**

| Feature                | Status | Files                                                         |
| ---------------------- | ------ | ------------------------------------------------------------- |
| Root Metadata Config   | [x]    | `src/app/layout.tsx` (title, description, OG, Twitter)        |
| Dynamic Page Metadata  | [x]    | Course pages, auth pages, course list                         |
| Sitemap Generation     | [x]    | `src/app/sitemap.ts` (courses, forums, learning paths)        |
| Robots.txt             | [x]    | `src/app/robots.ts` (allow public, block admin)               |
| JSON-LD Structured Data| [x]    | `src/components/seo/json-ld.tsx` (Organization, Course, etc.) |
| Database Indexes       | [x]    | `prisma/schema.prisma` (optimized queries)                    |
| Image Optimization     | [x]    | `next.config.ts` (AVIF, WebP, remote patterns)                |
| Font Optimization      | [x]    | `display: swap` in layout.tsx                                 |
| Security Headers       | [x]    | `next.config.ts` (X-Frame, XSS, etc.)                         |
| Caching Headers        | [x]    | `next.config.ts` (static assets, API)                         |

**Completion Date:** January 2026
| Database Indexes   | [ ]    | Medium   | Query optimization         |
| CDN Setup          | [ ]    | Low      | Static asset caching       |

---

### Phase 12: Testing & Quality

**Status: COMPLETED**

| Feature                   | Status | Files                                                        |
| ------------------------- | ------ | ------------------------------------------------------------ |
| Jest + Next.js Setup      | [x]    | `jest.config.js`, `jest.setup.js`                            |
| Test Utilities            | [x]    | `src/__tests__/test-utils.tsx` (mock sessions, data helpers) |
| TypeScript Test Support   | [x]    | `src/__tests__/jest.d.ts`                                    |
| Utility Tests             | [x]    | `src/__tests__/lib/utils.test.ts`                            |
| UI Component Tests        | [x]    | `src/__tests__/components/button.test.tsx`, `card.test.tsx`  |
| Bookmark Button Tests     | [x]    | `src/__tests__/components/bookmark-button.test.tsx`          |
| Learning Path Enroll Tests| [x]    | `src/__tests__/components/learning-path-enroll-button.test.tsx` |
| Course Reviews Tests      | [x]    | `src/__tests__/components/course-reviews.test.tsx`           |
| Bookmarks API Tests       | [x]    | `src/__tests__/api/bookmarks.test.ts`                        |
| Notes API Tests           | [x]    | `src/__tests__/api/notes.test.ts`                            |
| Enrollments API Tests     | [x]    | `src/__tests__/api/enrollments.test.ts`                      |
| Export API Tests          | [x]    | `src/__tests__/api/export.test.ts`                           |

**Test Summary:** 95 tests across 10 suites (all passing)
**Completion Date:** January 2026

---

### Phase 13: Analytics & Reporting

**Status: COMPLETED**

| Feature                  | Status | Files                                                        |
| ------------------------ | ------ | ------------------------------------------------------------ |
| Admin Reports Page       | [x]    | `src/app/(dashboard)/admin/reports/page.tsx`                  |
| Admin Analytics Page     | [x]    | `src/app/(dashboard)/admin/analytics/page.tsx`                |
| Admin Analytics API      | [x]    | `src/app/api/admin/analytics/route.ts`                        |
| Audit Logs               | [x]    | `src/app/(dashboard)/admin/audit-logs/page.tsx`               |
| Student Progress Page    | [x]    | `src/app/(dashboard)/progress/page.tsx`                       |
| Instructor Analytics     | [x]    | `src/app/(dashboard)/instructor/analytics/page.tsx`           |
| Analytics Library        | [x]    | `src/lib/analytics.ts`                                         |
| CSV Export API           | [x]    | `src/app/api/reports/export/route.ts`                          |
| Quick CSV Export UI      | [x]    | Admin reports page (users, enrollments, courses, certificates, quiz attempts) |

**Completion Date:** January 2026

---

### User Settings (All Roles)

**Status: COMPLETED**

> **Scope:** Profile management, password change, notification preferences, privacy settings (student), and platform configuration (admin). Shared settings page component with role-conditional sections.

#### Database Schema Changes

| Change | Status | Files |
|--------|--------|-------|
| `profileVisibility` field on User | [x] | `prisma/schema.prisma` |
| `NotificationPreference` model | [x] | `prisma/schema.prisma` (7 email toggle fields, one-to-one with User) |
| `PlatformSettings` model | [x] | `prisma/schema.prisma` (registration, maintenance, file upload config) |

#### Validation Schemas

| Schema | Status | Files |
|--------|--------|-------|
| `changePasswordSchema` | [x] | `src/lib/validations.ts` (current != new, strength requirements) |
| `notificationPreferenceSchema` | [x] | `src/lib/validations.ts` (7 boolean toggles) |
| `privacySettingsSchema` | [x] | `src/lib/validations.ts` (profileVisibility toggle) |
| `platformSettingsSchema` | [x] | `src/lib/validations.ts` (admin platform config) |

#### API Endpoints

| Endpoint | Method | Status | Files | Access |
|----------|--------|--------|-------|--------|
| `/api/profile` | GET/PATCH | [x] | `src/app/api/profile/route.ts` | All authenticated |
| `/api/auth/change-password` | POST | [x] | `src/app/api/auth/change-password/route.ts` | All authenticated (credentials only) |
| `/api/settings/notifications` | GET/PATCH | [x] | `src/app/api/settings/notifications/route.ts` | All authenticated |
| `/api/settings/privacy` | GET/PATCH | [x] | `src/app/api/settings/privacy/route.ts` | Student only |
| `/api/admin/settings/platform` | GET/PATCH | [x] | `src/app/api/admin/settings/platform/route.ts` | Admin only |
| `/api/uploadthing` (userAvatar) | POST | [x] | `src/app/api/uploadthing/core.ts` (pre-existing) | All authenticated |

#### UI Components

| Component | Status | Files | Description |
|-----------|--------|-------|-------------|
| ProfileForm | [x] | `src/components/settings/profile-form.tsx` | Name, bio, avatar upload (UploadThing) |
| PasswordForm | [x] | `src/components/settings/password-form.tsx` | Current + new password, OAuth detection |
| NotificationForm | [x] | `src/components/settings/notification-form.tsx` | 7 toggle switches with descriptions |
| PrivacyForm | [x] | `src/components/settings/privacy-form.tsx` | Profile visibility toggle (student only) |
| PlatformForm | [x] | `src/components/settings/platform-form.tsx` | Registration, maintenance, file config (admin only) |
| SettingsPage | [x] | `src/components/settings/settings-page.tsx` | Shared page with role-conditional sections |

#### Route Pages

| Route | Status | Files |
|-------|--------|-------|
| `/student/settings` | [x] | `src/app/(dashboard)/student/settings/page.tsx` |
| `/instructor/settings` | [x] | `src/app/(dashboard)/instructor/settings/page.tsx` |
| `/admin/settings` | [x] | `src/app/(dashboard)/admin/settings/page.tsx` |

#### Infrastructure Changes

| Change | Status | Files |
|--------|--------|-------|
| Sonner Toaster added to root layout | [x] | `src/app/layout.tsx` |
| Settings links added to sidebar (all roles) | [x] | `src/components/layout/sidebar.tsx` |

#### Features by Role

| Feature | Student | Instructor | Admin |
|---------|---------|------------|-------|
| Profile (name, bio, avatar upload) | Yes | Yes | Yes |
| Password Change | Yes | Yes | Yes |
| Email Display (read-only) | Yes | Yes | Yes |
| Notification Preferences (7 toggles) | Yes | Yes | Yes |
| Privacy (profile visibility) | Yes | - | - |
| Platform Settings (registration, maintenance, roles, file limits) | - | - | Yes |

**Architecture:** Shared `<SettingsPage>` component renders role-conditional sections based on `session.user.role`. Single codebase for all three roles.

**Completion Date:** January 2026

---

---

## Development Approach: Role-Based Progressive Development

> **Strategy:** Features are organized by role (Instructor → Student → Admin), with each phase building integrated experiences. Student-facing counterparts are built alongside instructor features within the same phase to ensure end-to-end functionality. Each phase is self-contained and deployable independently.

> **Architecture Decisions Made:**
> - **Unified Assessment System:** Quizzes and exams share one model with configurable settings (time limit, attempts, proctoring, etc.)
> - **Release Condition Engine:** Brightspace-style full condition engine with nested AND/OR rules, evaluated in real-time with caching
> - **Grade Scales:** Custom scales (admin/instructor-defined with any labels and thresholds)
> - **MFA:** Email OTP + TOTP (authenticator apps)
> - **Course Approval:** Simple review workflow (submit → approve/reject → publish)
> - **Data Retention:** Full compliance suite (GDPR + FERPA + configurable per-type retention)
> - **Activity Tracking:** Full telemetry (scroll depth, video %, click heatmaps, idle detection, device info)
> - **Assessment Config:** Enterprise-level (proctoring hooks, honor code, late grace period, adaptive difficulty, IP restriction, password-protected)

---

## Recommended Development Paths

Below are 3 development path options. The chosen path determines build order:

### Path A: Role-First (RECOMMENDED — Chosen)
```
Phase 14: Instructor Core → Phase 15: Student Core → Phase 16: Admin Core → Phase 17-19: Cross-role
```
**Pros:** Each role gets a complete experience before moving on. Easier to test role isolation. Instructor tools exist before student tools need them.
**Cons:** Students wait until Phase 15 for their features.

### Path B: Feature-Domain
```
Assessment Domain → Grading Domain → Scheduling Domain → Admin Domain
```
**Pros:** Each feature is fully complete across all roles before moving on.
**Cons:** Partial experiences for all roles simultaneously. Harder to demo progress.

### Path C: Dependency-Optimized
```
Data Models → APIs → Instructor UI → Student UI → Admin UI
```
**Pros:** No wasted work. Backend is rock-solid before UI.
**Cons:** No usable UI for a long time. Hard to validate UX decisions.

---

## Pre-Development Considerations

Before starting Phase 14, the following must be addressed:

### Database Migration Strategy
1. All new models are **additive** (no breaking changes to existing tables)
2. New fields on existing models (Chapter, Lesson, Question) should be **nullable** to preserve backward compatibility
3. Run `prisma migrate dev` per phase, not per feature, to minimize migration count
4. Create a **migration naming convention**: `YYYYMMDD_phase_XX_feature_name`

### Testing Strategy
1. Each new API route gets unit tests (continuing Jest + `@jest-environment node` pattern)
2. Integration tests for cross-model workflows (e.g., assignment → submission → grade → gradebook)
3. Run full test suite before each phase merge
4. Target: maintain 100% pass rate, add 15-25 tests per phase

### Performance Considerations
1. **Release Condition Engine:** Real-time evaluation requires per-request DB queries. Implement Redis caching (Upstash) for evaluated conditions with TTL invalidation on trigger events
2. **Full Telemetry:** Heartbeat tracking (every 30s) generates high write volume. Use batched writes (collect 5-10 events, write once) and separate telemetry table with periodic cleanup
3. **Gradebook Calculation:** Weighted averages across potentially hundreds of items. Pre-calculate and cache totals, invalidate on grade change
4. **SCORM Runtime:** iframe communication is synchronous. Use message queuing to avoid blocking UI

### Security Considerations
1. **File Submissions:** Validate file types server-side (not just extension). Scan for malicious content headers. Store in isolated paths.
2. **Grade APIs:** Strict instructor/admin-only access. Never expose grade calculation logic to students.
3. **MFA:** Store TOTP secrets encrypted. Rate-limit OTP attempts (5 failures → lockout).
4. **SAML:** Validate XML signatures. Prevent XXE attacks in metadata parsing.
5. **Webhooks:** Sign payloads with HMAC-SHA256. Validate webhook URLs (no internal IPs). Timeout after 10s.

---

## Phase 14: Instructor Core — Assessment & Assignment System

**Status: COMPLETED**
**Priority: CRITICAL**
**Role Focus: INSTRUCTOR (with integrated student submission experience)**

> **Scope:** This phase transforms the instructor experience from "content creator" to "full course manager" by adding assignments, the unified assessment system (quiz/exam), rubrics, and the grading queue.

### 14.1 Unified Assessment System (Quiz + Exam)

> **Design:** Expanded `Quiz` model supports QUIZ, EXAM, and PRACTICE assessment types. Backward-compatible: all new fields are nullable, existing quizzes continue working with defaults.

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Assessment Model Migration | [x] | Critical | Expanded Quiz with: assessmentType, timeLimit, attemptLimit, availableFrom, availableUntil, shuffleQuestions, shuffleOptions, showAnswersAfter, isProctored, passwordProtected, ipRestrictions, honorCodeRequired, lateGracePeriod, lateSubmissionPolicy, latePenaltyPercent, poolSize, questionBankId |
| Question Type Enum Expansion | [x] | Critical | Added: TRUE_FALSE, SHORT_ANSWER, MATCHING, MULTI_SELECT, ORDERING, ESSAY, FILL_IN_BLANK |
| Question Bank Model | [x] | High | QuestionBank + QuestionBankItem models with random pool selection support |
| True/False Questions | [x] | High | Boolean answer (correctBoolAnswer field), auto-graded |
| Short Answer | [x] | High | Text input with acceptedAnswers list (exact/contains/regex matching) |
| Multi-Select | [x] | High | Multiple correct answers (multiSelectAnswers field) with partial credit |
| Matching Questions | [x] | High | Two-column matching pairs (matchingPairs JSON), partial credit scoring |
| Ordering/Sequencing | [x] | High | Ordered items (orderingItems JSON), scored by correct positions |
| Essay/Free Response | [x] | High | Text response with word limit, flags for manual grading (needsManualGrading) |
| Fill-in-the-Blank | [x] | Medium | Inline blanks with accepted answer variants (blanks JSON) |
| Timed Assessment Support | [x] | High | Server-tracked timer, auto-submit on expiry, grace period config |
| Attempt Limit Config | [x] | High | Configurable max attempts (1 = exam-like, null = unlimited = practice) |
| Question Pool Selection | [x] | High | poolSize + questionBankId for random subset selection |
| Lockdown Browser Flag | [x] | Medium | isProctored flag for external proctoring tool integration |
| IP Restriction | [x] | Medium | ipRestrictions field for whitelisting IP ranges |
| Password-Protected Access | [x] | Medium | passwordProtected field; student must enter password before starting |
| Honor Code Prompt | [x] | Medium | honorCodeRequired flag; student must acknowledge before starting |
| Late Grace Period | [x] | Medium | lateGracePeriod (minutes) + lateSubmissionPolicy + latePenaltyPercent |
| Adaptive Difficulty | [ ] | Low | Deferred — Select harder/easier questions based on running performance |
| Assessment Builder UI | [x] | Critical | Full builder with all 8 question types, config panel, question pool settings |
| Assessment Player (Student) | [x] | Critical | Timer, password gate, honor code, question navigator, all input types, result screen |
| Manual Grading Queue | [x] | High | Combined view: essay/short-answer attempts + ungraded assignment submissions |
| Assessment Analytics | [ ] | High | Deferred to Phase 18 — Per-question success rate, discrimination index |

### 14.2 Assignment System

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Assignment Model (Prisma) | [x] | Critical | Full model with title, description, dueDate, points, type (FILE_UPLOAD/TEXT_ENTRY/URL_LINK), allowedFileTypes, maxFileSize, maxSubmissions, latePolicy, latePenaltyPercent, courseId, chapterId, rubricId |
| AssignmentSubmission Model | [x] | Critical | userId, assignmentId, fileUrl, fileName, fileSize, textContent, urlLink, submittedAt, status (DRAFT/SUBMITTED/GRADED/RETURNED/RESUBMITTED), grade, feedback, gradedAt, gradedBy, rubricScores, isLate, latePenaltyApplied, attemptNumber |
| Assignment CRUD API | [x] | Critical | `src/app/api/courses/[courseId]/assignments/route.ts` — List + Create |
| Assignment Detail API | [x] | Critical | `src/app/api/courses/[courseId]/assignments/[assignmentId]/route.ts` — GET/PATCH/DELETE |
| Submission API (Student) | [x] | Critical | Submit work with late detection and penalty calculation |
| Submissions List API (Instructor) | [x] | Critical | List all submissions with status/grade filtering |
| Submission Grade API | [x] | Critical | Grade submission with rubric scores, feedback, auto-penalty |
| Late Submission Detection | [x] | High | Auto-detect late submissions, calculate penalty based on latePolicy config |
| Submission Timestamps | [x] | High | Track submittedAt, display relative to due date, isLate flag |
| Assignment Editor (Instructor) | [x] | Critical | Full form with type selection, file config, due date, points, late policy |
| Submission View (Student) | [x] | Critical | Upload/text/URL submission with grade/feedback display, resubmit support |
| Submissions List (Instructor) | [x] | Critical | Grading queue with inline grade form |
| Inline Feedback | [ ] | High | Deferred — Text annotations on submissions |
| File Preview | [ ] | Medium | Deferred — Preview PDFs/images inline in grading view |
| Submission Timestamp Report | [ ] | High | Deferred — Report showing all submissions with timestamps vs due dates |

### 14.3 Rubrics

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Rubric Model (Prisma) | [x] | High | title, description, courseId, isTemplate, createdBy |
| RubricCriterion Model | [x] | High | rubricId, title, description, position, maxPoints, levels (JSON: [{label, description, points}]) |
| Rubric CRUD API | [x] | High | Full CRUD with nested criteria at `src/app/api/courses/[courseId]/rubrics/` |
| Rubric Builder UI | [x] | High | Sprint A — Visual grid builder at /instructor/courses/[id]/rubrics |
| Rubric-Assignment Link | [x] | High | rubricId on Assignment model; rubricScores JSON on submission |
| Rubric Grading UI | [x] | High | Sprint A — Click-to-grade rubric grid in grading page |
| Rubric Template Library | [ ] | Medium | Deferred — isTemplate flag ready on model |
| Rubric PDF Export | [ ] | Low | Deferred |

**Dependencies:** Phase 7 (File Upload) — already completed
**Database Changes Applied:**
- Expanded `Quiz` model with assessmentType enum + 18 config fields (backward compatible, all nullable)
- Expanded `Question` model with QuestionType enum (8 types) + type-specific JSON fields
- Expanded `QuizAttempt` with startedAt, timeSpentSeconds, isLate, honorCodeAccepted, ipAddress, needsManualGrading
- New models: Assignment, AssignmentSubmission, Rubric, RubricCriterion, QuestionBank, QuestionBankItem
- New enums: QuestionType, AssessmentType, AssignmentType, SubmissionStatus, LatePolicy
- UploadThing: added assignmentSubmission upload route

**Key Files:**
- `prisma/schema.prisma` — All model changes
- `src/lib/validations.ts` — assessmentSchema, questionSchema, assignmentSchema, rubricSchema, questionBankSchema
- `src/app/api/courses/[courseId]/chapters/[chapterId]/quiz/` — Assessment CRUD + attempt scoring engine
- `src/app/api/courses/[courseId]/assignments/` — Assignment CRUD + submissions + grading
- `src/app/api/courses/[courseId]/rubrics/` — Rubric CRUD
- `src/app/api/courses/[courseId]/question-banks/` — Question bank CRUD
- `src/app/api/courses/[courseId]/grading-queue/` — Combined grading queue
- `src/components/editor/assessment-builder.tsx` — Instructor assessment builder
- `src/components/learn/assessment-player.tsx` — Student assessment player
- `src/app/(dashboard)/instructor/courses/[courseId]/assignments/page.tsx` — Assignment management
- `src/app/(dashboard)/instructor/courses/[courseId]/grading/page.tsx` — Grading queue
- `src/app/(dashboard)/courses/[courseId]/assignments/[assignmentId]/page.tsx` — Student submission

---

## Phase 15: Instructor Core — Gradebook, Scheduling & Course Management

**Status: COMPLETED**
**Priority: HIGH**
**Role Focus: INSTRUCTOR (with integrated student grade visibility)**

> **Scope:** Adds the centralized gradebook, content scheduling with Brightspace-style release conditions, announcements, attendance, course cloning, and activity reports. Depends on Phase 14 for assignment/assessment data.

### 15.1 Gradebook System

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| GradingScale Model | [x] | Critical | name, levels (JSON), courseId (nullable = global), isDefault |
| GradeCategory Model | [x] | Critical | name, weight (%), courseId, position, dropLowest |
| GradeItem Model | [x] | Critical | categoryId, title, points, type (ASSIGNMENT/ASSESSMENT/ATTENDANCE/MANUAL), referenceId, isExtraCredit, isVisible |
| StudentGrade Model | [x] | Critical | gradeItemId, userId, score, overrideScore, overrideBy, overrideReason, gradedAt |
| Gradebook API | [x] | Critical | Full gradebook matrix with role-based filtering |
| Grade Category API | [x] | High | CRUD for categories with weight management |
| Grade Override API | [x] | High | Manual entry/override with upsert |
| Grade Calculation Engine | [x] | Critical | Weighted average calculation in UI and CSV export |
| Custom Grading Scale API | [x] | High | GradingScale model ready (course-specific or global) |
| Gradebook Page (Instructor) | [x] | Critical | Spreadsheet-style: students × grade items with inline editing |
| Student Grade View (Student) | [x] | Critical | Personal grades with categories, items, weighted total, letter grade |
| Grade Analytics (Instructor) | [ ] | High | Deferred — Distribution histogram |
| Grade Export (CSV/Excel) | [x] | High | CSV export with weighted totals |
| Grade Visibility Controls | [x] | High | Per-item isVisible toggle |
| Auto-Grade Sync | [ ] | High | Deferred — Auto-populate from assessments/assignments |

### 15.2 Content Scheduling & Release Conditions (Brightspace-Style)

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Availability Fields (Chapter) | [x] | Critical | Added availableFrom, availableUntil to Chapter model |
| Availability Fields (Lesson) | [x] | Critical | Added availableFrom, availableUntil to Lesson model |
| Availability Fields (Assignment) | [x] | Critical | Already on Assignment model from Phase 14 |
| ReleaseCondition Model | [x] | Critical | targetType, targetId, conditionType, conditionValue (JSON), operator (AND/OR), position |
| Condition Types Supported | [x] | Critical | DATE_AFTER, LESSON_COMPLETED, CHAPTER_COMPLETED, ASSESSMENT_PASSED, ASSESSMENT_SCORE_ABOVE, ASSIGNMENT_SUBMITTED, ASSIGNMENT_GRADED |
| Release Condition API | [x] | Critical | CRUD at `/api/courses/[courseId]/release-conditions` |
| Release Condition Evaluator | [x] | Critical | `src/lib/release-conditions.ts` — evaluateReleaseConditions() with AND/OR logic |
| Availability Window Check | [x] | High | checkAvailabilityWindow() utility for date-based scheduling |
| Schedule Editor UI (Instructor) | [x] | High | Sprint A — /instructor/courses/[id]/schedule |
| Condition Builder UI | [x] | High | Sprint A — AND/OR tree at /instructor/courses/[id]/conditions |
| Student Lock Indicators | [x] | High | Sprint A — Lock icons + disabled state in course sidebar |
| Scheduling Overview (Instructor) | [ ] | Medium | Deferred — Timeline view |

### 15.3 Announcements

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Announcement Model | [x] | High | title, content, courseId (null = global), authorId, isPinned, isPublished, publishedAt, scheduledFor, attachmentUrl |
| Announcements API | [x] | High | Full CRUD at `/api/courses/[courseId]/announcements` |
| Global Announcements API | [x] | High | `/api/announcements` — Feed across all enrolled courses + admin broadcast |
| Course Announcements Tab (Instructor) | [x] | High | Create/edit/delete/pin/publish announcements |
| Announcements Feed (Student) | [x] | High | `/api/announcements` returns global + enrolled course announcements |
| Course Announcements View (Student) | [x] | High | Read-only announcements page within course |
| Email Broadcast | [ ] | Medium | Deferred — Resend integration |
| Scheduled Announcements | [x] | Medium | scheduledFor field, auto-filtered in student queries |
| Announcement Pinning | [x] | Medium | isPinned with priority sort |

### 15.4 Attendance Tracking

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| AttendanceSession Model | [x] | High | courseId, date, title, type (IN_PERSON/VIRTUAL/ASYNC), notes, createdBy |
| AttendanceRecord Model | [x] | High | sessionId, userId, status (PRESENT/ABSENT/LATE/EXCUSED), notes, markedAt, markedBy |
| AttendancePolicy Model | [ ] | Medium | Deferred — maxAbsences, gradeImpact configuration |
| Attendance API | [x] | High | CRUD sessions + batch record upsert |
| Roll-Call UI (Instructor) | [x] | High | Quick-mark interface with PRESENT/ABSENT/LATE/EXCUSED buttons per student |
| Attendance View (Student) | [x] | High | Personal records visible in GET response (role-filtered) |
| Attendance Reports (Instructor) | [x] | High | Session history with per-session counts (present/absent/late) |
| Attendance-Gradebook Link | [ ] | Medium | Deferred — Auto-calculated from policy |
| Auto-Attendance | [ ] | Low | Deferred |

### 15.5 Course Cloning

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Course Clone API | [x] | High | `POST /api/courses/[courseId]/clone` — Deep copy with configurable scope |
| Clone Scope | [x] | High | Copies: chapters, lessons, assignments, assessments/questions, rubrics/criteria, release conditions, announcements. Skips: enrollments, submissions, grades, attempts |
| Clone Options UI | [x] | High | Sprint A — Clone dialog with options in course editor actions |
| Date Shift | [x] | Medium | dateShiftDays parameter shifts all due dates and availability windows |

### 15.6 Student Activity Reports & Telemetry

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| UserActivity Model | [x] | High | userId, courseId, lessonId, eventType, metadata (JSON), sessionId, timestamp |
| Telemetry Collection API | [x] | High | `POST /api/telemetry` — Batched event ingestion (up to 50 events) |
| Client Telemetry Hook | [x] | High | `useTelemetry()` hook with buffer, auto-flush, trackView/trackScroll/trackVideo |
| Activity Dashboard (Instructor) | [x] | High | Per-student: last activity, progress %, events, submissions, at-risk flags |
| At-Risk Student Alerts | [x] | High | Flags students: no activity 7+ days OR <30% progress |
| Submission Timestamp Report | [ ] | High | Deferred — Detailed late analysis view |
| Activity Export (CSV) | [ ] | Medium | Deferred |
| Telemetry Cleanup Job | [ ] | Medium | Deferred — Scheduled cleanup |

**Dependencies:** Phase 14 (Assignments, Assessments provide grade data)
**Database Changes Applied:**
- New models: GradingScale, GradeCategory, GradeItem, StudentGrade, ReleaseCondition, Announcement, AttendanceSession, AttendanceRecord, UserActivity
- New enum: GradeItemType (ASSIGNMENT/ASSESSMENT/ATTENDANCE/MANUAL), AttendanceStatus
- Updated Chapter model: added availableFrom, availableUntil
- Updated Lesson model: added availableFrom, availableUntil
- Updated User model: new relations (studentGrades, announcements, attendanceRecords, activities)
- Updated Course model: new relations (gradeCategories, gradingScales, releaseConditions, announcements, attendanceSessions)
- New AuditAction entries: GRADE_OVERRIDDEN, GRADE_EXPORTED, ANNOUNCEMENT_CREATED/UPDATED/DELETED, ATTENDANCE_RECORDED/UPDATED, COURSE_CLONED

**Key Files:**
- `prisma/schema.prisma` — All new models and relations
- `src/lib/validations.ts` — All Phase 15 validation schemas
- `src/lib/release-conditions.ts` — Condition evaluator + availability window check
- `src/lib/use-telemetry.ts` — Client telemetry hook
- `src/app/api/courses/[courseId]/gradebook/` — Gradebook CRUD, grades, items, categories, export
- `src/app/api/courses/[courseId]/release-conditions/` — Release condition CRUD
- `src/app/api/courses/[courseId]/announcements/` — Announcement CRUD
- `src/app/api/courses/[courseId]/attendance/` — Attendance session + records
- `src/app/api/courses/[courseId]/clone/` — Deep course clone
- `src/app/api/courses/[courseId]/activity/` — Student activity dashboard
- `src/app/api/announcements/` — Global announcements feed
- `src/app/api/telemetry/` — Batched telemetry ingestion
- `src/app/(dashboard)/instructor/courses/[courseId]/gradebook/page.tsx` — Instructor gradebook UI
- `src/app/(dashboard)/instructor/courses/[courseId]/announcements/page.tsx` — Instructor announcements
- `src/app/(dashboard)/instructor/courses/[courseId]/attendance/page.tsx` — Instructor attendance
- `src/app/(dashboard)/instructor/courses/[courseId]/activity/page.tsx` — Student activity dashboard
- `src/app/(dashboard)/courses/[courseId]/grades/page.tsx` — Student grades view
- `src/app/(dashboard)/courses/[courseId]/announcements/page.tsx` — Student announcements view

---

## Phase 16: Admin Core — Security, Compliance & Platform Management

**Status: COMPLETED**
**Priority: HIGH**
**Role Focus: ADMIN**

> **Scope:** Adds institutional-grade admin capabilities: MFA enforcement, course approval workflows, email campaigns, and full data retention/compliance suite (GDPR + FERPA).

### 16.1 Multi-Factor Authentication (MFA)

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| MFAConfig Model | [x] | Critical | userId, method (EMAIL_OTP), isEnabled, backupCodes (hashed), failedAttempts, lockedUntil |
| OTPToken Model | [x] | Critical | userId, hashed code, expiresAt, usedAt, purpose (MFA_LOGIN/MFA_SETUP) |
| TOTP Setup Flow | [ ] | Critical | Deferred — TOTP not implemented (Email OTP chosen instead) |
| Email OTP Flow | [x] | High | Generate 6-digit code → send via Resend → verify within 5 min TTL |
| Backup Codes | [x] | High | Generate 10 single-use recovery codes on MFA setup (hashed with bcrypt) |
| MFA Enforcement (Admin) | [x] | High | Admin can enable/disable enforcement via `/api/admin/mfa` |
| MFA Management API | [x] | Critical | `src/app/api/auth/mfa/route.ts` — setup, verify-setup, send-code, verify, verify-backup, disable, regenerate-backup |
| MFA Settings UI | [x] | Critical | `src/components/settings/mfa-form.tsx` — enable/disable, verify, view backup codes |
| Rate Limiting on OTP | [x] | High | 5 failed attempts → 15 min lockout |
| MFA Admin Dashboard | [x] | Medium | `src/app/(dashboard)/admin/mfa/page.tsx` — adoption stats by role, enforcement toggle |
| MFA Utility Library | [x] | Critical | `src/lib/mfa.ts` — generateOTP, generateBackupCodes, verifyMFACode, verifyBackupCode, isMFARequired |

### 16.2 Course Approval Workflow

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| CourseApproval Model | [x] | High | courseId (unique), status enum (DRAFT/PENDING_REVIEW/APPROVED/REJECTED/CHANGES_REQUESTED), history (JSON) |
| Approval API | [x] | High | `src/app/api/admin/courses/[courseId]/approval/route.ts` — GET status, POST submit/review |
| Submit for Review (Instructor) | [x] | High | POST with action=SUBMIT, notifies all admins |
| Review Queue (Admin) | [x] | High | `src/app/api/admin/review-queue/route.ts` — pending + recent decisions |
| Review Queue UI | [x] | High | `src/app/(dashboard)/admin/review-queue/page.tsx` — approve/reject/request-changes with comments |
| Review Notification | [x] | High | In-app notification + email via Resend (sendApprovalNotification) |
| Approval History | [x] | Medium | JSON history array with status, by, at, comment per change |

### 16.3 Email Campaign & Broadcast

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| EmailCampaign Model | [x] | High | title, subject, content (HTML), recipientFilter (JSON), status enum, sentCount, failedCount, scheduledFor |
| Campaign CRUD API | [x] | High | `src/app/api/admin/campaigns/route.ts` — List, Create, Send |
| Campaign Detail API | [x] | High | `src/app/api/admin/campaigns/[campaignId]/route.ts` — GET (with recipient preview), PATCH, DELETE |
| Recipient Segmentation | [x] | High | Filter by: role, courseId, inactiveDays, registeredAfter |
| Campaign Editor UI | [x] | High | `src/app/(dashboard)/admin/campaigns/page.tsx` — create, filter, send, delete |
| Batch Sending | [x] | High | 50 recipients per batch via Resend (Promise.allSettled) |
| Scheduled Campaigns | [x] | Medium | scheduledFor field + Vercel cron (`/api/cron/campaigns` every 15 min) |
| Campaign Analytics | [x] | Medium | sentCount + failedCount tracked per campaign |

### 16.4 Data Retention & Compliance (GDPR + FERPA)

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| RetentionPolicy Model | [x] | Critical | dataType enum (7 types), retentionDays, action enum (ARCHIVE/ANONYMIZE/DELETE), isActive, lastExecutedAt |
| ConsentRecord Model | [x] | High | userId, consentType enum (DATA_PROCESSING/ANALYTICS/MARKETING), granted, grantedAt, revokedAt, ipAddress |
| Retention Policy API | [x] | Critical | `src/app/api/admin/retention/route.ts` — GET (policies + volumes), POST (upsert), DELETE |
| Retention Policy UI (Admin) | [x] | Critical | `src/app/(dashboard)/admin/retention/page.tsx` — data volumes, policy table, create/delete, manual trigger |
| Automated Retention Job | [x] | Critical | `src/app/api/cron/retention/route.ts` — Vercel cron (weekly at 3am Sunday), per-type action execution |
| User Data Export (GDPR) | [x] | Critical | `GET /api/users/me/export` — JSON download (profile, enrollments, grades, consents) |
| Account Deletion (GDPR) | [x] | Critical | `DELETE /api/users/me?confirm=true` — Anonymize PII, delete sessions/accounts/MFA, anonymize posts/messages |
| Consent Management API | [x] | High | `src/app/api/users/me/consent/route.ts` — GET all types, POST batch update with audit trail |
| Consent UI | [x] | High | `src/components/settings/consent-form.tsx` — toggle consents, export data button |
| Data Anonymization Engine | [x] | High | Retention cron + account deletion: anonymize user data, forum posts, chat messages |
| Deletion Audit Trail | [x] | High | USER_DATA_DELETED + CONSENT_GRANTED/REVOKED audit log entries |
| Retention Dashboard | [x] | Medium | Data volumes grid, policy table with last-run timestamps |
| Scheduled Campaigns Cron | [x] | Medium | `src/app/api/cron/campaigns/route.ts` — every 15 min check for scheduled sends |

**Dependencies:** Phase 1 (Auth system), Phase 8 (Notifications for approval alerts)
**Database Changes Applied:**
- New models: MFAConfig, OTPToken, CourseApproval, EmailCampaign, RetentionPolicy, ConsentRecord
- New enums: MFAMethod, ApprovalStatus, CampaignStatus, RetentionAction, DataType, ConsentType
- Updated User: added mfaEnabled (Boolean), consentAcceptedAt (DateTime?), mfaConfig + consents relations
- Updated Course: added approval relation
- New NotificationType entries: COURSE_APPROVED, COURSE_REJECTED, COURSE_REVIEW_REQUESTED, MFA_ENABLED_NOTICE
- New AuditAction entries: MFA_ENABLED/DISABLED/VERIFIED/FAILED, COURSE_SUBMITTED_FOR_REVIEW/APPROVED/REJECTED/CHANGES_REQUESTED, CAMPAIGN_CREATED/SENT, RETENTION_POLICY_CREATED/EXECUTED, USER_DATA_EXPORTED/DELETED, CONSENT_GRANTED/REVOKED
- Vercel cron: retention (weekly) + campaigns (every 15 min)

**Key Files:**
- `prisma/schema.prisma` — All new models, enums, relations
- `src/lib/validations.ts` — Phase 16 validation schemas
- `src/lib/mfa.ts` — MFA utility library (OTP generation, verification, backup codes, lockout)
- `src/lib/email.ts` — Added sendOTPEmail, sendApprovalNotification, sendCampaignEmail
- `src/app/api/auth/mfa/route.ts` — MFA setup/verify/disable/backup
- `src/app/api/admin/mfa/route.ts` — MFA adoption stats + enforcement
- `src/app/api/admin/courses/[courseId]/approval/route.ts` — Course approval workflow
- `src/app/api/admin/review-queue/route.ts` — Pending courses list
- `src/app/api/admin/campaigns/route.ts` — Campaign CRUD + send
- `src/app/api/admin/campaigns/[campaignId]/route.ts` — Campaign detail/update/delete
- `src/app/api/admin/retention/route.ts` — Retention policy CRUD
- `src/app/api/cron/retention/route.ts` — Automated retention cron job
- `src/app/api/cron/campaigns/route.ts` — Scheduled campaign sender
- `src/app/api/users/me/route.ts` — Account deletion
- `src/app/api/users/me/export/route.ts` — Data export
- `src/app/api/users/me/consent/route.ts` — Consent management
- `src/app/(dashboard)/admin/mfa/page.tsx` — MFA admin dashboard
- `src/app/(dashboard)/admin/review-queue/page.tsx` — Course review queue UI
- `src/app/(dashboard)/admin/campaigns/page.tsx` — Campaign management UI
- `src/app/(dashboard)/admin/retention/page.tsx` — Retention policy management UI
- `src/components/settings/mfa-form.tsx` — MFA settings component
- `src/components/settings/consent-form.tsx` — Consent/privacy settings component
- `vercel.json` — Cron job configuration

---

## Phase 17: Cross-Role — Calendar, Groups & Collaboration

**Status: COMPLETED**
**Priority: MEDIUM-HIGH**
**Role Focus: ALL ROLES**

> **Scope:** Calendar system (auto-populated from due dates), student groups, and peer review. These features touch all roles and depend on Phase 14-15 data.

### 17.1 Calendar & Due Dates

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| CalendarEvent Model | [x] | High | title, description, startDate, endDate, allDay, type (6 event types), courseId, userId, color, referenceType, referenceId |
| CalendarToken Model | [x] | High | userId (unique), token (unique) for iCal subscription URL authentication |
| Calendar API | [x] | High | `src/app/api/calendar/route.ts` — CRUD with date range filtering, course-aware access |
| Calendar Page | [x] | High | `src/app/(dashboard)/calendar/page.tsx` — FullCalendar with month/week/agenda views |
| Auto-Event Generation | [x] | High | `src/app/api/calendar/sync/route.ts` — Syncs from assignments, assessments, attendance, chapters |
| Course Calendar (Instructor) | [x] | High | Instructors can create custom events, sync course events |
| Personal Calendar (Student) | [x] | High | Aggregates events from all enrolled courses + personal events |
| Upcoming Deadlines Widget | [x] | High | `src/components/calendar/upcoming-deadlines.tsx` — Next 7 days with urgency indicators |
| iCal Subscription | [x] | Medium | `GET /api/calendar/ical?token=xxx` — Dynamic subscription URL for Google Calendar/Outlook |
| Calendar Event Notifications | [ ] | Medium | Deferred — Notify 24h and 1h before due dates |

### 17.2 Groups

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| CourseGroup Model | [x] | High | name, courseId, maxMembers, createdBy |
| GroupMember Model | [x] | High | groupId, userId, role (LEADER/MEMBER), joinedAt, unique constraint |
| Groups API | [x] | High | `src/app/api/courses/[courseId]/groups/` — CRUD, add/remove members |
| Group Detail API | [x] | High | `src/app/api/courses/[courseId]/groups/[groupId]/` — GET/PATCH/DELETE + member management |
| Group Assignment Support | [x] | High | groupId on AssignmentSubmission; one submission per group, shared grade |
| Auto-Assign Groups | [x] | High | `src/app/api/courses/[courseId]/groups/auto-assign/` — Random or balanced (snake-draft by progress) |
| Group Management UI (Instructor) | [x] | High | `src/app/(dashboard)/instructor/courses/[courseId]/groups/page.tsx` — Create, delete, add/remove members, auto-assign |
| Group View (Student) | [x] | High | `src/app/(dashboard)/courses/[courseId]/groups/page.tsx` — View group members with roles |
| Group Discussion Thread | [ ] | Medium | Deferred — Private forum thread per group |

### 17.3 Peer Review

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| PeerReview Model | [ ] | High | Deferred to future phase |
| PeerReviewConfig Model | [ ] | High | Deferred to future phase |
| Review Distribution API | [ ] | High | Deferred to future phase |
| Peer Review UI (Student) | [ ] | High | Deferred to future phase |
| Peer Review Results (Student) | [ ] | High | Deferred to future phase |
| Instructor Override | [ ] | Medium | Deferred to future phase |
| Peer Review Analytics (Instructor) | [ ] | Medium | Deferred to future phase |

**Dependencies:** Phase 14 (Assignments), Phase 15 (Gradebook for grade integration)
**Database Changes Applied:**
- New models: CalendarEvent, CalendarToken, CourseGroup, GroupMember
- New enums: CalendarEventType (6 types), GroupRole (LEADER/MEMBER)
- Updated User: added calendarEvents, groupMemberships, calendarTokens relations
- Updated Course: added calendarEvents, groups relations
- Updated AssignmentSubmission: added groupId field + group relation
- New NotificationType entries: CALENDAR_REMINDER, GROUP_INVITATION, GROUP_SUBMISSION
- New AuditAction entries: CALENDAR_EVENT_CREATED/UPDATED/DELETED, GROUP_CREATED/UPDATED/DELETED/MEMBER_ADDED/MEMBER_REMOVED

**Key Files:**
- `prisma/schema.prisma` — All new models, enums, relations
- `src/lib/validations.ts` — calendarEventSchema, courseGroupSchema, groupMemberSchema, autoAssignGroupsSchema
- `src/app/api/calendar/route.ts` — Calendar CRUD with date range + course filtering
- `src/app/api/calendar/sync/route.ts` — Auto-event generation from course data
- `src/app/api/calendar/ical/route.ts` — iCal subscription endpoint + token generation
- `src/app/api/calendar/upcoming/route.ts` — Upcoming deadlines (next 7 days)
- `src/app/api/courses/[courseId]/groups/route.ts` — Group CRUD
- `src/app/api/courses/[courseId]/groups/[groupId]/route.ts` — Group detail + member management
- `src/app/api/courses/[courseId]/groups/auto-assign/route.ts` — Auto-assign groups
- `src/app/(dashboard)/calendar/page.tsx` — Calendar page with FullCalendar
- `src/components/calendar/calendar-view.tsx` — FullCalendar wrapper component
- `src/components/calendar/upcoming-deadlines.tsx` — Upcoming deadlines widget
- `src/app/(dashboard)/instructor/courses/[courseId]/groups/page.tsx` — Instructor group management
- `src/app/(dashboard)/courses/[courseId]/groups/page.tsx` — Student group view

---

## Phase 18: Cross-Role — Advanced Analytics & Visualizations

**Status: COMPLETED**
**Priority: MEDIUM**
**Role Focus: ALL ROLES (Instructor-heavy)**

> **Scope:** Adds chart library, visual dashboards, grade analytics, and course comparison tools. Read-only layer over existing data — lowest risk phase.

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Chart Library Integration | [x] | High | Recharts installed for data visualization |
| Enrollment Trend Charts | [x] | High | Line chart: enrollments over time per course (90 days) |
| Completion Rate Charts | [x] | High | Bar chart: course completion rates comparison |
| Grade Distribution Histogram | [x] | High | Per-course grade distributions in 10% buckets |
| Student Activity Heatmap | [x] | Medium | 7×24 activity grid (day × hour) from UserActivity data |
| Assessment Item Analysis | [x] | High | Per-question success rate and difficulty classification |
| At-Risk Student Dashboard | [x] | High | Multi-factor detection: inactive 7+ days, progress <30%, missed assignments. Sortable/filterable. |
| Course Comparison | [x] | Medium | Bar chart: enrollment vs completion across courses |
| Instructor Performance Dashboard | [x] | Medium | Tabbed analytics: overview, grades, time-on-task, item analysis |
| Student Progress Timeline | [x] | High | Unified chronological feed: lessons, quizzes, submissions, enrollments |
| Cohort Analysis | [-] | Medium | Deferred — requires group/semester tracking enhancements |
| Time-on-Task Charts | [x] | Medium | Bar chart from telemetry: average time per lesson |
| Export to PDF | [-] | Medium | Deferred to future phase |
| Admin Platform Dashboard | [x] | Medium | User growth, role distribution, enrollment trends, activity heatmap |

**Dependencies:** Phase 14-15 (data sources), Phase 15.6 (telemetry data)
**Database Changes:** None — read-only from existing models

### Key Files
- `src/app/api/courses/[courseId]/analytics/route.ts` — Course-level analytics API (6 types)
- `src/app/api/analytics/platform/route.ts` — Platform-wide analytics API (admin)
- `src/app/api/analytics/at-risk/route.ts` — At-risk student detection API
- `src/app/api/analytics/progress-timeline/route.ts` — Student progress timeline API
- `src/components/charts/` — Reusable chart components (LineChart, BarChart, PieChart, ActivityHeatmap, ProgressTimeline)
- `src/app/(dashboard)/instructor/courses/[courseId]/analytics/page.tsx` — Instructor course analytics
- `src/app/(dashboard)/instructor/at-risk/page.tsx` — At-risk students page
- `src/app/(dashboard)/admin/analytics/charts/page.tsx` — Admin platform charts

---

## Phase 19: Integrations & Standards Compliance

**Status: COMPLETED (Webhooks & API Keys only; SAML, SCORM, Competency deferred)**
**Priority: MEDIUM**
**Role Focus: ADMIN + SYSTEM**

> **Scope:** Developer integration features: webhooks for event-driven architecture and API keys for programmatic access. SAML/SSO, SCORM, and Competency-Based Education deferred to future phases.

### 19.1 SSO & SAML

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| SAML 2.0 Provider | [ ] | High | Add SAML provider to NextAuth (via `@auth/core` custom provider or `passport-saml`) |
| SAMLConfig Model | [ ] | High | organizationId, entityId, ssoUrl, sloUrl, certificate, metadataUrl, attributeMapping (JSON), isActive |
| SAML Configuration API | [ ] | High | Admin CRUD for SAML IdP configs |
| SAML Admin UI | [ ] | High | Setup wizard: upload metadata or enter URLs manually |
| IdP-Initiated SSO | [ ] | High | Handle unsolicited SAML responses |
| SP-Initiated SSO | [ ] | High | Redirect to IdP from login page |
| Just-in-Time Provisioning | [ ] | Medium | Auto-create user on first SAML login with mapped attributes |
| Attribute Mapping UI | [ ] | Medium | Map SAML attributes → CiviLabs fields (name, email, role, department) |

### 19.2 Webhooks & Developer API (COMPLETED)

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Webhook Model | [x] | High | url, events (WebhookEvent[]), secret, userId, isActive, createdAt, description |
| WebhookDelivery Model | [x] | High | webhookId, event, payload (JSON), statusCode, responseBody, success, attempts, nextRetryAt |
| Webhook Events | [x] | High | 7 events: enrollment.created/completed, assignment.submitted, grade.updated, course.published, assessment.attempted, user.created |
| Webhook Delivery Engine | [x] | High | HTTP POST with HMAC-SHA256 signed payload, 10s timeout, fire-and-forget |
| Webhook Retry | [x] | Medium | Vercel Cron (every 5 min) with exponential backoff: 1m, 5m, 30m, 2h, 12h |
| Webhook Management API | [x] | High | CRUD + test delivery + toggle active/inactive |
| Webhook Admin UI | [x] | High | Create/manage webhooks, view inline delivery logs, test button |
| APIKey Model | [x] | High | keyHash (SHA-256), keyPrefix, name, permissions (APIKeyPermission[]), expiresAt, lastUsedAt |
| API Key Management | [x] | High | Generate (show once), revoke (soft-delete), list keys |
| API Key Auth Middleware | [x] | High | Bearer token auth with hash lookup, permission check, expiry validation |
| Per-Key Rate Limiting | [x] | Medium | In-memory rate limiter: 60 req/min per key |
| API Documentation | [-] | Medium | Deferred to future phase |

### Key Files (Phase 19)
- `src/lib/webhook-dispatcher.ts` — Event dispatcher + retry logic
- `src/lib/api-key-auth.ts` — API key authentication middleware
- `src/app/api/webhooks/` — Webhook CRUD + test endpoint
- `src/app/api/api-keys/` — API key generation + revocation
- `src/app/api/cron/webhook-retry/route.ts` — Vercel Cron retry handler
- `src/app/(dashboard)/admin/developers/page.tsx` — Admin developer settings UI

### 19.3 SCORM Package Import

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| SCORMPackage Model | [ ] | High | courseId, lessonId, fileName, version (SCORM_12/SCORM_2004), manifestData (JSON), storageUrl, uploadedBy |
| SCORMData Model | [ ] | High | packageId, userId, cmiData (JSON: core.score, core.lesson_status, core.session_time, suspend_data), lastAccessed |
| SCORM Upload API | [ ] | High | Upload .zip, extract, parse imsmanifest.xml, validate structure |
| SCORM Runtime API | [ ] | High | Implement SCORM 1.2 + 2004 RTE API (LMSInitialize, LMSGetValue, LMSSetValue, LMSCommit, LMSFinish) |
| SCORM Player Component | [ ] | High | iframe loading SCORM content with JS API bridge (window.API / window.API_1484_11) |
| SCORM Lesson Type | [ ] | High | Add SCORM to LessonType enum |
| SCORM Progress Sync | [ ] | Medium | Map SCORM completion → UserProgress.isCompleted |
| SCORM Grade Sync | [ ] | Medium | Map SCORM score → GradeItem in gradebook |

### 19.4 Competency-Based Education

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Competency Model | [ ] | High | title, description, level (BEGINNER/INTERMEDIATE/ADVANCED/EXPERT), domain, parentId (for hierarchy) |
| CompetencyMapping Model | [ ] | High | competencyId, targetType (COURSE/ASSIGNMENT/ASSESSMENT/RUBRIC_CRITERION), targetId |
| StudentCompetency Model | [ ] | High | userId, competencyId, masteryLevel (0-100%), evidenceCount, lastAssessedAt |
| Competency CRUD API | [ ] | High | Admin/Instructor: create competency frameworks |
| Competency Mapping API | [ ] | High | Link competencies to courses/assignments/assessments |
| Competency Tracker | [ ] | High | Auto-update mastery based on linked grade items |
| Competency Dashboard (Student) | [ ] | High | Visual skill map showing mastery per competency |
| Competency Report (Instructor) | [ ] | High | Class-wide competency matrix |
| Competency-Based Release | [ ] | Medium | Release condition type: COMPETENCY_MASTERY (integrates with Phase 15.2) |

**Dependencies:** Phase 14-15 (for grade/assessment integration), Phase 7 (file upload for SCORM)
**Database Changes:** New models: SAMLConfig, Webhook, WebhookDelivery, APIKey, SCORMPackage, SCORMData, Competency, CompetencyMapping, StudentCompetency

---

## Sprint A: UI Completion

**Status: COMPLETED**

Addresses 6 high-priority deferred UI items that had backend APIs ready but no frontend.

| Feature | Status | Description |
|---------|--------|-------------|
| Rubric Builder UI | [x] | Visual grid builder — create/edit/delete/duplicate rubrics with criteria × levels grid |
| Rubric Grading UI | [x] | Click-to-grade rubric grid in assignment grading page, auto-calculates total |
| Release Condition Builder UI | [x] | AND/OR visual tree editor, 7 condition types, target selector |
| Student Lock Indicators | [x] | Lock icons on locked lessons/chapters in course sidebar, disabled interaction |
| Course Clone Dialog | [x] | Frontend dialog with checkboxes (assignments, assessments, rubrics, conditions, announcements) + date shift |
| Schedule Editor UI | [x] | availableFrom/availableUntil date pickers for chapters and lessons |

### Key Files (Sprint A)
- `src/app/(dashboard)/instructor/courses/[courseId]/rubrics/page.tsx` — Rubric Builder
- `src/app/(dashboard)/instructor/courses/[courseId]/grading/page.tsx` — Enhanced with rubric grading
- `src/app/(dashboard)/instructor/courses/[courseId]/conditions/page.tsx` — Release Condition Builder
- `src/app/(dashboard)/instructor/courses/[courseId]/schedule/page.tsx` — Schedule Editor
- `src/components/editor/course-clone-dialog.tsx` — Clone Course Dialog
- `src/components/learn/course-sidebar.tsx` — Lock indicators (Lock icon, disabled state)
- `src/app/(dashboard)/courses/[courseId]/learn/page.tsx` — Release condition evaluation

**Completion Date:** January 2026

---

## Implementation Roadmap

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE (COMPLETED)                         │
├─────────────────────────────────────────────────────────────┤
│ Phase 1-6: Auth, LMS, Forums, Chat, Admin, 3D Viewer       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 ENHANCEMENT (COMPLETED)                      │
├─────────────────────────────────────────────────────────────┤
│ Phase 7-9, 11-13: Uploads, Notifications, Learning,        │
│ Performance, Testing, Analytics                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         INSTRUCTOR CORE (CRITICAL — Phase 14)               │
├─────────────────────────────────────────────────────────────┤
│ Unified Assessment System (Quiz+Exam) + Question Types     │
│ Assignment System + File Submissions                        │
│ Rubrics + Manual Grading Queue                              │
│ Student: Assessment Player + Submission UI                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          INSTRUCTOR CORE (HIGH — Phase 15)                  │
├─────────────────────────────────────────────────────────────┤
│ Gradebook (Custom Scales, Weighted, Drop Lowest)           │
│ Content Scheduling + Release Conditions (Brightspace-style)│
│ Announcements + Attendance + Course Cloning                │
│ Full Telemetry + Student Activity Reports                  │
│ Student: Grade View + Lock Indicators + Announcements Feed │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            ADMIN CORE (HIGH — Phase 16)                     │
├─────────────────────────────────────────────────────────────┤
│ MFA (TOTP + Email OTP + Backup Codes)                      │
│ Course Approval Workflow                                    │
│ Email Campaigns & Broadcasts                                │
│ Data Retention (GDPR + FERPA + Configurable Policies)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          CROSS-ROLE (MEDIUM-HIGH — Phase 17)                │
├─────────────────────────────────────────────────────────────┤
│ Calendar & Due Dates (auto-populated)                      │
│ Student Groups + Group Assignments                          │
│ Peer Review System                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          CROSS-ROLE (MEDIUM — Phase 18)                     │
├─────────────────────────────────────────────────────────────┤
│ Chart Library (Recharts)                                    │
│ Grade Analytics + At-Risk Flags + Cohort Analysis          │
│ Activity Heatmaps + Assessment Item Analysis                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         INTEGRATIONS (MEDIUM — Phase 19)                    │
├─────────────────────────────────────────────────────────────┤
│ SSO/SAML + JIT Provisioning                                │
│ Webhooks + API Keys + Developer Docs                        │
│ SCORM 1.2/2004 Import + Player                             │
│ Competency-Based Education Framework                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Update Log

| Date          | Update                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Session Start | Phase 1-2 completed from previous sessions                                                                               |
| Current       | Development plan created with progress tracking                                                                          |
| Current       | **Phase 3 COMPLETED** - Discussion Forums fully implemented                                                              |
| Current       | **Phase 4 COMPLETED** - Real-time Chat with Pusher fully implemented                                                     |
| Current       | **Phase 5 COMPLETED** - Admin Dashboard with user management, course management, category management, and analytics      |
| Current       | **Phase 6 COMPLETED** - 3D Scene Viewer with React Three Fiber, visual scene editor, annotations, and lesson integration |
| Current       | **CORE COMPLETE** - All 6 core phases implemented successfully                                                           |
| Current       | **ROADMAP UPDATED** - Added Phase 7-13 enhancement phases                                                                |
| Current       | **Phase 7 COMPLETED** - File Upload & Media Management with UploadThing and Media Library                                |
| Current       | **Phase 8 PARTIAL** - Core notifications system implemented (in-app notifications working)                               |
| Jan 2026      | **PRODUCTION READY** - Sentry error tracking, Upstash rate limiting, audit logging, health checks                        |
| Jan 2026      | **Phase 13 PARTIAL** - Admin reports and audit logs pages implemented                                                    |
| Jan 2026      | Fixed instructor courses page (404 error) - created `/instructor/courses/page.tsx`                                       |
| Jan 2026      | **DEPLOYMENT COMPLETED** - Vercel deployment, custom domain (civilabsreview.com), DNS config, Google OAuth production    |
| Jan 2026      | Fixed OAuth: `AUTH_SECRET`, `AUTH_TRUST_HOST` env vars, corrected client secret typo, OAuth account linking callback     |
| Jan 2026      | **Phase 9 COMPLETED** - Bookmarks, Notes, Course Reviews, Learning Paths, Prerequisites (API + UI + enforcement)        |
| Jan 2026      | **Phase 13 COMPLETED** - Instructor Analytics, Student Progress Reports, CSV Export API with Quick Export UI             |
| Jan 2026      | **Phase 12 COMPLETED** - Jest + RTL setup, 95 tests (API route tests + component tests), environment-aware test setup   |
| Jan 2026      | **ALL PHASES COMPLETE** - Project at 100% completion (12/13 phases done, Phase 10 intentionally skipped)                 |
| Jan 2026      | **COMPETITIVE GAP ANALYSIS** - Identified missing features vs Blackboard/Canvas/Moodle/Brightspace                      |
| Jan 2026      | **ROADMAP EXPANDED** - Added Phase 14-19 with role-based progressive development (Instructor → Admin → Cross-role)      |
| Jan 2026      | **ARCHITECTURE DECISIONS** - Unified assessment, Brightspace-style conditions, custom grades, enterprise config, full telemetry |
| Jan 2026      | **USER SETTINGS IMPLEMENTED** - Profile update, password change, notification preferences, privacy settings (student), platform settings (admin), avatar upload (UploadThing), sidebar navigation links, Sonner toast notifications |
| Jan 2026      | **BUG FIX: Chapter Creation** - Fixed instructor/admin unable to add chapters. Root cause: `chapterSchema` required `isFree` as mandatory boolean but client never sent it. Fix: made `isFree` optional with `default(false)`, added error feedback to UI, removed extraneous `position` from request body |
| Jan 2026      | **BUG FIX: Build Type Errors** - Fixed 13+ pre-existing TypeScript errors blocking production build: `Question.correctAnswer` nullable type mismatches in `quiz-player.tsx`, `lesson-viewer.tsx`, `quiz-builder.tsx`; Prisma `Json` field null handling in quiz/question/assignment API routes (used `Prisma.JsonNull`); `z.record()` missing key schema in `gradeSubmissionSchema`; Prisma `Without<>` type conflicts in quiz PATCH endpoint (restructured to explicit `QuizUncheckedUpdateInput`) |
| Jan 2026      | **Phase 14 COMPLETED** - Assessment & Assignment System: 8 question types with scoring engine, timed/proctored assessments, assignment submissions with late detection, rubrics API, question banks, grading queue, assessment builder UI, assessment player UI, 97 tests passing, clean build |
| Jan 2026      | **Phase 15 COMPLETED** - Gradebook, Scheduling & Course Management: weighted gradebook with categories/items/grades/export, Brightspace-style release conditions with AND/OR evaluator, announcements (course + global), attendance tracking with roll-call UI, deep course cloning with date shift, student activity telemetry with at-risk detection, instructor dashboards (gradebook/announcements/attendance/activity), student views (grades/announcements), 97 tests passing, clean build |
| Jan 2026      | **Phase 16 COMPLETED** - Admin Core: Security, Compliance & Platform Management: Email OTP MFA with backup codes and lockout, course approval workflow with review queue, email campaigns with recipient segmentation and batch sending via Resend, data retention policies with Vercel cron automation, GDPR compliance (data export, account deletion with anonymization, consent management), admin dashboards (MFA stats, review queue, campaigns, retention), user settings (MFA form, consent/privacy toggles), 97 tests passing, clean build |
| Jan 2026      | **Phase 17 COMPLETED** - Calendar, Groups & Collaboration: FullCalendar integration (month/week/agenda views), calendar API with CRUD and date range filtering, auto-event sync from assignments/assessments/attendance/chapters, iCal subscription URL (unique per-user token, dynamic sync with Google Calendar/Outlook), upcoming deadlines widget, course groups system (CRUD + member management), auto-assign groups (random or balanced by progress with snake-draft), group assignment support (one submission per group, shared grade), instructor group management UI, student group view, peer review deferred to future phase, 97 tests passing, clean build |
| Jan 2026      | **Phase 18 COMPLETED** - Advanced Analytics & Visualizations: Recharts integration, course-level analytics API (enrollment trends, grade distribution, item analysis, time-on-task, completion rates), platform-wide analytics API (user growth, course stats, enrollment trends, activity summary), at-risk student detection API (multi-factor: inactive 7+ days, progress <30% after 14 days, missed assignments), student progress timeline API (unified chronological feed), reusable chart components (LineChart, BarChart, PieChart, ActivityHeatmap, ProgressTimeline), instructor course analytics dashboard with tabbed views, at-risk students standalone page with filters and sortable table, admin platform charts dashboard (user growth, role distribution pie, enrollment trends, activity heatmap, course comparison), cohort analysis and PDF export deferred, 97 tests passing, clean build |
| Jan 2026      | **Phase 19 COMPLETED** - Webhooks & Developer API: Webhook system with HMAC-SHA256 signed payloads (7 event types: enrollment created/completed, assignment submitted, grade updated, course published, assessment attempted, user created), webhook delivery engine with 10s timeout and fire-and-forget pattern, Vercel Cron retry with exponential backoff (1m/5m/30m/2h/12h), webhook CRUD API with test endpoint, API key system with SHA-256 hashed storage and show-once generation, resource-level permissions (courses/enrollments/grades/users/analytics), Bearer token auth middleware with rate limiting (60 req/min), admin developer settings page with webhook management (delivery logs, toggle, test) and API key management (generate/revoke), SAML/SCORM/Competency deferred, 97 tests passing, clean build |

---

## Demo Accounts

| Role       | Email                   | Password       |
| ---------- | ----------------------- | -------------- |
| Admin      | admin@civilabs.com      | Admin123!      |
| Instructor | instructor@civilabs.com | Instructor123! |
| Student    | student@civilabs.com    | Student123!    |

Run `npm run db:seed` to create/reset demo accounts.

---

_This document is actively maintained and updated as features are completed._
