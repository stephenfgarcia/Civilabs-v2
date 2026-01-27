# Competitive Parity Phases (14-19): Assessment to Integrations

This document covers the competitive parity phases that bring CiviLabs LMS to feature parity with enterprise LMS platforms.

---

## Phase 14: Instructor Core — Assessment & Assignment System

**Status: COMPLETED**
**Priority: CRITICAL**
**Role Focus: INSTRUCTOR (with integrated student submission experience)**

> **Scope:** This phase transforms the instructor experience from "content creator" to "full course manager" by adding assignments, the unified assessment system (quiz/exam), rubrics, and the grading queue.

### 14.1 Unified Assessment System (Quiz + Exam)

> **Design:** Expanded `Quiz` model supports QUIZ, EXAM, and PRACTICE assessment types. Backward-compatible: all new fields are nullable.

| Feature | Status | Description |
|---------|--------|-------------|
| Assessment Model Migration | [x] | Expanded Quiz with 18 config fields |
| Question Type Enum Expansion | [x] | 8 types: TRUE_FALSE, SHORT_ANSWER, MATCHING, MULTI_SELECT, ORDERING, ESSAY, FILL_IN_BLANK, MULTIPLE_CHOICE |
| Question Bank Model | [x] | Random pool selection support |
| Timed Assessment Support | [x] | Server-tracked timer, auto-submit |
| Attempt Limit Config | [x] | Configurable max attempts |
| Question Pool Selection | [x] | poolSize + questionBankId |
| Assessment Builder UI | [x] | Full builder with all question types |
| Assessment Player (Student) | [x] | Timer, password gate, honor code |
| Manual Grading Queue | [x] | Combined view for manual grading |
| Adaptive Difficulty | [ ] | Deferred |

### 14.2 Assignment System

| Feature | Status | Description |
|---------|--------|-------------|
| Assignment Model | [x] | FILE_UPLOAD/TEXT_ENTRY/URL_LINK types |
| AssignmentSubmission Model | [x] | Full submission tracking |
| Assignment CRUD API | [x] | Complete CRUD operations |
| Late Submission Detection | [x] | Auto-detect and calculate penalties |
| Assignment Editor UI | [x] | Full form with all options |
| Submission View (Student) | [x] | Upload/text/URL with feedback |

### 14.3 Rubrics

| Feature | Status | Description |
|---------|--------|-------------|
| Rubric Model | [x] | With criteria and levels |
| Rubric CRUD API | [x] | Full CRUD with nested criteria |
| Rubric Builder UI | [x] | Visual grid builder |
| Rubric Grading UI | [x] | Click-to-grade interface |

**Key Files:**
- `src/app/api/courses/[courseId]/assignments/` — Assignment CRUD
- `src/app/api/courses/[courseId]/rubrics/` — Rubric CRUD
- `src/components/editor/assessment-builder.tsx` — Assessment builder
- `src/components/learn/assessment-player.tsx` — Student player

---

## Phase 15: Instructor Core — Gradebook, Scheduling & Course Management

**Status: COMPLETED**
**Priority: HIGH**
**Role Focus: INSTRUCTOR (with integrated student grade visibility)**

### 15.1 Gradebook System

| Feature | Status | Description |
|---------|--------|-------------|
| GradingScale Model | [x] | Custom scales with levels |
| GradeCategory Model | [x] | Weighted categories |
| GradeItem Model | [x] | Individual gradeable items |
| StudentGrade Model | [x] | Per-student grades |
| Gradebook API | [x] | Full matrix with role filtering |
| Grade Calculation Engine | [x] | Weighted averages |
| Gradebook Page (Instructor) | [x] | Spreadsheet-style view |
| Student Grade View | [x] | Personal grades view |
| Grade Export (CSV) | [x] | With weighted totals |

### 15.2 Content Scheduling & Release Conditions

| Feature | Status | Description |
|---------|--------|-------------|
| Availability Fields | [x] | Chapter/Lesson availableFrom/Until |
| ReleaseCondition Model | [x] | Brightspace-style conditions |
| Condition Types | [x] | 7 types supported |
| Release Condition API | [x] | Full CRUD |
| Condition Builder UI | [x] | AND/OR tree editor |
| Student Lock Indicators | [x] | Lock icons in sidebar |

### 15.3 Announcements

| Feature | Status | Description |
|---------|--------|-------------|
| Announcement Model | [x] | Course and global |
| Announcements API | [x] | Full CRUD |
| Scheduled Announcements | [x] | scheduledFor field |
| Announcement Pinning | [x] | isPinned support |

### 15.4 Attendance Tracking

| Feature | Status | Description |
|---------|--------|-------------|
| AttendanceSession Model | [x] | Session records |
| AttendanceRecord Model | [x] | Per-student entries |
| Roll-Call UI | [x] | Quick-mark interface |
| Attendance Reports | [x] | Session history |

### 15.5 Course Cloning

| Feature | Status | Description |
|---------|--------|-------------|
| Course Clone API | [x] | Deep copy with scope |
| Date Shift | [x] | Shift all dates |
| Clone Options UI | [x] | Dialog with options |

### 15.6 Student Activity & Telemetry

| Feature | Status | Description |
|---------|--------|-------------|
| UserActivity Model | [x] | Full telemetry |
| Telemetry Collection API | [x] | Batched ingestion |
| Activity Dashboard | [x] | Per-student view |
| At-Risk Alerts | [x] | Inactive/low-progress flags |

**Key Files:**
- `src/lib/release-conditions.ts` — Condition evaluator
- `src/app/api/courses/[courseId]/gradebook/` — Gradebook API
- `src/app/(dashboard)/instructor/courses/[courseId]/gradebook/page.tsx` — Gradebook UI

---

## Phase 16: Admin Core — Security, Compliance & Platform Management

**Status: COMPLETED**
**Priority: HIGH**
**Role Focus: ADMIN**

### 16.1 Multi-Factor Authentication (MFA)

| Feature | Status | Description |
|---------|--------|-------------|
| MFAConfig Model | [x] | Email OTP method |
| Email OTP Flow | [x] | 6-digit code via Resend |
| Backup Codes | [x] | 10 single-use codes |
| MFA Enforcement | [x] | Admin toggle |
| MFA Settings UI | [x] | Enable/disable/verify |
| Rate Limiting | [x] | 5 failures → lockout |

### 16.2 Course Approval Workflow

| Feature | Status | Description |
|---------|--------|-------------|
| CourseApproval Model | [x] | Review workflow |
| Approval API | [x] | Submit/review actions |
| Review Queue UI | [x] | Admin review interface |
| Approval History | [x] | JSON history tracking |

### 16.3 Email Campaign & Broadcast

| Feature | Status | Description |
|---------|--------|-------------|
| EmailCampaign Model | [x] | Campaign records |
| Recipient Segmentation | [x] | Filter by role/course/activity |
| Batch Sending | [x] | 50 per batch via Resend |
| Scheduled Campaigns | [x] | Vercel cron integration |

### 16.4 Data Retention & Compliance (GDPR + FERPA)

| Feature | Status | Description |
|---------|--------|-------------|
| RetentionPolicy Model | [x] | Per-type retention rules |
| ConsentRecord Model | [x] | Consent tracking |
| User Data Export | [x] | GDPR JSON download |
| Account Deletion | [x] | Full anonymization |
| Consent Management | [x] | Toggle UI |
| Automated Retention Job | [x] | Weekly cron |

**Key Files:**
- `src/lib/mfa.ts` — MFA utilities
- `src/app/api/auth/mfa/route.ts` — MFA API
- `src/app/api/admin/retention/route.ts` — Retention policy API
- `src/app/api/cron/retention/route.ts` — Automated cleanup

---

## Phase 17: Cross-Role — Calendar, Groups & Collaboration

**Status: COMPLETED**
**Priority: MEDIUM-HIGH**
**Role Focus: ALL ROLES**

### 17.1 Calendar & Due Dates

| Feature | Status | Description |
|---------|--------|-------------|
| CalendarEvent Model | [x] | 6 event types |
| Calendar API | [x] | CRUD with date filtering |
| Calendar Page | [x] | FullCalendar integration |
| Auto-Event Generation | [x] | Sync from course data |
| iCal Subscription | [x] | Google Calendar/Outlook |
| Upcoming Deadlines Widget | [x] | Next 7 days |

### 17.2 Groups

| Feature | Status | Description |
|---------|--------|-------------|
| CourseGroup Model | [x] | Groups with max members |
| GroupMember Model | [x] | LEADER/MEMBER roles |
| Group Assignment Support | [x] | Shared submissions |
| Auto-Assign Groups | [x] | Random or balanced |
| Group Management UI | [x] | Instructor interface |

### 17.3 Peer Review

| Feature | Status | Description |
|---------|--------|-------------|
| All Peer Review Features | [ ] | Deferred to future phase |

**Key Files:**
- `src/app/api/calendar/` — Calendar API
- `src/app/api/courses/[courseId]/groups/` — Groups API
- `src/components/calendar/calendar-view.tsx` — FullCalendar wrapper

---

## Phase 18: Cross-Role — Advanced Analytics & Visualizations

**Status: COMPLETED**
**Priority: MEDIUM**
**Role Focus: ALL ROLES (Instructor-heavy)**

| Feature | Status | Description |
|---------|--------|-------------|
| Chart Library | [x] | Recharts integration |
| Enrollment Trend Charts | [x] | Line charts over time |
| Completion Rate Charts | [x] | Bar chart comparison |
| Grade Distribution | [x] | Histogram in 10% buckets |
| Activity Heatmap | [x] | 7×24 grid |
| Assessment Item Analysis | [x] | Per-question stats |
| At-Risk Dashboard | [x] | Multi-factor detection |
| Course Comparison | [x] | Cross-course analytics |
| Progress Timeline | [x] | Chronological feed |
| Admin Platform Dashboard | [x] | Platform-wide stats |
| Cohort Analysis | [ ] | Deferred |
| PDF Export | [ ] | Deferred |

**Key Files:**
- `src/app/api/courses/[courseId]/analytics/route.ts` — Course analytics
- `src/app/api/analytics/platform/route.ts` — Platform analytics
- `src/components/charts/` — Reusable chart components

---

## Phase 19: Integrations & Standards Compliance

**Status: COMPLETED (Webhooks & API Keys only)**
**Priority: MEDIUM**
**Role Focus: ADMIN + SYSTEM**

### 19.1 SSO & SAML

| Feature | Status | Description |
|---------|--------|-------------|
| All SAML Features | [ ] | Deferred to future phase |

### 19.2 Webhooks & Developer API (COMPLETED)

| Feature | Status | Description |
|---------|--------|-------------|
| Webhook Model | [x] | URL, events, HMAC secret |
| WebhookDelivery Model | [x] | Delivery logs with retry |
| Webhook Events | [x] | 7 event types |
| Webhook Delivery Engine | [x] | HMAC-SHA256 signed |
| Webhook Retry | [x] | Exponential backoff |
| APIKey Model | [x] | SHA-256 hashed keys |
| API Key Auth Middleware | [x] | Bearer token auth |
| Per-Key Rate Limiting | [x] | 60 req/min |

### 19.3 SCORM Package Import

| Feature | Status | Description |
|---------|--------|-------------|
| All SCORM Features | [ ] | Deferred to future phase |

### 19.4 Competency-Based Education

| Feature | Status | Description |
|---------|--------|-------------|
| All Competency Features | [ ] | Deferred to future phase |

**Key Files:**
- `src/lib/webhook-dispatcher.ts` — Event dispatcher
- `src/lib/api-key-auth.ts` — API key middleware
- `src/app/api/webhooks/` — Webhook API
- `src/app/api/api-keys/` — API key API

---

## Deferred Items Summary

The following items are planned for future implementation:

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

_See [README.md](./README.md) for navigation to other documentation sections._
