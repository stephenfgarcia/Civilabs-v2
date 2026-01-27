# CiviLabs LMS - Architecture Definitions

> Quick reference guide defining each architecture flow section. For detailed Mermaid diagrams, see [ARCHITECTURE_FLOWS.md](./ARCHITECTURE_FLOWS.md).

---

## Table of Contents

1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Authentication Flows](#2-authentication-flows)
3. [User Journey Flows](#3-user-journey-flows)
4. [Course Management Flows](#4-course-management-flows)
5. [Learning & Progress Flows](#5-learning--progress-flows)
6. [Quiz & Assessment Flows](#6-quiz--assessment-flows)
7. [Certificate Flows](#7-certificate-flows)
8. [Community Flows (Forums & Chat)](#8-community-flows-forums--chat)
9. [Admin Flows](#9-admin-flows)
10. [API Sequence Diagrams](#10-api-sequence-diagrams)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Role-Based Access Control](#12-role-based-access-control)
13. [State Diagrams](#13-state-diagrams)
14. [3D Scene Flows](#14-3d-scene-flows)
15. [Notification System](#15-notification-system)
16. [Media & Upload Flows](#16-media--upload-flows)
17. [MFA & Security Flows](#17-mfa--security-flows)
18. [Course Approval Workflow](#18-course-approval-workflow)
19. [Email Campaign Flows](#19-email-campaign-flows)
20. [Data Retention & GDPR Flows](#20-data-retention--gdpr-flows)
21. [Calendar & Scheduling Flows](#21-calendar--scheduling-flows)
22. [Groups & Collaboration Flows](#22-groups--collaboration-flows)
23. [Advanced Analytics Flows](#23-advanced-analytics-flows)
24. [Webhooks & API Key Flows](#24-webhooks--api-key-flows)

---

## 1. High-Level System Architecture

Documents the overall system topology showing how the client layer (Browser, Service Worker, Pusher Client) connects to the Next.js server layer (Pages, API Routes, Middleware, Auth) and external services (Neon PostgreSQL, Upstash Redis, Google OAuth, Resend, Pusher, UploadThing, Sentry, Vercel). Covers the complete request lifecycle from client to database and back.

**Key Components:**
- Client Layer: Browser, Service Worker, Pusher Client
- Server Layer: Next.js Pages, API Routes, Middleware, NextAuth
- External Services: Neon, Upstash, Google, Resend, Pusher, UploadThing, Sentry, Vercel
- Data Layer: Prisma ORM

---

## 2. Authentication Flows

Covers all authentication mechanisms including credentials-based login (email/password with bcrypt verification), Google OAuth integration (consent flow, account linking), user registration (validation, password hashing, welcome notifications), and JWT session management.

**Key Actors:** User, NextAuth.js, PostgreSQL, Google OAuth provider

**Key Files:**
- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/` - Auth API routes
- `src/app/(auth)/` - Login, register pages

---

## 3. User Journey Flows

Maps the complete end-to-end journeys for each user role. Student journey covers course browsing, enrollment, lesson consumption (video/PDF/3D/text), quiz taking, and certificate generation. Instructor journey covers course creation, content management, quiz building, and analytics viewing. Admin journey covers user management, course oversight, forum moderation, and platform analytics.

**Key Actors:** Student, Instructor, Admin

**Role Capabilities:**
- Student: Browse, enroll, learn, submit, earn certificates
- Instructor: Create courses, grade, view analytics
- Admin: Full system management

---

## 4. Course Management Flows

Documents the complete course lifecycle from creation to publication. Covers course creation (slug generation, ChatRoom creation), content structure (Course → Chapter → Lesson → Quiz hierarchy), and publishing workflow (validation, notification triggers). Includes course state transitions: Draft → ReadyToPublish → Published → Deleted.

**Key Models:** Course, Chapter, Lesson, Quiz, Question

**State Transitions:** Draft → HasChapters → HasContent → Published → Deleted

---

## 5. Learning & Progress Flows

Tracks student progress through course content. Covers lesson viewing (content delivery by type), progress tracking (UserProgress record creation/updates), enrollment flow (validation, email notifications, instructor alerts), and course completion states.

**Key Actors:** Student, Progress API, Database, Notification service

**Key Models:** Enrollment, UserProgress, Lesson

---

## 6. Quiz & Assessment Flows

Documents quiz creation (instructor) and quiz taking (student) workflows. Covers quiz attempt flow (answer submission, score calculation, pass/fail determination, QuizAttempt record creation), quiz builder flow (question creation, option management, passing score configuration), and result notifications.

**Key Actors:** Student, Instructor, Quiz API, Notification service

**Key Models:** Quiz, Question, QuizAttempt

---

## 7. Certificate Flows

Covers certificate generation upon course completion and public verification. Generation flow validates enrollment, lesson completion, and quiz passing before creating a unique certificate code. Verification flow allows public access to validate certificate authenticity via URL.

**Key Actors:** Student, Certificate API, Resend (email), public verifiers

**Key Models:** Certificate

**Public Routes:** `/certificates/{code}`, `/verify/{code}`

---

## 8. Community Flows (Forums & Chat)

Documents community features including discussion forums and real-time chat. Forum flow covers thread creation, replies, and admin moderation (pin/lock/delete). Chat flow covers real-time messaging using Pusher WebSocket integration, message persistence, and room state management.

**Key Actors:** Users, Admin (moderation), Pusher server, Forum/Chat APIs

**Key Models:** ForumCategory, ForumThread, ForumReply, ChatRoom, ChatMessage

---

## 9. Admin Flows

Documents admin-specific workflows including user management (search, filter, role changes, deletion with audit logging) and platform analytics (overview metrics, enrollment trends, top courses, category distribution). All admin actions create audit log entries for compliance tracking.

**Key Actors:** Admin, Admin API, Database, Audit Log

**Key Models:** User, AuditLog

**Key Routes:** `/admin/*`, `/api/admin/*`

---

## 10. API Sequence Diagrams

Detailed sequence diagrams showing the exact API call flow for key operations. Includes course enrollment (validation, record creation, parallel email/notification dispatch), lesson content delivery (type-specific streaming from CDN), and rate limiting (Redis-based sliding window with header responses). Shows timing and parallel operations.

**Key Operations:**
- Course enrollment sequence
- Lesson content delivery sequence
- Rate limiting sequence

---

## 11. Data Flow Diagrams

Maps data movement through the system from input sources (forms, uploads, submissions) through validation and processing layers to storage (PostgreSQL, Redis, UploadThing) and outputs (pages, API responses, emails, real-time events, PDFs). Includes the database entity-relationship diagram showing all model connections.

**Data Sources:** Registration, Course creation, Uploads, Quiz answers, Chat messages, Forum posts

**Storage:** Neon PostgreSQL, Upstash Redis, UploadThing CDN

**Outputs:** Pages, API responses, Emails, Real-time events, PDFs

---

## 12. Role-Based Access Control

Documents the permission model for STUDENT, INSTRUCTOR, and ADMIN roles. Shows hierarchical permission inheritance (Admin > Instructor > Student), route protection matrix (/student/*, /instructor/*, /admin/* paths), and API authorization flow (session validation → role check → resource ownership verification).

**Role Hierarchy:** ADMIN > INSTRUCTOR > STUDENT

**Key File:** `src/lib/auth.ts`

**Protected Routes:**
- `/student/*` - Student and above
- `/instructor/*` - Instructor and above
- `/admin/*` - Admin only

---

## 13. State Diagrams

Comprehensive state machine diagrams for key entities. Includes course lifecycle (Created → HasChapters → HasContent → Published → Deleted), student enrollment lifecycle (Browsing → Enrolled → Learning → Certified), notification states (Created → Unread → Read), and quiz attempt states (NotAttempted → InProgress → Passed/Failed).

**Entity States:**
- Course: Draft → Published → Deleted
- Enrollment: Browsing → Enrolled → Learning → Certified
- Notification: Created → Unread → Read
- Quiz Attempt: NotAttempted → InProgress → Passed/Failed

---

## 14. 3D Scene Flows

Documents the 3D scene system built on React Three Fiber and drei. Creation flow covers camera configuration, controls setup, environment settings, and object placement (models, primitives, lights, annotations). Rendering flow shows scene initialization, asset loading from CDN, and user interaction handling. SceneConfig stored as JSON in lesson records.

**Technology:** React Three Fiber, @react-three/drei

**Object Types:** Models (GLB/GLTF/OBJ/FBX), Primitives, Lights, Annotations

**Key Components:** `src/components/3d/`

---

## 15. Notification System

Maps all notification triggers to recipients and delivery mechanisms. Covers 9 notification types (WELCOME, ENROLLMENT, COURSE_PUBLISHED, QUIZ_PASSED, QUIZ_FAILED, CERTIFICATE_EARNED, FORUM_REPLY, COURSE_UPDATE, ANNOUNCEMENT). Shows trigger → service → database → UI bell flow.

**Notification Types:**
1. WELCOME - New user registration
2. ENROLLMENT - Student enrolls (to instructor)
3. COURSE_PUBLISHED - Course goes live (to enrolled students)
4. QUIZ_PASSED - Quiz success
5. QUIZ_FAILED - Quiz failure
6. CERTIFICATE_EARNED - Course completion
7. FORUM_REPLY - Reply to thread
8. COURSE_UPDATE - Content changes
9. ANNOUNCEMENT - Admin broadcasts

**Key File:** `src/lib/notifications.ts`

---

## 16. Media & Upload Flows

Documents file upload system using UploadThing. Upload flow covers type-specific components (image, video, document, 3D model), validation (size/type checks), CDN storage, and URL persistence to database. Media library flow enables instructors to manage reusable assets.

**Supported Types:**
- IMAGE: jpg, png, gif, webp
- VIDEO: mp4, webm, mov
- DOCUMENT: pdf, doc, ppt
- MODEL_3D: glb, gltf, obj, fbx
- OTHER: zip, etc.

**Key Files:** `src/app/api/uploadthing/`, `src/components/upload/`

---

## 17. MFA & Security Flows

**Phase:** 16 (Admin Core: Security & Compliance)

Documents multi-factor authentication system. Covers Email OTP verification (6-digit code via Resend, 10-minute expiry), MFA login challenge (credentials → pending session → OTP verification → full session), backup codes (10 bcrypt-hashed single-use codes), and account lockout (5 failures → 15-minute lockout).

**MFA Methods:**
- Email OTP (primary)
- Backup codes (recovery)

**Security Features:**
- Rate limiting (5 attempts max)
- Account lockout (15 minutes)
- Audit logging

**Key Files:** `src/lib/mfa.ts`, `src/app/api/auth/mfa/`

---

## 18. Course Approval Workflow

**Phase:** 16 (Admin Core: Security & Compliance)

Documents the course review workflow. Instructors submit courses for admin approval before publishing. Admins can approve (auto-publish), reject (with reason), or request changes (with feedback). Full history tracking with JSON audit trail.

**State Transitions:** Draft → PendingApproval → Approved/Rejected/ChangesRequested → Published

**Key Actors:** Instructor, Admin

**Key Model:** CourseApproval

---

## 19. Email Campaign Flows

**Phase:** 16 (Admin Core: Security & Compliance)

Documents admin email broadcast system. Campaign creation with recipient segmentation (all users, by role, by course, by activity, custom list). Supports immediate send or scheduled delivery via Vercel cron. Batch processing (50 emails per batch with 1-second rate limit cooldown) through Resend API.

**Segmentation Options:**
- All users
- By role (Student/Instructor)
- By course enrollment
- By activity (last active)
- Custom email list

**State Transitions:** Draft → Scheduled → Sending → Completed/PartialFailure

**Key Model:** EmailCampaign

---

## 20. Data Retention & GDPR Flows

**Phase:** 16 (Admin Core: Security & Compliance)

Documents GDPR/FERPA compliance features. User data export (Article 15) compiles all user data into downloadable JSON. Account deletion (Article 17) performs anonymization while preserving data integrity. Automated retention policies run weekly via cron to purge old data (audit logs, activity, notifications, messages, webhook deliveries). Consent management tracks user preferences for analytics, marketing, and third-party integrations.

**GDPR Features:**
- Article 15: Data export (JSON download)
- Article 17: Right to erasure (anonymization)

**Default Retention Periods:**
- Audit logs: 365 days
- User activity: 90 days
- Notifications: 30 days
- Chat messages: 180 days
- Webhook deliveries: 30 days

**Key Models:** RetentionPolicy, ConsentRecord

---

## 21. Calendar & Scheduling Flows

**Phase:** 17 (Cross-Role: Calendar, Groups & Collaboration)

Documents calendar system. Event creation supports 6 types (ASSIGNMENT_DUE, QUIZ_DUE, LECTURE, OFFICE_HOURS, PERSONAL, COURSE_EVENT) with manual and auto-sync sources. iCal subscription generates unique tokens for Google Calendar/Outlook integration. Calendar view uses FullCalendar with role-based event visibility and color coding. Upcoming deadlines widget shows next 7 days with urgency indicators.

**Event Types:**
1. ASSIGNMENT_DUE (Red)
2. QUIZ_DUE (Orange)
3. LECTURE (Blue)
4. OFFICE_HOURS (Green)
5. PERSONAL (Purple)
6. COURSE_EVENT (Teal)

**Features:**
- iCal subscription (Google Calendar/Outlook)
- Auto-sync from course data
- Upcoming deadlines widget

**Key Models:** CalendarEvent, CalendarToken

---

## 22. Groups & Collaboration Flows

**Phase:** 17 (Cross-Role: Calendar, Groups & Collaboration)

Documents course group system. Group creation with manual or auto-assignment (random/balanced distribution). Membership management with capacity limits and LEADER/MEMBER roles. Group assignment submissions create shared work visible to all members with shared grades.

**Features:**
- Manual or auto-assignment
- Capacity limits (maxMembers)
- Leader/Member roles
- Shared submissions and grades

**State Transitions:** Created → Filling → Full/Active → Working → Submitted → Graded

**Key Models:** CourseGroup, GroupMember

---

## 23. Advanced Analytics Flows

**Phase:** 18 (Cross-Role: Advanced Analytics & Charts)

Documents analytics system. Data aggregation pipeline collects from UserActivity, QuizAttempt, UserProgress, Enrollment, and AssignmentSubmission to compute metrics (enrollment trends, completion rates, grade distributions, activity heatmaps, at-risk scores). API layer includes 5-minute query caching. Recharts renders interactive visualizations (LineChart, BarChart, Histogram, Heatmap, RadarChart). At-risk detection uses multi-factor scoring.

**Metrics Computed:**
- Enrollment trends (daily/weekly/monthly)
- Completion rates (by course/chapter)
- Grade distributions (10% buckets)
- Activity heatmaps (7x24 grid)
- At-risk scores (multi-factor)

**At-Risk Factors:**
- Days since last activity (>7 days = +30 points)
- Progress vs cohort average (<50% = +25 points)
- Quiz performance trend (declining = +20 points)
- Assignment submission rate (<80% = +15 points)
- Login frequency (<2/week = +10 points)
- **At-risk threshold:** Score >= 50

**Key Components:** `src/components/charts/`

---

## 24. Webhooks & API Key Flows

**Phase:** 19 (Integrations: Webhooks & API Keys)

Documents developer integration system. Webhook registration subscribes to 7 event types with HMAC-SHA256 signed payloads. Delivery includes exponential backoff retry (1m → 5m → 30m → 2h → 24h, max 5 attempts). API key authentication uses SHA-256 hashed keys with resource-level permissions (courses:read/write, enrollments:read/write, users:read, analytics:read, webhooks:manage) and per-key rate limiting (60 req/min).

**Webhook Event Types:**
1. enrollment.created
2. course.published
3. quiz.completed
4. assignment.submitted
5. certificate.issued
6. user.created
7. grade.updated

**Webhook Security:**
- HMAC-SHA256 signatures
- Timestamp validation
- Retry with exponential backoff

**API Key Permissions:**
- courses:read / courses:write
- enrollments:read / enrollments:write
- users:read
- analytics:read
- webhooks:manage

**Rate Limiting:** 60 requests/minute per key

**Key Files:** `src/lib/webhook-dispatcher.ts`, `src/lib/api-key-auth.ts`

---

> **Note:** For detailed Mermaid flowcharts, sequence diagrams, and state diagrams, see [ARCHITECTURE_FLOWS.md](./ARCHITECTURE_FLOWS.md).
