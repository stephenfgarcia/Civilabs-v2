# CiviLabs LMS - Architecture Flow Diagrams

> Comprehensive Mermaid flowcharts documenting all application flows, data paths, and system interactions.

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

---

## 1. High-Level System Architecture

### 1.1 Overall System Overview

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser["Browser (Next.js App Router)"]
        SW["Service Worker (PWA)"]
        Pusher_Client["Pusher Client (Real-time)"]
    end

    subgraph NextJS["Next.js Server Layer"]
        Pages["Server Components (Pages)"]
        API["API Routes (/api/*)"]
        Middleware["Middleware (Rate Limiting)"]
        Auth["NextAuth.js v5"]
    end

    subgraph Services["External Services"]
        Neon["Neon PostgreSQL"]
        Upstash["Upstash Redis"]
        Google["Google OAuth"]
        Resend["Resend (Email)"]
        Pusher_Server["Pusher (WebSocket)"]
        UploadThing["UploadThing (Files)"]
        Sentry["Sentry (Monitoring)"]
        Vercel["Vercel (Hosting)"]
    end

    subgraph Data["Data Layer"]
        Prisma["Prisma ORM"]
    end

    Browser --> Middleware
    Middleware --> API
    Middleware --> Pages
    Browser --> Pusher_Client
    SW --> Browser

    API --> Auth
    API --> Prisma
    Pages --> Prisma
    Pages --> Auth

    Prisma --> Neon
    Middleware --> Upstash
    Auth --> Google
    API --> Resend
    API --> Pusher_Server
    API --> UploadThing
    Pusher_Server --> Pusher_Client
    NextJS --> Sentry
    NextJS --> Vercel
```

### 1.2 Request Lifecycle

```mermaid
flowchart LR
    A[Client Request] --> B{Route Type?}
    B -->|Page| C[Server Component]
    B -->|API| D[Middleware]

    D --> E{Rate Limit Check}
    E -->|Exceeded| F[429 Response]
    E -->|OK| G{Auth Required?}

    G -->|Yes| H{Valid Session?}
    G -->|No| I[Process Request]

    H -->|Yes| J{Role Check}
    H -->|No| K[401 Unauthorized]

    J -->|Authorized| I
    J -->|Forbidden| L[403 Forbidden]

    I --> M[Database Query]
    M --> N[Response]

    C --> O{Auth Check}
    O -->|Authenticated| P[Render Page]
    O -->|Not Auth| Q[Redirect to Login]
```

---

## 2. Authentication Flows

### 2.1 Credentials Login Flow

```mermaid
sequenceDiagram
    actor User
    participant LoginPage as Login Page
    participant NextAuth as NextAuth.js
    participant DB as PostgreSQL
    participant JWT as JWT Token

    User->>LoginPage: Enter email & password
    LoginPage->>NextAuth: POST /api/auth/callback/credentials
    NextAuth->>DB: Find user by email

    alt User not found
        DB-->>NextAuth: null
        NextAuth-->>LoginPage: Return null (fail)
        LoginPage-->>User: Show error message
    else User found
        DB-->>NextAuth: User record
        NextAuth->>NextAuth: bcrypt.compare(password, hash)

        alt Password invalid
            NextAuth-->>LoginPage: Return null (fail)
            LoginPage-->>User: Show error message
        else Password valid
            NextAuth->>JWT: Create JWT {id, email, role}
            JWT-->>NextAuth: Signed token
            NextAuth-->>LoginPage: Set session cookie
            LoginPage-->>User: Redirect to dashboard
        end
    end
```

### 2.2 Google OAuth Login Flow

```mermaid
sequenceDiagram
    actor User
    participant App as CiviLabs App
    participant NextAuth as NextAuth.js
    participant Google as Google OAuth
    participant DB as PostgreSQL

    User->>App: Click "Sign in with Google"
    App->>NextAuth: GET /api/auth/signin/google
    NextAuth->>Google: Redirect to consent screen
    Google-->>User: Show consent screen
    User->>Google: Approve access
    Google->>NextAuth: Callback with auth code
    NextAuth->>Google: Exchange code for tokens
    Google-->>NextAuth: Access token + user info

    NextAuth->>DB: Check if email exists

    alt New user (no existing account)
        NextAuth->>DB: Create User + Account record
        DB-->>NextAuth: New user created
    else Existing user with no OAuth
        Note over NextAuth,DB: signIn callback handles linking
        NextAuth->>DB: Create Account record linked to user
        NextAuth->>DB: Update user image/name if empty
        DB-->>NextAuth: Account linked
    else Existing user with OAuth already linked
        DB-->>NextAuth: Existing account found
    end

    NextAuth->>NextAuth: jwt callback: inject role from DB
    NextAuth-->>App: Set session cookie
    App-->>User: Redirect to dashboard
```

### 2.3 Registration Flow

```mermaid
flowchart TD
    A[User visits /register] --> B[Fill registration form]
    B --> C{Client-side validation}
    C -->|Invalid| D[Show field errors]
    D --> B
    C -->|Valid| E[POST /api/auth/register]

    E --> F{Server validation}
    F -->|Invalid| G[Return 400 with errors]
    G --> D

    F -->|Valid| H{Email already exists?}
    H -->|Yes| I[Return 409 Conflict]
    I --> D

    H -->|No| J[Hash password with bcrypt]
    J --> K[Create User record]
    K --> L[Create Welcome notification]
    L --> M[Send Welcome email via Resend]
    M --> N[Return success]
    N --> O[Redirect to /login]
    O --> P[User signs in]
```

### 2.4 Session Management State Diagram

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> Authenticating : Login attempt
    Authenticating --> Authenticated : Success (JWT created)
    Authenticating --> Unauthenticated : Failure

    Authenticated --> TokenRefresh : JWT near expiry
    TokenRefresh --> Authenticated : Token refreshed
    TokenRefresh --> Unauthenticated : Refresh failed

    Authenticated --> Unauthenticated : Sign out
    Authenticated --> Authenticated : API request (token valid)

    state Authenticated {
        [*] --> Active
        Active --> SessionCheck : Page navigation
        SessionCheck --> Active : Valid session
        SessionCheck --> Expired : Invalid session
        Expired --> [*]
    }
```

---

## 3. User Journey Flows

### 3.1 Student Complete Journey

```mermaid
flowchart TD
    A[Register/Login] --> B[Student Dashboard]

    B --> C[Browse Courses]
    B --> D[View Enrolled Courses]
    B --> E[Community]
    B --> F[Certificates]
    B --> G[Notifications]

    C --> H[View Course Details]
    H --> I{Enrolled?}
    I -->|No| J[Click Enroll]
    J --> K[Enrollment Created]
    K --> L[Enrollment Email Sent]
    L --> D
    I -->|Yes| M[Continue Learning]

    D --> M
    M --> N[View Lesson]
    N --> O{Lesson Type}
    O -->|Video| P[Video Player]
    O -->|PDF| Q[PDF Viewer]
    O -->|Text| R[Text Content]
    O -->|3D Scene| S[3D Viewer]
    O -->|Document| T[Document Viewer]

    P & Q & R & S & T --> U[Mark Lesson Complete]
    U --> V{Chapter has Quiz?}
    V -->|Yes| W[Take Quiz]
    V -->|No| X[Next Lesson]

    W --> Y{Passed?}
    Y -->|No| Z[Review & Retry]
    Z --> W
    Y -->|Yes| X

    X --> AA{All Lessons Complete?}
    AA -->|No| N
    AA -->|Yes| AB[Generate Certificate]
    AB --> F

    E --> AC[Forums]
    E --> AD[Course Chat]

    N --> AE[Add Bookmark]
    N --> AF[Take Notes]
```

### 3.2 Instructor Complete Journey

```mermaid
flowchart TD
    A[Login as Instructor] --> B[Instructor Dashboard]

    B --> C[Create New Course]
    B --> D[Manage Existing Courses]
    B --> E[Media Library]
    B --> F[View Analytics]

    C --> G[Fill Course Details]
    G --> H[Set Title, Description, Category]
    H --> I[Upload Thumbnail]
    I --> J[Course Created]

    J --> K[Add Chapters]
    K --> L[Set Chapter Title & Order]
    L --> M[Add Lessons to Chapter]

    M --> N{Lesson Type?}
    N -->|Video| O[Upload Video]
    N -->|PDF| P[Upload PDF]
    N -->|3D Scene| Q[Configure 3D Scene]
    N -->|Text| R[Write Text Content]
    N -->|Document| S[Upload Document]

    O & P & Q & R & S --> T[Lesson Saved]

    T --> U{Add Quiz?}
    U -->|Yes| V[Create Quiz]
    V --> W[Add Questions & Options]
    W --> X[Set Passing Score]
    X --> Y[Quiz Saved]
    U -->|No| Y2[Skip Quiz]

    Y & Y2 --> Z{More Chapters?}
    Z -->|Yes| K
    Z -->|No| AA[Review Course]

    AA --> AB[Publish Course]
    AB --> AC[Students Can Enroll]

    D --> AD[Edit Course Content]
    D --> AE[View Course Analytics]
    D --> AF[Unpublish Course]

    E --> AG[Upload Media Files]
    AG --> AH[Use in Lessons]

    F --> AI[View Student Progress]
    F --> AJ[View Enrollment Stats]
    F --> AK[View Quiz Performance]
```

### 3.3 Admin Complete Journey

```mermaid
flowchart TD
    A[Login as Admin] --> B[Admin Dashboard]

    B --> C[User Management]
    B --> D[Course Management]
    B --> E[Category Management]
    B --> F[Forum Management]
    B --> G[Analytics]
    B --> H[Reports]
    B --> I[Audit Logs]

    C --> J[Search/Filter Users]
    J --> K[View User Details]
    K --> L{Action?}
    L -->|Change Role| M[Update User Role]
    L -->|Delete| N[Delete User]

    D --> O[View All Courses]
    O --> P{Action?}
    P -->|Delete| Q[Delete Course]
    P -->|View| R[View Course Details]

    E --> S[View Categories]
    S --> T{Action?}
    T -->|Create| U[New Category]
    T -->|Edit| V[Edit Category]
    T -->|Delete| W[Delete Category]

    F --> X[Manage Forum Categories]
    X --> Y[Moderate Threads]
    Y --> Z{Action?}
    Z -->|Pin| AA[Pin Thread]
    Z -->|Lock| AB[Lock Thread]
    Z -->|Delete| AC[Delete Thread]

    G --> AD[Platform Overview]
    AD --> AE[User Growth]
    AD --> AF[Enrollment Trends]
    AD --> AG[Top Courses]
    AD --> AH[Category Distribution]

    H --> AI[Generate Reports]
    I --> AJ[View System Activity]
```

---

## 4. Course Management Flows

### 4.1 Course Creation & Publishing

```mermaid
flowchart TD
    A[Instructor: Create Course] --> B[POST /api/courses]

    B --> C{Validate Input}
    C -->|Invalid| D[Return 400]
    C -->|Valid| E[Generate Slug]

    E --> F[Create Course Record]
    F --> G[Create ChatRoom for Course]
    G --> H[Return Course Object]

    H --> I[Instructor Adds Content]
    I --> J[Add Chapters]
    J --> K[Add Lessons]
    K --> L[Add Quizzes]

    L --> M{Ready to Publish?}
    M -->|No| I
    M -->|Yes| N[POST /api/courses/{id}/publish]

    N --> O{Validation}
    O -->|Has chapters?| P{Has lessons?}
    O -->|No chapters| Q[Return Error]
    P -->|Yes| R[Set isPublished = true]
    P -->|No lessons| Q

    R --> S[Notify Enrolled Students]
    S --> T[Course Live]
```

### 4.2 Course Content Structure

```mermaid
graph TD
    subgraph Course
        A[Course]
        A --> B1[Chapter 1]
        A --> B2[Chapter 2]
        A --> B3[Chapter N]
    end

    subgraph "Chapter Structure"
        B1 --> C1[Lesson 1: Video]
        B1 --> C2[Lesson 2: PDF]
        B1 --> C3[Lesson 3: 3D Scene]
        B1 --> C4[Lesson 4: Text]
        B1 --> D1[Quiz]
    end

    subgraph "Quiz Structure"
        D1 --> E1[Question 1]
        D1 --> E2[Question 2]
        D1 --> E3[Question N]
        E1 --> F1[Option A]
        E1 --> F2[Option B]
        E1 --> F3[Option C]
        E1 --> F4[Option D]
    end

    subgraph "Course Metadata"
        A --> G1[Category]
        A --> G2[Instructor]
        A --> G3[Thumbnail]
        A --> G4[Prerequisites]
        A --> G5[Reviews]
        A --> G6[ChatRoom]
    end
```

### 4.3 Course State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft : Course Created

    Draft --> Draft : Add/Edit Content
    Draft --> ReadyToPublish : Content Complete
    ReadyToPublish --> Published : Publish Action
    Published --> Draft : Unpublish
    Published --> Published : Edit Content

    state Draft {
        [*] --> NoContent
        NoContent --> HasChapters : Add Chapter
        HasChapters --> HasLessons : Add Lessons
        HasLessons --> HasQuizzes : Add Quiz (optional)
        HasQuizzes --> ContentComplete : All sections ready
        HasLessons --> ContentComplete : No quiz needed
    }

    Published --> Deleted : Delete (Admin/Instructor)
    Draft --> Deleted : Delete
    Deleted --> [*]
```

---

## 5. Learning & Progress Flows

### 5.1 Lesson Viewing & Progress Tracking

```mermaid
sequenceDiagram
    actor Student
    participant Page as Lesson Page
    participant API as Progress API
    participant DB as Database
    participant Notify as Notifications

    Student->>Page: Open lesson
    Page->>DB: Fetch lesson content
    DB-->>Page: Lesson data + progress status

    alt Lesson not completed
        Page-->>Student: Show lesson content
        Student->>Page: Complete lesson (watch/read)
        Page->>API: POST /api/progress {lessonId, isCompleted: true}
        API->>DB: Upsert UserProgress record
        DB-->>API: Progress saved
        API-->>Page: Success

        Page->>API: GET /api/progress?courseId=X
        API->>DB: Count completed lessons
        DB-->>API: {total, completed, percentage}
        API-->>Page: Progress update
        Page-->>Student: Show updated progress bar
    else Lesson already completed
        Page-->>Student: Show lesson (marked complete)
    end

    alt All lessons in course complete
        Page-->>Student: Show "Generate Certificate" button
    end
```

### 5.2 Course Progress State

```mermaid
stateDiagram-v2
    [*] --> NotEnrolled

    NotEnrolled --> Enrolled : Enroll in Course

    state Enrolled {
        [*] --> InProgress
        InProgress --> InProgress : Complete Lesson
        InProgress --> QuizPending : All lessons done, quiz remains
        QuizPending --> QuizPassed : Pass quiz
        QuizPending --> QuizFailed : Fail quiz
        QuizFailed --> QuizPending : Retry quiz
        QuizPassed --> CourseComplete : All requirements met
        InProgress --> CourseComplete : No quiz required + all lessons done
    }

    CourseComplete --> CertificateEarned : Generate Certificate
```

### 5.3 Enrollment Flow

```mermaid
flowchart TD
    A[Student views Course] --> B{Already enrolled?}
    B -->|Yes| C[Show "Continue Learning"]
    B -->|No| D[Show "Enroll" button]

    D --> E[Click Enroll]
    E --> F[POST /api/enrollments]

    F --> G{Course published?}
    G -->|No| H[Return 404]
    G -->|Yes| I{Already enrolled?}
    I -->|Yes| J[Return 409 Conflict]
    I -->|No| K[Create Enrollment]

    K --> L[Send Enrollment Email]
    L --> M[Create Notification for Instructor]
    M --> N[Return Enrollment Object]
    N --> O[Redirect to Course Learning Page]
```

---

## 6. Quiz & Assessment Flows

### 6.1 Quiz Attempt Flow

```mermaid
sequenceDiagram
    actor Student
    participant QuizUI as Quiz Player
    participant API as Quiz API
    participant DB as Database
    participant Notify as Notifications

    Student->>QuizUI: Start quiz
    QuizUI->>API: GET /api/courses/{id}/chapters/{id}/quiz
    API->>DB: Fetch quiz + questions
    DB-->>API: Quiz data with questions
    API-->>QuizUI: Quiz configuration

    QuizUI-->>Student: Display questions one by one

    Student->>QuizUI: Submit answers
    QuizUI->>API: POST .../quiz/attempt {answers: [...]}

    API->>API: Calculate score
    Note over API: Compare each answer to correctOptionIndex
    API->>API: Check score >= passingScore

    alt Score >= Passing
        API->>DB: Create QuizAttempt (passed: true)
        API->>Notify: notifyQuizResult (QUIZ_PASSED)
        API-->>QuizUI: {passed: true, score, totalQuestions}
        QuizUI-->>Student: Show success + score
    else Score < Passing
        API->>DB: Create QuizAttempt (passed: false)
        API->>Notify: notifyQuizResult (QUIZ_FAILED)
        API-->>QuizUI: {passed: false, score, totalQuestions}
        QuizUI-->>Student: Show failure + allow retry
    end
```

### 6.2 Quiz Builder Flow (Instructor)

```mermaid
flowchart TD
    A[Instructor: Edit Chapter] --> B[Open Quiz Builder]
    B --> C{Quiz exists?}
    C -->|No| D[Create New Quiz]
    C -->|Yes| E[Edit Existing Quiz]

    D --> F[Set Quiz Title]
    F --> G[Set Passing Score %]
    G --> H[Add Question]

    H --> I[Write Question Text]
    I --> J[Add Options A, B, C, D]
    J --> K[Select Correct Answer]
    K --> L{More questions?}
    L -->|Yes| H
    L -->|No| M[Save Quiz]

    E --> N[Modify Questions]
    N --> O[Update Passing Score]
    O --> M

    M --> P[POST/PUT /api/.../quiz]
    P --> Q[Quiz Saved to DB]
```

---

## 7. Certificate Flows

### 7.1 Certificate Generation

```mermaid
flowchart TD
    A[Student: All lessons complete] --> B[Click "Generate Certificate"]
    B --> C[POST /api/certificates]

    C --> D{Validation Checks}
    D --> E{User enrolled?}
    E -->|No| F[Return 403]
    E -->|Yes| G{All lessons completed?}
    G -->|No| H[Return 400: Incomplete]
    G -->|Yes| I{All quizzes passed?}
    I -->|No| J[Return 400: Quiz not passed]
    I -->|Yes| K{Certificate exists?}
    K -->|Yes| L[Return existing certificate]
    K -->|No| M[Generate unique code]

    M --> N[Create Certificate record]
    N --> O[Update Enrollment completedAt]
    O --> P[Create CERTIFICATE_EARNED notification]
    P --> Q[Send certificate email via Resend]
    Q --> R[Return certificate data]
    R --> S[Show certificate to student]
```

### 7.2 Certificate Verification

```mermaid
sequenceDiagram
    actor Verifier
    participant Page as /certificates/{code}
    participant API as Verify API
    participant DB as Database

    Verifier->>Page: Visit certificate URL
    Page->>API: GET /api/certificates/verify/{code}
    API->>DB: Find certificate by code

    alt Certificate found
        DB-->>API: Certificate + User + Course data
        API-->>Page: Certificate details
        Page-->>Verifier: Display verified certificate
        Note over Page: Shows: Student name, Course title,<br/>Issue date, Verification code
        Verifier->>Page: Click "Download PDF"
        Page-->>Verifier: Generate & download PDF
    else Certificate not found
        DB-->>API: null
        API-->>Page: 404 Not Found
        Page-->>Verifier: "Certificate not found"
    end
```

---

## 8. Community Flows (Forums & Chat)

### 8.1 Forum Thread Lifecycle

```mermaid
flowchart TD
    A[User: Visit Forums] --> B[GET /api/forums]
    B --> C[Display Categories]
    C --> D[Select Category]
    D --> E[View Threads in Category]

    E --> F{Action?}
    F -->|Read| G[Open Thread]
    F -->|Create| H[New Thread Dialog]

    G --> I[View Thread + Replies]
    I --> J{Reply?}
    J -->|Yes| K[Write Reply]
    K --> L[POST .../replies]
    L --> M[Notify Thread Author]
    M --> I

    H --> N[Write Title & Content]
    N --> O[POST .../threads]
    O --> P[Thread Created]
    P --> E

    subgraph "Admin Actions"
        I --> Q{Admin?}
        Q -->|Yes| R[Pin Thread]
        Q -->|Yes| S[Lock Thread]
        Q -->|Yes| T[Delete Thread]
    end
```

### 8.2 Real-Time Chat Flow

```mermaid
sequenceDiagram
    actor Student
    participant ChatUI as Chat Component
    participant API as Chat API
    participant Pusher as Pusher Server
    participant DB as Database
    actor OtherStudents as Other Students

    Student->>ChatUI: Open course chat room
    ChatUI->>API: GET /api/chat/{roomId}/messages
    API->>DB: Fetch recent messages
    DB-->>API: Message history
    API-->>ChatUI: Display messages

    ChatUI->>Pusher: Subscribe to channel
    Note over ChatUI,Pusher: pusher-js client connects

    Student->>ChatUI: Type message
    ChatUI->>API: POST /api/chat/{roomId}/messages
    API->>DB: Save message
    API->>Pusher: Trigger 'new-message' event
    Pusher-->>ChatUI: Receive own message
    Pusher-->>OtherStudents: Broadcast message

    OtherStudents->>OtherStudents: Display new message in UI
```

### 8.3 Chat Room State

```mermaid
stateDiagram-v2
    [*] --> Disconnected

    Disconnected --> Connecting : Open chat room
    Connecting --> Connected : Pusher authenticated
    Connecting --> Error : Auth failed

    Connected --> Receiving : New message event
    Receiving --> Connected : Message displayed

    Connected --> Sending : User sends message
    Sending --> Connected : Message saved & broadcast
    Sending --> Error : Send failed

    Connected --> Disconnected : Leave room
    Error --> Connecting : Retry
```

---

## 9. Admin Flows

### 9.1 User Management Flow

```mermaid
flowchart TD
    A[Admin Dashboard] --> B[User Management]
    B --> C[GET /api/admin/users]
    C --> D[Display User List]

    D --> E{Search/Filter}
    E --> F[Filter by Role]
    E --> G[Search by Name/Email]
    F & G --> C

    D --> H[Select User]
    H --> I[View User Details]
    I --> J{Action?}

    J -->|Change Role| K[Select New Role]
    K --> L[PUT /api/admin/users/{id}]
    L --> M[Role Updated]
    M --> N[Audit Log Created]

    J -->|Delete User| O[Confirm Deletion]
    O --> P[DELETE /api/admin/users/{id}]
    P --> Q[User + Related Data Deleted]
    Q --> N

    J -->|View Details| R[Show Enrollments]
    R --> S[Show Certificates]
    S --> T[Show Activity]
```

### 9.2 Platform Analytics Flow

```mermaid
flowchart TD
    A[Admin: Analytics Page] --> B[GET /api/admin/analytics]

    B --> C{Query Type}
    C -->|overview| D[Platform Metrics]
    C -->|trends| E[Enrollment Trends]
    C -->|top-courses| F[Top Courses]
    C -->|categories| G[Category Distribution]

    D --> H[Total Users]
    D --> I[Total Courses]
    D --> J[Total Enrollments]
    D --> K[Completion Rate]
    D --> L[Active Users 30d]

    E --> M[Daily Enrollments Chart]
    F --> N[Courses by Enrollment Count]
    G --> O[Category Pie Chart]

    H & I & J & K & L & M & N & O --> P[Render Dashboard]
```

---

## 10. API Sequence Diagrams

### 10.1 Course Enrollment Sequence

```mermaid
sequenceDiagram
    actor Student
    participant UI as Course Page
    participant API as Enrollment API
    participant Auth as Auth Middleware
    participant DB as Database
    participant Email as Resend
    participant Notify as Notifications

    Student->>UI: Click "Enroll"
    UI->>API: POST /api/enrollments {courseId}
    API->>Auth: Verify session
    Auth-->>API: {userId, role: STUDENT}

    API->>DB: Check course exists & published
    DB-->>API: Course data

    API->>DB: Check existing enrollment
    DB-->>API: No existing enrollment

    API->>DB: Create Enrollment record
    DB-->>API: Enrollment created

    par Send notifications
        API->>Email: sendEnrollmentEmail(student, course)
        API->>Notify: notifyEnrollment(instructor, student, course)
    end

    API-->>UI: 201 {enrollment}
    UI-->>Student: "Successfully enrolled!"
```

### 10.2 Lesson Content Delivery Sequence

```mermaid
sequenceDiagram
    actor Student
    participant UI as Lesson Viewer
    participant API as Lesson API
    participant DB as Database
    participant CDN as UploadThing CDN

    Student->>UI: Navigate to lesson
    UI->>API: GET /api/courses/{id}/chapters/{id}/lessons/{id}
    API->>DB: Fetch lesson with enrollment check
    DB-->>API: Lesson data

    alt Video Lesson
        API-->>UI: {type: VIDEO, videoUrl}
        UI->>CDN: Stream video
        CDN-->>UI: Video stream
    else PDF Lesson
        API-->>UI: {type: PDF, attachmentUrl}
        UI->>CDN: Fetch PDF
        CDN-->>UI: PDF document
    else 3D Scene
        API-->>UI: {type: SCENE_3D, sceneConfig}
        UI->>UI: Initialize Three.js scene
        UI->>CDN: Load 3D models from URLs
        CDN-->>UI: GLB/GLTF models
    else Text Lesson
        API-->>UI: {type: TEXT, content}
        UI-->>Student: Render markdown/HTML
    end

    Student->>UI: Mark as complete
    UI->>API: POST /api/progress
    API->>DB: Upsert UserProgress
    DB-->>API: Saved
    API-->>UI: {completed: true}
```

### 10.3 Rate Limiting Sequence

```mermaid
sequenceDiagram
    actor Client
    participant MW as Middleware
    participant Redis as Upstash Redis
    participant API as API Route

    Client->>MW: API Request
    MW->>MW: Extract IP (x-forwarded-for / x-real-ip)
    MW->>MW: Determine limiter (auth vs general)

    MW->>Redis: ratelimit.limit(ip)

    alt Rate limit OK
        Redis-->>MW: {success: true, remaining: 95}
        MW->>API: Forward request
        API-->>MW: Response
        MW->>MW: Add X-RateLimit headers
        MW-->>Client: Response with headers
    else Rate limit exceeded
        Redis-->>MW: {success: false, reset: timestamp}
        MW-->>Client: 429 Too Many Requests
        Note over Client: Retry-After header included
    end
```

---

## 11. Data Flow Diagrams

### 11.1 Complete Data Flow

```mermaid
flowchart TD
    subgraph Input["Data Input Sources"]
        A1[User Registration Form]
        A2[Course Creation Form]
        A3[Lesson Content Upload]
        A4[Quiz Answers]
        A5[Chat Messages]
        A6[Forum Posts]
    end

    subgraph Validation["Validation Layer"]
        B1[Zod Schema Validation]
        B2[Auth Session Check]
        B3[Role Permission Check]
    end

    subgraph Processing["Processing Layer"]
        C1[Password Hashing - bcrypt]
        C2[Slug Generation]
        C3[Score Calculation]
        C4[Certificate Code Gen]
        C5[File Upload Processing]
    end

    subgraph Storage["Data Storage"]
        D1[(PostgreSQL - Neon)]
        D2[(Redis - Upstash)]
        D3[(UploadThing - Files)]
    end

    subgraph Output["Data Output"]
        E1[Server-rendered Pages]
        E2[API JSON Responses]
        E3[Email Notifications]
        E4[Real-time Events]
        E5[PDF Certificates]
    end

    A1 & A2 & A3 & A4 & A5 & A6 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> C1 & C2 & C3 & C4 & C5
    C1 & C2 & C3 & C4 --> D1
    C5 --> D3
    D2 --> B3
    D1 --> E1 & E2
    D3 --> E1
    D1 --> E3
    D1 --> E4
    D1 --> E5
```

### 11.2 Database Relationship Map

```mermaid
erDiagram
    User ||--o{ Account : "has OAuth"
    User ||--o{ Enrollment : "enrolls in"
    User ||--o{ Course : "teaches"
    User ||--o{ UserProgress : "tracks"
    User ||--o{ QuizAttempt : "attempts"
    User ||--o{ Certificate : "earns"
    User ||--o{ Notification : "receives"
    User ||--o{ Bookmark : "saves"
    User ||--o{ Note : "writes"
    User ||--o{ CourseReview : "reviews"
    User ||--o{ ForumThread : "creates"
    User ||--o{ ForumReply : "posts"
    User ||--o{ Message : "sends"
    User ||--o{ Media : "uploads"
    User ||--o{ AuditLog : "generates"

    Course ||--o{ Chapter : "contains"
    Course ||--o{ Enrollment : "has"
    Course ||--o{ CourseReview : "receives"
    Course ||--o{ ChatRoom : "has"
    Course }o--|| Category : "belongs to"
    Course ||--o{ CoursePrerequisite : "requires"

    Chapter ||--o{ Lesson : "contains"
    Chapter ||--o| Quiz : "has"

    Quiz ||--o{ Question : "contains"
    Quiz ||--o{ QuizAttempt : "receives"

    Lesson ||--o{ UserProgress : "tracked by"
    Lesson ||--o{ Bookmark : "bookmarked in"
    Lesson ||--o{ Note : "noted in"

    ChatRoom ||--o{ Message : "contains"

    ForumCategory ||--o{ ForumThread : "contains"
    ForumThread ||--o{ ForumReply : "has"

    LearningPath ||--o{ LearningPathCourse : "contains"
    LearningPath ||--o{ LearningPathEnrollment : "has"

    User {
        string id PK
        string email UK
        string name
        string password
        UserRole role
        string image
        string bio
        datetime emailVerified
    }

    Course {
        string id PK
        string title
        string slug UK
        string description
        string imageUrl
        boolean isPublished
        string instructorId FK
        string categoryId FK
    }

    Enrollment {
        string id PK
        string userId FK
        string courseId FK
        datetime completedAt
    }

    Certificate {
        string id PK
        string code UK
        string userId FK
        string courseId FK
        datetime issuedAt
    }
```

### 11.3 Email Notification Data Flow

```mermaid
flowchart LR
    subgraph Triggers["Email Triggers"]
        A[User Registers]
        B[Student Enrolls]
        C[Certificate Earned]
    end

    subgraph EmailService["Email Service (Resend)"]
        D[sendWelcomeEmail]
        E[sendEnrollmentEmail]
        F[sendCertificateEmail]
    end

    subgraph Templates["Email Content"]
        G[Welcome Message + Getting Started]
        H[Course Name + Start Learning Link]
        I[Certificate Link + Verification Code]
    end

    A --> D --> G
    B --> E --> H
    C --> F --> I

    G & H & I --> J[Resend API]
    J --> K[User Inbox]
```

---

## 12. Role-Based Access Control

### 12.1 RBAC Overview

```mermaid
flowchart TD
    subgraph Roles["User Roles"]
        Student[STUDENT]
        Instructor[INSTRUCTOR]
        Admin[ADMIN]
    end

    subgraph StudentAccess["Student Permissions"]
        S1[Browse Published Courses]
        S2[Enroll in Courses]
        S3[View Lessons]
        S4[Take Quizzes]
        S5[Track Progress]
        S6[Generate Certificates]
        S7[Post in Forums]
        S8[Use Course Chat]
        S9[Bookmarks & Notes]
        S10[Write Reviews]
    end

    subgraph InstructorAccess["Instructor Permissions"]
        I1[Create Courses]
        I2[Edit Own Courses]
        I3[Create Chapters & Lessons]
        I4[Create Quizzes]
        I5[Publish/Unpublish Courses]
        I6[Upload Media]
        I7[View Course Analytics]
        I8[Access Media Library]
    end

    subgraph AdminAccess["Admin Permissions"]
        A1[Manage All Users]
        A2[Change User Roles]
        A3[Delete Users/Courses]
        A4[Manage Categories]
        A5[Manage Forum Categories]
        A6[Moderate Forums]
        A7[View Platform Analytics]
        A8[Generate Reports]
        A9[View Audit Logs]
    end

    Student --> StudentAccess
    Instructor --> StudentAccess
    Instructor --> InstructorAccess
    Admin --> StudentAccess
    Admin --> InstructorAccess
    Admin --> AdminAccess
```

### 12.2 Route Protection Matrix

```mermaid
flowchart TD
    A[Incoming Request] --> B{Authenticated?}
    B -->|No| C{Public Route?}
    C -->|Yes| D[Allow Access]
    C -->|No| E[Redirect to /login]

    B -->|Yes| F{Route Type?}

    F -->|/student/*| G{Role = STUDENT?}
    G -->|Yes| D
    G -->|No| H{Role = INSTRUCTOR or ADMIN?}
    H -->|Yes| D
    H -->|No| I[Redirect to Dashboard]

    F -->|/instructor/*| J{Role = INSTRUCTOR?}
    J -->|Yes| D
    J -->|No| K{Role = ADMIN?}
    K -->|Yes| D
    K -->|No| I

    F -->|/admin/*| L{Role = ADMIN?}
    L -->|Yes| D
    L -->|No| I

    F -->|/courses, /forums, /chat| D
```

### 12.3 API Authorization Flow

```mermaid
sequenceDiagram
    actor User
    participant API as API Route
    participant Auth as auth()
    participant DB as Database

    User->>API: Request with session cookie
    API->>Auth: const session = await auth()

    alt No session
        Auth-->>API: null
        API-->>User: 401 Unauthorized
    else Has session
        Auth-->>API: {user: {id, email, role}}

        API->>API: Check role permissions

        alt Insufficient role
            API-->>User: 403 Forbidden
        else Authorized
            API->>DB: Execute query

            alt Resource ownership check
                API->>API: Verify user owns resource
                Note over API: e.g., instructor owns course
            end

            DB-->>API: Data
            API-->>User: 200 OK + Data
        end
    end
```

---

## 13. State Diagrams

### 13.1 Course Lifecycle States

```mermaid
stateDiagram-v2
    [*] --> Created : Instructor creates course

    Created --> HasChapters : Add chapters
    HasChapters --> HasContent : Add lessons/quizzes
    HasContent --> Published : Publish

    Published --> HasEnrollments : Students enroll
    HasEnrollments --> Active : Students learning
    Active --> Active : New enrollments

    Published --> Unpublished : Instructor unpublishes
    Unpublished --> Published : Re-publish

    Created --> Deleted : Delete (no enrollments)
    HasChapters --> Deleted : Delete
    HasContent --> Deleted : Delete
    Published --> Deleted : Admin force delete
    Deleted --> [*]
```

### 13.2 Student Enrollment Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Browsing : Student views course catalog

    Browsing --> ViewingCourse : Select course
    ViewingCourse --> Browsing : Back to catalog
    ViewingCourse --> Enrolled : Click Enroll

    Enrolled --> Learning : Start first lesson

    state Learning {
        [*] --> ViewingLesson
        ViewingLesson --> LessonCompleted : Mark complete
        LessonCompleted --> ViewingLesson : Next lesson
        LessonCompleted --> TakingQuiz : Chapter quiz available
        TakingQuiz --> QuizPassed : Score >= passing
        TakingQuiz --> QuizFailed : Score < passing
        QuizFailed --> TakingQuiz : Retry
        QuizPassed --> ViewingLesson : Next chapter
        QuizPassed --> AllComplete : Last chapter done
    }

    AllComplete --> Certified : Generate certificate
    Certified --> [*]
```

### 13.3 Notification States

```mermaid
stateDiagram-v2
    [*] --> Created : Event triggers notification

    Created --> Unread : Stored in DB
    Unread --> Read : User clicks notification
    Read --> [*]

    state "Notification Types" as Types {
        [*] --> WELCOME
        [*] --> ENROLLMENT
        [*] --> COURSE_PUBLISHED
        [*] --> CERTIFICATE_EARNED
        [*] --> QUIZ_PASSED
        [*] --> QUIZ_FAILED
        [*] --> FORUM_REPLY
        [*] --> COURSE_UPDATE
        [*] --> ANNOUNCEMENT
    }
```

### 13.4 Quiz Attempt States

```mermaid
stateDiagram-v2
    [*] --> NotAttempted

    NotAttempted --> InProgress : Start quiz

    state InProgress {
        [*] --> Question1
        Question1 --> Question2 : Answer
        Question2 --> QuestionN : Answer
        QuestionN --> Submitted : Submit all
    }

    Submitted --> Scoring : Calculate score
    Scoring --> Passed : score >= passingScore
    Scoring --> Failed : score < passingScore

    Failed --> InProgress : Retry
    Passed --> [*] : Quiz complete

    state "Attempt Record" as Record {
        Score : Numeric score
        Answers : JSON answer array
        Timestamp : Attempt time
    }
```

---

## 14. 3D Scene Flows

### 14.1 3D Scene Creation Flow

```mermaid
flowchart TD
    A[Instructor: Create 3D Lesson] --> B[Open Scene Editor]

    B --> C[Configure Camera]
    C --> D{Camera Type}
    D -->|Perspective| E[Set FOV, Near, Far]
    D -->|Orthographic| F[Set Zoom, Near, Far]

    E & F --> G[Configure Controls]
    G --> H{Control Type}
    H -->|Orbit| I[Set target, speeds, limits]
    H -->|Fly| J[Set speed, dampening]
    H -->|First Person| K[Set height, speed]

    I & J & K --> L[Configure Environment]
    L --> M[Set Background/Preset]
    M --> N[Configure Fog/Ground]

    N --> O[Add Scene Objects]
    O --> P{Object Type}
    P -->|3D Model| Q[Upload GLB/GLTF/OBJ/FBX]
    P -->|Primitive| R[Select Shape]
    P -->|Light| S[Configure Light]
    P -->|Annotation| T[Add Hotspot]

    Q --> U[Set Transform: position, rotation, scale]
    R --> V[Set Material: color, metalness, roughness]
    S --> W[Set intensity, color, shadows]
    T --> X[Set label, description, camera position]

    U & V & W & X --> Y{More objects?}
    Y -->|Yes| O
    Y -->|No| Z[Save SceneConfig as JSON]
    Z --> AA[Lesson Saved]
```

### 14.2 3D Scene Rendering Flow

```mermaid
flowchart TD
    A[Student Opens 3D Lesson] --> B[Load SceneConfig JSON]
    B --> C[Initialize Three.js Canvas]

    C --> D[Setup Camera]
    D --> E[Setup Controls]
    E --> F[Setup Environment]

    F --> G[Load Scene Objects]
    G --> H{For each object}

    H -->|Model| I[ModelLoader: fetch GLB/GLTF]
    H -->|Primitive| J[PrimitiveObject: create geometry]
    H -->|Light| K[SceneLights: create light]
    H -->|Annotation| L[Annotations: create hotspot]

    I --> M[Apply transforms]
    J --> N[Apply materials]
    K --> O[Apply shadow settings]
    L --> P[Position in 3D space]

    M & N & O & P --> Q[Render Loop]
    Q --> R[User Interaction]
    R --> S{Action}
    S -->|Orbit/Pan/Zoom| T[Update camera]
    S -->|Click Annotation| U[Animate to position]
    S -->|Click Object| V[Show info panel]
    T & U & V --> Q
```

### 14.3 3D Object Hierarchy

```mermaid
graph TD
    subgraph SceneConfig
        A[Scene Root]
        A --> B[Camera Config]
        A --> C[Controls Config]
        A --> D[Environment Config]
        A --> E[Objects Array]
    end

    subgraph Objects
        E --> F[Object 1: Model]
        E --> G[Object 2: Primitive]
        E --> H[Object 3: Light]
        E --> I[Object 4: Annotation]
        E --> J[Object 5: Group]
        J --> K[Child Object 1]
        J --> L[Child Object 2]
    end

    subgraph ObjectProperties
        F --> M[Transform]
        F --> N[ModelConfig: url, format, animations]
        G --> O[Transform]
        G --> P[PrimitiveConfig: type, dimensions]
        G --> Q[Material: color, metalness, roughness]
        H --> R[LightConfig: type, intensity, shadows]
        I --> S[AnnotationConfig: label, cameraPosition]
    end
```

---

## 15. Notification System

### 15.1 Notification Trigger Map

```mermaid
flowchart TD
    subgraph Events["Trigger Events"]
        E1[User Registers]
        E2[Student Enrolls]
        E3[Course Published]
        E4[Quiz Passed]
        E5[Quiz Failed]
        E6[Certificate Earned]
        E7[Forum Reply]
        E8[Course Updated]
        E9[Admin Announcement]
    end

    subgraph NotifyService["Notification Service"]
        N1[notifyWelcome]
        N2[notifyEnrollment]
        N3[notifyCoursePublished]
        N4[notifyQuizResult - Pass]
        N5[notifyQuizResult - Fail]
        N6[notifyCertificateEarned]
        N7[notifyForumReply]
        N8[notifyCourseUpdate]
        N9[notifyAnnouncement]
    end

    subgraph Recipients["Recipients"]
        R1[New User]
        R2[Course Instructor]
        R3[Enrolled Students]
        R4[Quiz Taker]
        R5[Certificate Earner]
        R6[Thread Author]
        R7[All Users]
    end

    E1 --> N1 --> R1
    E2 --> N2 --> R2
    E3 --> N3 --> R3
    E4 --> N4 --> R4
    E5 --> N5 --> R4
    E6 --> N6 --> R5
    E7 --> N7 --> R6
    E8 --> N8 --> R3
    E9 --> N9 --> R7
```

### 15.2 Notification Delivery Flow

```mermaid
sequenceDiagram
    participant Event as System Event
    participant Service as Notification Service
    participant DB as Database
    participant Bell as Notification Bell
    participant User as User

    Event->>Service: Trigger notification
    Service->>DB: Create Notification record
    Note over DB: {type, title, message, link, userId, isRead: false}
    DB-->>Service: Notification created

    User->>Bell: View notification count
    Bell->>DB: getUnreadCount(userId)
    DB-->>Bell: count: 3
    Bell-->>User: Show badge "3"

    User->>Bell: Click bell icon
    Bell->>DB: GET /api/notifications
    DB-->>Bell: Notification list
    Bell-->>User: Display notifications

    User->>Bell: Click notification
    Bell->>DB: POST /api/notifications/{id} (mark read)
    DB-->>Bell: Updated
    Bell-->>User: Navigate to link
```

---

## 16. Media & Upload Flows

### 16.1 File Upload Flow

```mermaid
flowchart TD
    A[User: Select File] --> B{File Type?}

    B -->|Image| C[Image Upload Component]
    B -->|Video| D[Video Upload Component]
    B -->|Document| E[File Upload Component]
    B -->|3D Model| F[Model Upload Component]

    C & D & E & F --> G[UploadThing Client]
    G --> H[POST /api/uploadthing]
    H --> I[UploadThing Server]
    I --> J{Validate}
    J -->|Size OK| K{Type OK}
    J -->|Too large| L[Return Error]
    K -->|Valid| M[Upload to CDN]
    K -->|Invalid type| L

    M --> N[Return URL]
    N --> O[Save URL to Database]
    O --> P{Context?}
    P -->|Course thumbnail| Q[Update Course.imageUrl]
    P -->|Lesson video| R[Update Lesson.videoUrl]
    P -->|Lesson attachment| S[Update Lesson.attachmentUrl]
    P -->|3D Model| T[Store in SceneConfig]
    P -->|Media library| U[Create Media record]
```

### 16.2 Media Library Flow

```mermaid
flowchart TD
    A[Instructor: Media Library] --> B[GET /api/media]
    B --> C[Display Media Grid]

    C --> D{Action?}
    D -->|Upload| E[Select File]
    E --> F[Upload via UploadThing]
    F --> G[POST /api/media]
    G --> H[Create Media Record]
    H --> C

    D -->|Delete| I[Confirm Delete]
    I --> J[DELETE /api/media/{id}]
    J --> K[Remove from DB]
    K --> C

    D -->|Use in Lesson| L[Copy URL]
    L --> M[Paste in Lesson Editor]

    subgraph MediaTypes["Supported Types"]
        T1[IMAGE: jpg, png, gif, webp]
        T2[VIDEO: mp4, webm, mov]
        T3[DOCUMENT: pdf, doc, ppt]
        T4[MODEL_3D: glb, gltf, obj, fbx]
        T5[OTHER: zip, etc.]
    end
```

---

## Appendix: Technology Stack

```mermaid
graph LR
    subgraph Frontend
        Next["Next.js 14 (App Router)"]
        React["React 18"]
        TW["Tailwind CSS"]
        Shadcn["shadcn/ui"]
        Three["Three.js / R3F"]
        Pusher_JS["Pusher.js"]
    end

    subgraph Backend
        NextAPI["Next.js API Routes"]
        NextAuth["NextAuth.js v5"]
        Prisma_ORM["Prisma ORM"]
        Zod["Zod Validation"]
        Bcrypt["bcryptjs"]
    end

    subgraph Infrastructure
        Vercel_Host["Vercel (Hosting)"]
        Neon_DB["Neon (PostgreSQL)"]
        Upstash_Redis["Upstash (Redis)"]
        Pusher_Srv["Pusher (WebSocket)"]
        Resend_Email["Resend (Email)"]
        UT["UploadThing (Files)"]
        Sentry_Mon["Sentry (Monitoring)"]
    end

    Frontend --> Backend
    Backend --> Infrastructure
```

---

> **Note:** All diagrams use Mermaid syntax and render natively in GitHub, VS Code (with Mermaid extension), and most modern markdown viewers.
