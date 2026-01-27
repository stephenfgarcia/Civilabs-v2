# CiviLabs LMS - Development Plan & Progress Tracker

> **Last Updated:** January 2026
> **Overall Progress:** Phase 1-9, 11-19 + Sprint A + Sprint B Complete | Production Ready & Deployed

---

## Documentation Index

The development documentation has been organized into smaller, focused documents for easier navigation and maintenance.

### Quick Links

| Document | Description |
|----------|-------------|
| [Progress Summary](./docs/development/01-PROGRESS.md) | Overall completion status, phase tracker, and demo accounts |
| [Architecture](./docs/development/02-ARCHITECTURE.md) | Directory structure and database schema overview |
| [Core Phases (1-6)](./docs/development/03-PHASES-CORE.md) | Foundation, LMS, Forums, Chat, Admin, 3D Viewer |
| [Enhancement Phases (7-13)](./docs/development/04-PHASES-ENHANCE.md) | Uploads, Notifications, Learning, Performance, Testing, Analytics |
| [Competitive Phases (14-19)](./docs/development/05-PHASES-COMPETE.md) | Assessment, Gradebook, Admin Core, Calendar, Analytics, Integrations |
| [Sprints & Settings](./docs/development/06-SPRINTS.md) | User Settings, Sprint A (UI Completion), Sprint B (Instructor Polish) |
| [Guidelines](./docs/development/07-GUIDELINES.md) | Development approach, architecture decisions, pre-development considerations |
| [Changelog](./docs/development/08-CHANGELOG.md) | Implementation roadmap and update log |

---

## Project Overview

CiviLabs LMS is a Learning Management System designed for engineering education with 3D scene capabilities.

### Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Authentication:** NextAuth.js v5
- **Styling:** Tailwind CSS + shadcn/ui
- **Real-time:** Pusher
- **3D Rendering:** React Three Fiber + @react-three/drei
- **Deployment:** Vercel

### User Roles

1. **Student** - Browse courses, enroll, learn, take quizzes, earn certificates
2. **Instructor** - Create and manage courses, chapters, lessons, quizzes, assessments, assignments
3. **Admin** - Full system management, user management, analytics, platform configuration

---

## Demo Accounts

| Role       | Email                   | Password       |
| ---------- | ----------------------- | -------------- |
| Admin      | admin@civilabs.com      | Admin123!      |
| Instructor | instructor@civilabs.com | Instructor123! |
| Student    | student@civilabs.com    | Student123!    |

Run `npm run db:seed` to create/reset demo accounts.

---

## Quick Reference

### Completion Summary

| Category | Phases | Status |
|----------|--------|--------|
| Core | 1-6 | COMPLETED |
| Enhancement | 7-9, 11-13 | COMPLETED |
| Competitive | 14-19 | COMPLETED |
| Sprints | A, B | COMPLETED |
| Skipped | 10 (Mobile/PWA) | Web-only preferred |

### Deferred Items

| Feature | Original Phase | Priority |
|---------|----------------|----------|
| Adaptive Difficulty | 14 | Low |
| SAML/SSO | 19 | High |
| SCORM Import | 19 | High |
| Competency-Based Education | 19 | High |
| Peer Review | 17 | High |
| Cohort Analysis | 18 | Medium |
| PDF Export | 18 | Medium |
| Calendar Notifications | 17 | Medium |

---

_For detailed information on any phase or feature, see the [Documentation Index](#documentation-index) above._
