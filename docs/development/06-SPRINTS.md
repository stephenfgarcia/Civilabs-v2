# Sprints & Settings

This document covers the user settings system and the UI completion sprints.

---

## User Settings (All Roles)

**Status: COMPLETED**

> **Scope:** Profile management, password change, notification preferences, privacy settings (student), and platform configuration (admin). Shared settings page component with role-conditional sections.

### Database Schema Changes

| Change | Status | Files |
|--------|--------|-------|
| `profileVisibility` field on User | [x] | `prisma/schema.prisma` |
| `NotificationPreference` model | [x] | `prisma/schema.prisma` (7 email toggle fields) |
| `PlatformSettings` model | [x] | `prisma/schema.prisma` (registration, maintenance, file upload config) |

### Validation Schemas

| Schema | Status | Files |
|--------|--------|-------|
| `changePasswordSchema` | [x] | `src/lib/validations.ts` |
| `notificationPreferenceSchema` | [x] | `src/lib/validations.ts` |
| `privacySettingsSchema` | [x] | `src/lib/validations.ts` |
| `platformSettingsSchema` | [x] | `src/lib/validations.ts` |

### API Endpoints

| Endpoint | Method | Access |
|----------|--------|--------|
| `/api/profile` | GET/PATCH | All authenticated |
| `/api/auth/change-password` | POST | All authenticated (credentials only) |
| `/api/settings/notifications` | GET/PATCH | All authenticated |
| `/api/settings/privacy` | GET/PATCH | Student only |
| `/api/admin/settings/platform` | GET/PATCH | Admin only |

### UI Components

| Component | Files | Description |
|-----------|-------|-------------|
| ProfileForm | `src/components/settings/profile-form.tsx` | Name, bio, avatar upload |
| PasswordForm | `src/components/settings/password-form.tsx` | Current + new password |
| NotificationForm | `src/components/settings/notification-form.tsx` | 7 toggle switches |
| PrivacyForm | `src/components/settings/privacy-form.tsx` | Profile visibility toggle |
| PlatformForm | `src/components/settings/platform-form.tsx` | Admin platform config |
| SettingsPage | `src/components/settings/settings-page.tsx` | Shared page component |

### Route Pages

| Route | Files |
|-------|-------|
| `/student/settings` | `src/app/(dashboard)/student/settings/page.tsx` |
| `/instructor/settings` | `src/app/(dashboard)/instructor/settings/page.tsx` |
| `/admin/settings` | `src/app/(dashboard)/admin/settings/page.tsx` |

### Features by Role

| Feature | Student | Instructor | Admin |
|---------|---------|------------|-------|
| Profile (name, bio, avatar) | Yes | Yes | Yes |
| Password Change | Yes | Yes | Yes |
| Email Display (read-only) | Yes | Yes | Yes |
| Notification Preferences | Yes | Yes | Yes |
| Privacy (profile visibility) | Yes | - | - |
| Platform Settings | - | - | Yes |

**Architecture:** Shared `<SettingsPage>` component renders role-conditional sections based on `session.user.role`.

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

---

## Sprint B: Instructor Polish

**Status: COMPLETED**

Addresses 4 instructor workflow improvements for grading and grade management.

| Feature | Status | Description |
|---------|--------|-------------|
| Auto-Grade Sync | [x] | Configurable per course toggle — quiz/assignment scores auto-sync to gradebook StudentGrade records |
| Inline Feedback | [x] | Comment thread + text annotations on submissions with character-offset highlighting |
| File Preview | [x] | PDF iframe, images, Office docs via Google Docs Viewer in grading interface |
| Notification Improvements | [x] | Helpers for graded assignments, submission feedback, manual grade needed alerts |

### Key Files (Sprint B)

- `src/lib/grade-sync.ts` — Auto-grade sync utility with upsert to StudentGrade
- `src/components/editor/auto-grade-toggle.tsx` — Instructor toggle for autoGradeSync setting
- `src/app/api/courses/[courseId]/assignments/[assignmentId]/submissions/[submissionId]/comments/route.ts` — Comment thread API
- `src/app/api/courses/[courseId]/assignments/[assignmentId]/submissions/[submissionId]/annotations/route.ts` — Text annotation API
- `src/components/grading/feedback-panel.tsx` — Inline feedback UI with comment thread + annotation highlighting
- `src/components/grading/file-preview.tsx` — PDF/Image/Office doc preview component
- `src/lib/notifications.ts` — Extended with notifyAssignmentGraded, notifySubmissionFeedback, notifyManualGradeNeeded

### Database Changes (Sprint B)

- `Course.autoGradeSync` — Boolean field to enable/disable auto-sync per course
- `SubmissionComment` — Model for comment thread on submissions
- `SubmissionAnnotation` — Model for inline text annotations with character offsets

---

_See [README.md](./README.md) for navigation to other documentation sections._
