# Architecture Overview

This document describes the system architecture and database schema for CiviLabs LMS.

---

## Directory Structure

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
│   │   ├── bookmarks/          # Bookmarks CRUD API (Phase 9)
│   │   ├── notes/              # Notes CRUD API (Phase 9)
│   │   ├── learning-paths/     # Learning paths API (Phase 9)
│   │   ├── reports/            # CSV export API (Phase 13)
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
│   ├── api/                    # API route tests
│   ├── components/             # Component tests
│   ├── lib/                    # Utility tests
│   └── test-utils.tsx          # Test helpers & mock data
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

### Core Models (Implemented)

| Model | Description | Phase |
|-------|-------------|-------|
| User | Authentication and profile | 1 |
| Account | OAuth accounts (NextAuth) | 1 |
| Course | Course information | 2 |
| Chapter | Course chapters | 2 |
| Lesson | Individual lessons (VIDEO, TEXT, PDF, DOCUMENT, POWERPOINT, SCENE_3D) | 2 |
| Quiz | Chapter quizzes | 2 |
| Question | Quiz questions | 2 |
| QuizAttempt | Student quiz attempts | 2 |
| Enrollment | Course enrollments | 2 |
| UserProgress | Lesson completion tracking | 2 |
| Certificate | Completion certificates | 2 |
| Category | Course categories | 2 |

### Community Models

| Model | Description | Phase |
|-------|-------------|-------|
| ForumCategory | Forum categories | 3 |
| ForumThread | Forum threads | 3 |
| ForumReply | Thread replies | 3 |
| ChatRoom | Chat rooms | 4 |
| ChatMessage | Chat messages | 4 |

### Enhancement Models

| Model | Description | Phase |
|-------|-------------|-------|
| Media | Media library items | 7 |
| Notification | User notifications | 8 |
| NotificationPreference | Per-user notification toggles | Settings |
| PlatformSettings | Admin platform configuration singleton | Settings |
| Bookmark | Lesson bookmarks | 9 |
| Note | Personal lesson notes | 9 |
| Review | Course ratings/reviews | 9 |
| LearningPath | Curated course sequences | 9 |
| LearningPathCourse | Path-course relationships | 9 |
| LearningPathEnrollment | User path enrollment | 9 |
| CoursePrerequisite | Course dependencies | 9 |
| AuditLog | Admin audit trail | Production |

### Assessment & Assignment Models (Phase 14)

| Model | Description |
|-------|-------------|
| Assignment | File/text submission assignments |
| AssignmentSubmission | Student submissions with grading and status |
| Rubric | Grading rubrics with criteria |
| RubricCriterion | Individual rubric criteria and level definitions |
| QuestionBank | Reusable question pools per course |
| QuestionBankItem | Links questions to banks |

### Gradebook & Scheduling Models (Phase 15)

| Model | Description |
|-------|-------------|
| GradingScale | Custom grading scales with configurable levels |
| GradeCategory | Weighted grade categories per course |
| GradeItem | Individual gradeable items linked to assignments/assessments |
| StudentGrade | Per-student grades with override support |
| ReleaseCondition | Brightspace-style content release rules |
| ReleaseConditionGroup | AND/OR grouping for nested conditions |
| Announcement | Course and global announcements |
| AttendanceSession | Attendance session records |
| AttendanceRecord | Per-student attendance entries |
| AttendancePolicy | Attendance rules and grade impact |
| UserActivity | Full telemetry event tracking |

### Admin Security Models (Phase 16)

| Model | Description |
|-------|-------------|
| MFAConfig | Multi-factor auth settings per user |
| CourseApproval | Course review workflow records |
| EmailCampaign | Admin email broadcast campaigns |
| RetentionPolicy | Per-data-type retention rules |
| ConsentRecord | GDPR consent tracking per user |

### Calendar & Groups Models (Phase 17)

| Model | Description |
|-------|-------------|
| CalendarEvent | Course and personal calendar events with 6 event types |
| CalendarToken | Unique per-user token for iCal subscription URL |
| CourseGroup | Student groups within courses with max member limits |
| GroupMember | Group membership with LEADER/MEMBER roles |

### Integration Models (Phase 19)

| Model | Description |
|-------|-------------|
| Webhook | Developer webhook subscriptions with URL, events, HMAC secret |
| WebhookDelivery | Delivery logs with retry tracking |
| APIKey | API keys with SHA-256 hash, resource-level permissions, expiry |

### Deferred Models

The following models are planned for future implementation:

- SAMLConfig
- SCORMPackage
- SCORMData
- Competency
- CompetencyMapping
- StudentCompetency

---

_See [README.md](./README.md) for navigation to other documentation sections._
