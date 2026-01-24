# CiviLabs LMS - Development Plan & Progress Tracker

> **Last Updated:** January 2026
> **Overall Progress:** Phase 1-9, 11-15 Complete | Production Ready & Deployed

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

**Phase 17 — Calendar, Groups & Peer Review:**
- **CalendarEvent** - Course and personal calendar events
- **CourseGroup** - Student groups within courses
- **GroupMember** - Group membership with roles
- **PeerReview** - Peer review submissions and feedback
- **PeerReviewConfig** - Peer review assignment configuration

**Phase 18 — Analytics:**
- No new models (read-only visualization layer)

**Phase 19 — Integrations:**
- **SAMLConfig** - SAML/SSO configuration per organization
- **Webhook** - Developer webhook subscriptions
- **WebhookDelivery** - Webhook delivery logs and retries
- **APIKey** - Developer API keys with permissions
- **SCORMPackage** - Uploaded SCORM content packages
- **SCORMData** - SCORM runtime data per student
- **Competency** - Learning competency definitions (hierarchical)
- **CompetencyMapping** - Competency-to-content relationships
- **StudentCompetency** - Student mastery tracking per competency

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
| Phase 16           | Admin Core: Security & Compliance         | NOT STARTED | 0%    |
| Phase 17           | Cross-Role: Calendar, Groups & Collab     | NOT STARTED | 0%    |
| Phase 18           | Cross-Role: Advanced Analytics & Charts   | NOT STARTED | 0%    |
| Phase 19           | Integrations: SSO, SCORM, Webhooks        | NOT STARTED | 0%    |
| User Settings      | Profile, Password, Notifications, Privacy, Platform | COMPLETED | 100% |
| Production Ready   | Error Tracking, Rate Limit         | COMPLETED   | 100%       |
| Deployment         | Vercel, Domain, OAuth              | COMPLETED   | 100%       |

**Core Features (Phase 1-13): 100% Complete**
**Competitive Parity Features (Phase 14-19): 33% Complete (2/6 phases)**
**Production Readiness: 100%**
**Deployment: 100% (Live at civilabsreview.com)**
**Overall Project Completion: 79% (15/19 phases complete, Phase 10 skipped)**

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
| Rubric Builder UI | [ ] | High | Deferred — Visual grid builder (API ready, UI in future phase) |
| Rubric-Assignment Link | [x] | High | rubricId on Assignment model; rubricScores JSON on submission |
| Rubric Grading UI | [ ] | High | Deferred — Click cells to grade (API supports rubricScores already) |
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
| Schedule Editor UI (Instructor) | [ ] | High | Deferred — Visual condition builder UI |
| Condition Builder UI | [ ] | High | Deferred — AND/OR condition tree editor |
| Student Lock Indicators | [ ] | High | Deferred — Lock icons in sidebar |
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
| Clone Options UI | [ ] | High | Deferred — Frontend dialog (API fully functional via direct call) |
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

**Status: NOT STARTED**
**Priority: HIGH**
**Role Focus: ADMIN**

> **Scope:** Adds institutional-grade admin capabilities: MFA enforcement, course approval workflows, email campaigns, and full data retention/compliance suite (GDPR + FERPA).

### 16.1 Multi-Factor Authentication (MFA)

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| MFAConfig Model | [ ] | Critical | userId, method (TOTP/EMAIL_OTP), secret (encrypted), isEnabled, backupCodes (hashed), lastUsedAt |
| TOTP Setup Flow | [ ] | Critical | Generate secret → show QR code → verify with code → enable |
| TOTP Verification | [ ] | Critical | On login: prompt for 6-digit code after password success |
| Email OTP Flow | [ ] | High | Send 6-digit code to email → verify within 5 min TTL |
| Backup Codes | [ ] | High | Generate 10 single-use recovery codes on MFA setup |
| MFA Enforcement (Admin) | [ ] | High | Admin can require MFA for all users or specific roles |
| MFA Management API | [ ] | Critical | `src/app/api/auth/mfa/route.ts` — Setup, verify, disable |
| MFA Settings UI | [ ] | Critical | User settings page: enable/disable, manage methods, view backup codes |
| Rate Limiting on OTP | [ ] | High | 5 failed attempts → 15 min lockout |
| MFA Admin Dashboard | [ ] | Medium | View MFA adoption stats, enforce policies |

### 16.2 Course Approval Workflow

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| CourseApproval Model | [ ] | High | courseId, status (DRAFT/PENDING_REVIEW/APPROVED/REJECTED/CHANGES_REQUESTED), submittedAt, reviewedBy, reviewedAt, reviewComment, history (JSON array of status changes) |
| Approval API | [ ] | High | `src/app/api/admin/courses/[courseId]/approval/route.ts` — Submit, approve, reject, request changes |
| Submit for Review (Instructor) | [ ] | High | Button on course editor: "Submit for Review" (changes status, notifies admin) |
| Review Queue (Admin) | [ ] | High | Admin page: list of pending courses with preview and approve/reject/comment actions |
| Review Notification | [ ] | High | Notify instructor on approval/rejection with admin comment |
| Approval Required Toggle | [ ] | Medium | Admin setting: require approval before any course goes live (can be disabled) |
| Approval History | [ ] | Medium | View full approval timeline per course |

### 16.3 Email Campaign & Broadcast

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| EmailCampaign Model | [ ] | High | title, content (rich text), recipientFilter (JSON: role, courseId, enrollment status), sentAt, sentBy, sentCount, status (DRAFT/SENDING/SENT/FAILED) |
| Campaign API | [ ] | High | `src/app/api/admin/campaigns/route.ts` — CRUD, send |
| Recipient Segmentation | [ ] | High | Filter by: role, enrolled in course X, completed course Y, inactive for N days, registered after date |
| Campaign Editor UI | [ ] | High | Rich text editor + recipient filter builder + preview + send |
| Batch Sending | [ ] | High | Send in batches of 50 via Resend (respect rate limits) |
| Campaign Analytics | [ ] | Medium | Sent count, open rate (if tracking pixel supported), bounce count |
| Unsubscribe Support | [ ] | Medium | Unsubscribe link in emails, respect preferences |
| Scheduled Campaigns | [ ] | Medium | Schedule send for future date/time |

### 16.4 Data Retention & Compliance (GDPR + FERPA)

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| RetentionPolicy Model | [ ] | Critical | dataType (USER_DATA/ENROLLMENTS/SUBMISSIONS/TELEMETRY/AUDIT_LOGS/CHAT_MESSAGES), retentionDays, action (ARCHIVE/ANONYMIZE/DELETE), isActive |
| Retention Policy API | [ ] | Critical | `src/app/api/admin/retention/route.ts` — CRUD policies |
| Retention Policy UI (Admin) | [ ] | Critical | Configure per-data-type retention rules |
| Automated Retention Job | [ ] | Critical | Cron/scheduled: evaluate policies, execute actions on expired data |
| User Data Export (GDPR Right to Access) | [ ] | Critical | `GET /api/users/me/export` — Download all personal data as JSON/ZIP |
| Account Deletion (Right to be Forgotten) | [ ] | Critical | `DELETE /api/users/me` — Anonymize/delete all user data, revoke sessions |
| Consent Management | [ ] | High | ConsentRecord model: userId, consentType (DATA_PROCESSING/ANALYTICS/MARKETING), grantedAt, revokedAt |
| Consent UI | [ ] | High | User settings: manage consent preferences |
| Data Anonymization Engine | [ ] | High | Replace PII with hashed/generic values while preserving aggregate analytics |
| FERPA Compliance | [ ] | High | Restrict student record access to authorized personnel only. Audit all access. |
| Deletion Audit Trail | [ ] | High | Log all data deletions/anonymizations in audit log (who, what, when, why) |
| Retention Dashboard (Admin) | [ ] | Medium | Overview: data volumes by type, upcoming scheduled actions, compliance status |
| Privacy Policy Integration | [ ] | Medium | Display privacy policy on registration, require acceptance |

**Dependencies:** Phase 1 (Auth system), Phase 8 (Notifications for approval alerts)
**Database Changes:** New models: MFAConfig, CourseApproval, EmailCampaign, RetentionPolicy, ConsentRecord. Updated: User (mfaEnabled, consentAcceptedAt)

---

## Phase 17: Cross-Role — Calendar, Groups & Collaboration

**Status: NOT STARTED**
**Priority: MEDIUM-HIGH**
**Role Focus: ALL ROLES**

> **Scope:** Calendar system (auto-populated from due dates), student groups, and peer review. These features touch all roles and depend on Phase 14-15 data.

### 17.1 Calendar & Due Dates

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| CalendarEvent Model | [ ] | High | title, description, startDate, endDate, allDay (boolean), type (ASSIGNMENT_DUE/ASSESSMENT_OPEN/ASSESSMENT_CLOSE/CONTENT_AVAILABLE/ATTENDANCE_SESSION/CUSTOM), courseId, userId (null = course-wide), color, referenceType, referenceId |
| Calendar API | [ ] | High | `src/app/api/calendar/route.ts` — List events by date range, course filter |
| Calendar Page | [ ] | High | `src/app/(dashboard)/calendar/page.tsx` — Monthly/weekly/agenda views |
| Auto-Event Generation | [ ] | High | Assignment due dates, assessment windows, content availability dates auto-create events |
| Course Calendar (Instructor) | [ ] | High | View/manage all course events, add custom events |
| Personal Calendar (Student) | [ ] | High | Aggregate events from all enrolled courses |
| Upcoming Deadlines Widget | [ ] | High | Dashboard widget: next 7 upcoming items with countdown |
| iCal Export | [ ] | Medium | `GET /api/calendar/export.ics` — Subscribe from Google Calendar/Outlook |
| Calendar Event Notifications | [ ] | Medium | Notify 24h and 1h before due dates |

### 17.2 Groups

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| CourseGroup Model | [ ] | High | name, courseId, maxMembers, createdBy, createdAt |
| GroupMember Model | [ ] | High | groupId, userId, role (LEADER/MEMBER), joinedAt |
| Groups API | [ ] | High | `src/app/api/courses/[courseId]/groups/route.ts` — CRUD, join/leave, members |
| Group Assignment Support | [ ] | High | Assignment.isGroupAssignment flag; one submission per group |
| Auto-Assign Groups | [ ] | Medium | Instructor triggers: random, balanced by performance, self-select |
| Group Management UI (Instructor) | [ ] | High | Create groups, drag-drop students, set sizes |
| Group View (Student) | [ ] | High | See group members, group assignment status |
| Group Discussion Thread | [ ] | Medium | Private forum thread per group |

### 17.3 Peer Review

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| PeerReview Model | [ ] | High | assignmentId, reviewerId, submissionId, rubricScores (JSON), feedback, completedAt, isAnonymous |
| PeerReviewConfig Model | [ ] | High | assignmentId, reviewsPerStudent, isAnonymous, isDoubleBlind, dueDate, rubricId |
| Review Distribution API | [ ] | High | Auto-assign submissions to reviewers (round-robin, avoid self-review) |
| Peer Review UI (Student) | [ ] | High | Review interface: rubric grid + feedback text |
| Peer Review Results (Student) | [ ] | High | Aggregated peer feedback (anonymized if configured) |
| Instructor Override | [ ] | Medium | Adjust final grade considering peer reviews |
| Peer Review Analytics (Instructor) | [ ] | Medium | Review completion rates, inter-rater reliability |

**Dependencies:** Phase 14 (Assignments), Phase 15 (Gradebook for grade integration)
**Database Changes:** New models: CalendarEvent, CourseGroup, GroupMember, PeerReview, PeerReviewConfig

---

## Phase 18: Cross-Role — Advanced Analytics & Visualizations

**Status: NOT STARTED**
**Priority: MEDIUM**
**Role Focus: ALL ROLES (Instructor-heavy)**

> **Scope:** Adds chart library, visual dashboards, grade analytics, and course comparison tools. Read-only layer over existing data — lowest risk phase.

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Chart Library Integration | [ ] | High | Add Recharts for data visualization (lightweight, React-native) |
| Enrollment Trend Charts | [ ] | High | Line chart: enrollments over time per course |
| Completion Rate Charts | [ ] | High | Bar/pie: course completion rates comparison |
| Grade Distribution Histogram | [ ] | High | Per-assignment/assessment/course grade distributions |
| Student Activity Heatmap | [ ] | Medium | Activity by day/hour grid visualization |
| Assessment Item Analysis | [ ] | High | Per-question: success rate, discrimination index, point biserial |
| At-Risk Student Dashboard | [ ] | High | Flag students: no login 7+ days, failing, missed deadlines. Sortable/filterable list. |
| Course Comparison | [ ] | Medium | Side-by-side metrics across instructor's courses |
| Instructor Performance Dashboard | [ ] | Medium | Enhanced instructor analytics with all charts |
| Student Progress Timeline | [ ] | High | Visual timeline: when each lesson/assessment was completed |
| Cohort Analysis | [ ] | Medium | Compare performance across groups/semesters |
| Time-on-Task Charts | [ ] | Medium | Visualize telemetry data: time per lesson, video engagement |
| Export to PDF | [ ] | Medium | Generate PDF reports with embedded charts |
| Admin Platform Dashboard | [ ] | Medium | Platform-wide charts: user growth, course creation, system health |

**Dependencies:** Phase 14-15 (data sources), Phase 15.6 (telemetry data)
**Database Changes:** None — read-only from existing models

---

## Phase 19: Integrations & Standards Compliance

**Status: NOT STARTED**
**Priority: MEDIUM**
**Role Focus: ADMIN + SYSTEM**

> **Scope:** Institutional integration features: SSO/SAML, developer webhooks/API keys, SCORM import, and competency-based education. Each sub-phase is independent and can be built in any order.

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

### 19.2 Webhooks & Developer API

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Webhook Model | [ ] | High | url, events (string[]), secret, userId, isActive, createdAt, description |
| WebhookDelivery Model | [ ] | High | webhookId, eventType, payload (JSON), statusCode, responseBody, deliveredAt, attempts |
| Webhook Events | [ ] | High | enrollment.created, enrollment.completed, assignment.submitted, grade.updated, course.published, assessment.attempted, user.created |
| Webhook Delivery Engine | [ ] | High | HTTP POST with HMAC-SHA256 signed payload, 10s timeout |
| Webhook Retry | [ ] | Medium | Exponential backoff: retry at 1m, 5m, 30m, 2h, 12h |
| Webhook Management API | [ ] | High | CRUD + test delivery endpoint |
| Webhook Admin UI | [ ] | High | Create/manage webhooks, view delivery logs with status |
| APIKey Model | [ ] | High | keyHash, name, permissions (string[]), userId, expiresAt, lastUsedAt, isActive |
| API Key Management | [ ] | High | Generate (show once), revoke, list keys |
| API Key Auth Middleware | [ ] | High | Authenticate requests via `Authorization: Bearer <api_key>` header |
| Per-Key Rate Limiting | [ ] | Medium | Configurable rate limits per API key |
| API Documentation | [ ] | Medium | Auto-generated OpenAPI/Swagger docs page |

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
