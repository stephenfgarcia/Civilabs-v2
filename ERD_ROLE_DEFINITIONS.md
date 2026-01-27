# CiviLabs LMS - Role-Based ERD Definitions

> Quick reference guide defining each entity by role context. For Mermaid diagrams, see [ERD_ROLE_FLOWS.md](./ERD_ROLE_FLOWS.md).

---

## Table of Contents

1. [Student Data Model](#1-student-data-model)
2. [Instructor Data Model](#2-instructor-data-model)
3. [Admin Data Model](#3-admin-data-model)

---

## 1. Student Data Model

The Student Data Model encompasses all entities that students directly interact with during their learning journey. Students consume content, track progress, submit work, and engage with community features.

### Core Learning Entities

| Entity | Description |
|--------|-------------|
| **User** | The student's profile containing authentication credentials, display name, bio, and privacy settings. Students can toggle profile visibility and manage MFA settings. |
| **Enrollment** | Represents a student's registration in a course. Tracks enrollment date and completion timestamp. A student can be enrolled in multiple courses. |
| **UserProgress** | Tracks completion status for individual lessons. Created when a student first views a lesson, updated when marked complete. |
| **Certificate** | Generated upon course completion (all lessons viewed, all required quizzes passed). Contains unique verification code for public validation. |

### Content Consumption Entities

| Entity | Description |
|--------|-------------|
| **Course** | The top-level container for learning content. Students see published courses only. Contains title, description, image, and instructor reference. |
| **Chapter** | Organizational unit within a course. May have availability windows (availableFrom/Until) that restrict access. Position determines display order. |
| **Lesson** | Individual learning unit. Supports 6 content types: VIDEO, TEXT, PDF, DOCUMENT, POWERPOINT, SCENE_3D. May include duration for video content. |

### Assessment Entities

| Entity | Description |
|--------|-------------|
| **Quiz** | Assessment attached to a chapter. Students see it as either QUIZ, EXAM, or PRACTICE type. May have time limits, attempt limits, and proctoring settings. |
| **QuizAttempt** | Records each student attempt including answers, score, pass/fail status, time spent, and whether manual grading is pending. |
| **Assignment** | Work submission requirement. Supports FILE_UPLOAD, TEXT_ENTRY, URL_LINK, or MEDIA_RECORDING. Has due dates and late submission policies. |
| **AssignmentSubmission** | Student's submitted work. Tracks submission status (DRAFT, SUBMITTED, GRADED, RETURNED, LATE), grade, and instructor feedback. |

### Personal Learning Features

| Entity | Description |
|--------|-------------|
| **Bookmark** | Saves a lesson for later review. Students can add optional notes to bookmarks for context. |
| **Note** | Personal annotations on lessons. For video lessons, can include timestamp to mark specific moments. |
| **CourseReview** | Star rating (1-5) and optional review text for completed courses. Can be public or private. |

### Community Entities

| Entity | Description |
|--------|-------------|
| **ForumThread** | Discussion topic created by students in forum categories. Can be viewed, replied to, but not moderated by students. |
| **ForumReply** | Response to a forum thread. Threaded under the parent thread. |
| **Message** | Real-time chat message in a course chat room. Linked to specific ChatRoom. |
| **ChatRoom** | One-to-one relationship with Course. Container for real-time course discussions. |

### Notification & Settings Entities

| Entity | Description |
|--------|-------------|
| **Notification** | In-app notifications for events like enrollments, quiz results, certificates earned, forum replies. Includes read status and optional navigation link. |
| **NotificationPreference** | Per-user toggles for email notification categories. Controls which notifications trigger emails. |
| **ConsentRecord** | GDPR consent tracking for data processing, analytics, and marketing. Records grant/revoke timestamps. |

### Calendar & Group Entities

| Entity | Description |
|--------|-------------|
| **CalendarEvent** | Personal or course events. Students see assignment due dates, quiz availability, and personal events. Color-coded by type. |
| **CalendarToken** | Unique token for iCal subscription URL. Enables syncing events to Google Calendar or Outlook. |
| **GroupMember** | Membership in a course group. Can have LEADER or MEMBER role. Used for group assignments. |
| **CourseGroup** | Student group within a course. Has member limits. Used for collaborative work and group assignment submissions. |

### Learning Path Entities

| Entity | Description |
|--------|-------------|
| **LearningPath** | Curated sequence of courses. Students can enroll in paths to follow structured curricula. |
| **LearningPathEnrollment** | Tracks student enrollment in a learning path. Records start date and completion. |

---

## 2. Instructor Data Model

The Instructor Data Model covers all entities instructors create and manage. Instructors build courses, create assessments, grade submissions, and monitor student activity.

### Course Building Entities

| Entity | Description |
|--------|-------------|
| **User** | Instructor profile with INSTRUCTOR role. Can create courses and manage enrolled students. |
| **Course** | Main container created by instructor. Controls publication status, auto-grade sync toggle, and category assignment. |
| **Category** | Course classification. Instructors select from admin-created categories when creating courses. |
| **Chapter** | Course section created by instructor. Sets position, visibility, free preview status, and availability windows. |
| **Lesson** | Individual content unit. Instructor uploads videos, PDFs, documents, or configures 3D scenes. Sets position and availability. |

### Assessment Building Entities

| Entity | Description |
|--------|-------------|
| **Quiz** | Assessment configuration. Instructor sets assessment type (QUIZ/EXAM/PRACTICE), time limit, attempt limit, passing score, proctoring options, and shuffling behavior. |
| **Question** | Individual question within a quiz. Supports 8 types: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, MULTI_SELECT, MATCHING, ORDERING, ESSAY, FILL_IN_BLANK. Instructor sets points, explanation, and type-specific options. |
| **QuestionBank** | Reusable pool of questions per course. Instructor can create banks and link quizzes to pull random subsets. |
| **QuestionBankItem** | Links questions to question banks. Allows same question to exist in multiple banks. |

### Assignment System Entities

| Entity | Description |
|--------|-------------|
| **Assignment** | Work requirement created by instructor. Sets type, due date, points, late policy, file restrictions, and group assignment flag. |
| **AssignmentSubmission** | Student submission that instructor reviews. Contains submitted content and fields for grade, feedback, and rubric scores. |
| **SubmissionComment** | Threaded feedback comments on submissions. Instructors and students can exchange messages about the work. |
| **SubmissionAnnotation** | Inline text annotations on text submissions. Instructor highlights specific regions with feedback. |

### Rubric Entities

| Entity | Description |
|--------|-------------|
| **Rubric** | Grading rubric with criteria. Can be marked as template for reuse across courses. Created by instructor. |
| **RubricCriterion** | Individual criterion within a rubric. Contains title, description, max points, and performance levels (JSON array with label, description, points per level). |

### Gradebook Entities

| Entity | Description |
|--------|-------------|
| **GradeCategory** | Weighted grade grouping (e.g., "Assignments 40%", "Exams 60%"). Supports drop-lowest-N feature. |
| **GradeItem** | Individual gradeable item linked to assignment or assessment. Can be extra credit, hidden from students. |
| **StudentGrade** | Per-student score on a grade item. Supports manual override with reason. Computes letter grade from scale. |
| **GradingScale** | Letter grade scale with customizable thresholds. Can be course-specific or global default. |

### Scheduling & Release Entities

| Entity | Description |
|--------|-------------|
| **ReleaseCondition** | Brightspace-style content release rules. Instructor sets conditions (date, lesson completed, quiz passed, etc.) that must be met before content unlocks. |
| **CalendarEvent** | Course-wide events created by instructor. Synced from assignments, quizzes, and attendance sessions. |

### Attendance Entities

| Entity | Description |
|--------|-------------|
| **AttendanceSession** | Single class session for attendance. Has date, type (IN_PERSON/VIRTUAL/ASYNC), and optional notes. |
| **AttendanceRecord** | Per-student attendance entry. Status: PRESENT, ABSENT, LATE, EXCUSED. Recorded by instructor. |

### Announcement Entities

| Entity | Description |
|--------|-------------|
| **Announcement** | Course-wide or global announcements. Instructor sets title, content, pin status, and optional scheduled publish date. |

### Activity Monitoring Entities

| Entity | Description |
|--------|-------------|
| **UserActivity** | Telemetry events from students. Instructors view aggregated activity for at-risk detection and engagement analytics. |
| **QuizAttempt** | Student quiz attempts that instructors review. Essay/short-answer questions flagged for manual grading appear in grading queue. |
| **Enrollment** | Course enrollments visible to instructor. Used for student roster and progress monitoring. |

### Group Management Entities

| Entity | Description |
|--------|-------------|
| **CourseGroup** | Student groups created by instructor. Sets name and max member count. Used for group assignments. |
| **GroupMember** | Individual group membership. Instructor can assign LEADER role to specific students. |

### Media Entities

| Entity | Description |
|--------|-------------|
| **Media** | Media library items uploaded by instructor. Organized by type (IMAGE, VIDEO, DOCUMENT, MODEL_3D). Can be attached to courses for reuse. |
| **ChatRoom** | Course chat room. Instructor can monitor and participate in course discussions. |

---

## 3. Admin Data Model

The Admin Data Model encompasses platform-wide management entities. Admins handle user management, security configuration, compliance, integrations, and platform settings.

### User Management Entities

| Entity | Description |
|--------|-------------|
| **User** | All platform users. Admins can view, edit, change roles, and delete any user. Manages all three roles: STUDENT, INSTRUCTOR, ADMIN. |
| **Account** | OAuth provider accounts linked to users. Admins can view but not modify OAuth connections. |
| **Session** | Active user sessions. Admins can monitor session activity and force logouts if needed. |

### Audit & Compliance Entities

| Entity | Description |
|--------|-------------|
| **AuditLog** | Complete audit trail of all significant actions. Records who did what, when, from where. Over 60 action types across auth, content, grading, and admin operations. |
| **ConsentRecord** | GDPR consent records for all users. Admins can view consent status for compliance reporting. |

### Security Entities

| Entity | Description |
|--------|-------------|
| **MFAConfig** | Multi-factor authentication settings per user. Tracks enabled status, backup codes, failed attempts, and lockout status. |
| **OTPToken** | One-time password tokens for MFA verification. Stores hashed codes with expiration. |

### Platform Configuration Entities

| Entity | Description |
|--------|-------------|
| **PlatformSettings** | Singleton configuration for platform-wide settings. Controls registration, default role, maintenance mode, file upload limits, and branding. |
| **Category** | Course categories managed by admins. Used to organize and filter courses. |
| **ForumCategory** | Forum categories with icons and colors. Admins create, order, and manage forum structure. |

### Course Approval Entities

| Entity | Description |
|--------|-------------|
| **CourseApproval** | Workflow record for course review process. Tracks status (DRAFT, PENDING_REVIEW, APPROVED, REJECTED, CHANGES_REQUESTED), reviewer, and history. |
| **Course** | All platform courses. Admins can approve, reject, or request changes before publication. |

### Communication Entities

| Entity | Description |
|--------|-------------|
| **EmailCampaign** | Admin broadcast emails. Supports recipient segmentation by role, course, activity level. Can be scheduled or sent immediately. Tracks success/failure counts. |
| **Notification** | Platform-wide announcements sent as notifications. Admins can broadcast to all users. |

### Data Retention Entities

| Entity | Description |
|--------|-------------|
| **RetentionPolicy** | Per-data-type retention rules. Defines how long to keep data (audit logs, telemetry, messages) and what action to take (ARCHIVE, ANONYMIZE, DELETE). |

### Integration Entities

| Entity | Description |
|--------|-------------|
| **Webhook** | Developer webhook subscriptions. Registered for specific events with HMAC-SHA256 signing secret. Admins can view all webhooks. |
| **WebhookDelivery** | Delivery logs for webhook calls. Tracks status code, success, retry attempts, and errors. |
| **APIKey** | Developer API keys. SHA-256 hashed with resource-level permissions (COURSES, ENROLLMENTS, GRADES, USERS, ANALYTICS). Includes expiry and last-used tracking. |

### Learning Path Entities

| Entity | Description |
|--------|-------------|
| **LearningPath** | Curated course sequences. Admins create and manage learning paths that span multiple courses. |
| **LearningPathCourse** | Junction table linking courses to learning paths. Controls order of courses within the path. |

### Course Structure Entities

| Entity | Description |
|--------|-------------|
| **CoursePrerequisite** | Course dependency relationships. Admins and instructors can set which courses must be completed before enrolling in another. |

### Forum Moderation Entities

| Entity | Description |
|--------|-------------|
| **ForumThread** | Forum threads across all categories. Admins can pin, lock, or delete any thread for moderation. |

### Enrollment Overview Entities

| Entity | Description |
|--------|-------------|
| **Enrollment** | All platform enrollments. Admins access enrollment analytics, can bulk-enroll users, and view completion statistics. |

---

## Key Relationships Summary

### Student Relationships
- Student **enrolls in** courses and **tracks progress** through lessons
- Student **attempts** quizzes and **submits** assignments
- Student **creates** bookmarks, notes, and reviews
- Student **participates** in forums and chat
- Student **receives** notifications and **grants** consent

### Instructor Relationships
- Instructor **teaches** courses containing chapters and lessons
- Instructor **creates** assessments with questions from optional banks
- Instructor **assigns** work and **grades** submissions using rubrics
- Instructor **manages** gradebook categories and grade items
- Instructor **monitors** student activity and attendance

### Admin Relationships
- Admin **manages** all users and their MFA/session status
- Admin **reviews** courses through approval workflow
- Admin **broadcasts** emails and creates platform announcements
- Admin **configures** retention policies and platform settings
- Admin **oversees** webhooks and API keys for integrations

---

> **Note:** For detailed Mermaid ERD diagrams, see [ERD_ROLE_FLOWS.md](./ERD_ROLE_FLOWS.md).
