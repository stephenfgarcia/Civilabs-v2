# CiviLabs LMS - Role-Based Entity Relationship Diagrams

> Comprehensive ERD documentation organized by user role. For definitions and context, see [ERD_ROLE_DEFINITIONS.md](./ERD_ROLE_DEFINITIONS.md).

---

## Table of Contents

1. [Student Data Model](#1-student-data-model)
2. [Instructor Data Model](#2-instructor-data-model)
3. [Admin Data Model](#3-admin-data-model)

---

## 1. Student Data Model

This section shows all entities that students directly interact with during their learning journey.

```mermaid
erDiagram
    User {
        String id PK
        String name
        String email UK
        DateTime emailVerified
        String image
        String password
        UserRole role
        String bio
        Boolean profileVisibility
        Boolean mfaEnabled
        DateTime consentAcceptedAt
        DateTime createdAt
        DateTime updatedAt
    }

    Course {
        String id PK
        String title
        String slug UK
        String description
        String imageUrl
        Boolean isPublished
        String instructorId FK
        String categoryId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Chapter {
        String id PK
        String title
        String description
        Int position
        Boolean isPublished
        Boolean isFree
        String courseId FK
        DateTime availableFrom
        DateTime availableUntil
        DateTime createdAt
        DateTime updatedAt
    }

    Lesson {
        String id PK
        String title
        String description
        LessonType type
        String content
        String videoUrl
        String attachmentUrl
        Json sceneConfig
        Int position
        Int duration
        String chapterId FK
        DateTime availableFrom
        DateTime availableUntil
        DateTime createdAt
        DateTime updatedAt
    }

    Enrollment {
        String id PK
        String userId FK
        String courseId FK
        DateTime completedAt
        DateTime createdAt
        DateTime updatedAt
    }

    UserProgress {
        String id PK
        String userId FK
        String lessonId FK
        Boolean isCompleted
        DateTime completedAt
        DateTime createdAt
        DateTime updatedAt
    }

    Certificate {
        String id PK
        String uniqueCode UK
        String userId FK
        String courseId FK
        DateTime issuedAt
        String pdfUrl
    }

    Quiz {
        String id PK
        String title
        String description
        Int passingScore
        String chapterId FK UK
        AssessmentType assessmentType
        Int timeLimit
        Int attemptLimit
        DateTime availableFrom
        DateTime availableUntil
        Boolean shuffleQuestions
        Boolean shuffleOptions
        String showAnswersAfter
        Boolean isProctored
        String passwordProtected
        Boolean honorCodeRequired
        Int poolSize
        String questionBankId FK
        DateTime createdAt
        DateTime updatedAt
    }

    QuizAttempt {
        String id PK
        String userId FK
        String quizId FK
        Int score
        Boolean passed
        Json answers
        DateTime completedAt
        DateTime startedAt
        Int timeSpentSeconds
        Boolean isLate
        Boolean honorCodeAccepted
        String ipAddress
        Json questionsServed
        Int earnedPoints
        Int totalPoints
        Boolean needsManualGrading
        DateTime manualGradedAt
        String manualGradedBy
    }

    Assignment {
        String id PK
        String title
        String description
        AssignmentType type
        String courseId FK
        String chapterId FK
        DateTime dueDate
        Int points
        Boolean isPublished
        Int position
        String allowedFileTypes
        Int maxFileSize
        Int maxSubmissions
        LatePolicy latePolicy
        Int latePenaltyPercent
        DateTime availableFrom
        DateTime availableUntil
        String rubricId FK
        Boolean isGroupAssignment
        DateTime createdAt
        DateTime updatedAt
    }

    AssignmentSubmission {
        String id PK
        String assignmentId FK
        String userId FK
        SubmissionStatus status
        Int submissionNumber
        String groupId FK
        String fileUrl
        String fileName
        Int fileSize
        String textContent
        String urlLink
        Float grade
        String feedback
        Json rubricScores
        DateTime gradedAt
        String gradedBy
        DateTime submittedAt
        Boolean isLate
        Float latePenaltyApplied
        DateTime createdAt
        DateTime updatedAt
    }

    Bookmark {
        String id PK
        String userId FK
        String lessonId FK
        String note
        DateTime createdAt
    }

    Note {
        String id PK
        String userId FK
        String lessonId FK
        String content
        Int timestamp
        DateTime createdAt
        DateTime updatedAt
    }

    CourseReview {
        String id PK
        String userId FK
        String courseId FK
        Int rating
        String title
        String content
        Boolean isPublic
        DateTime createdAt
        DateTime updatedAt
    }

    ForumThread {
        String id PK
        String title
        String content
        String userId FK
        String categoryId FK
        Boolean isPinned
        Boolean isLocked
        Int views
        DateTime createdAt
        DateTime updatedAt
    }

    ForumReply {
        String id PK
        String content
        String userId FK
        String threadId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Message {
        String id PK
        String content
        String userId FK
        String roomId FK
        DateTime createdAt
    }

    ChatRoom {
        String id PK
        String courseId FK UK
        DateTime createdAt
    }

    Notification {
        String id PK
        NotificationType type
        String title
        String message
        Boolean read
        String userId FK
        String link
        Json metadata
        DateTime createdAt
    }

    NotificationPreference {
        String id PK
        String userId FK UK
        Boolean emailEnrollment
        Boolean emailCourseUpdates
        Boolean emailCertificates
        Boolean emailQuizResults
        Boolean emailForumReplies
        Boolean emailAnnouncements
        Boolean emailChatMentions
        DateTime createdAt
        DateTime updatedAt
    }

    CalendarEvent {
        String id PK
        String title
        String description
        DateTime startDate
        DateTime endDate
        Boolean allDay
        CalendarEventType type
        String color
        String courseId FK
        String userId FK
        String referenceType
        String referenceId
        DateTime createdAt
        DateTime updatedAt
    }

    CalendarToken {
        String id PK
        String token UK
        String userId FK UK
        DateTime createdAt
    }

    GroupMember {
        String id PK
        String groupId FK
        String userId FK
        GroupRole role
        DateTime joinedAt
    }

    CourseGroup {
        String id PK
        String name
        String courseId FK
        Int maxMembers
        String createdBy
        DateTime createdAt
        DateTime updatedAt
    }

    LearningPath {
        String id PK
        String title
        String slug UK
        String description
        String imageUrl
        Boolean isPublished
        Int position
        DateTime createdAt
        DateTime updatedAt
    }

    LearningPathEnrollment {
        String id PK
        String userId FK
        String learningPathId FK
        DateTime startedAt
        DateTime completedAt
    }

    ConsentRecord {
        String id PK
        String userId FK
        ConsentType consentType
        Boolean granted
        DateTime grantedAt
        DateTime revokedAt
        String ipAddress
        DateTime createdAt
        DateTime updatedAt
    }

    %% Core Learning Relationships
    User ||--o{ Enrollment : "enrolls in"
    User ||--o{ UserProgress : "tracks"
    User ||--o{ Certificate : "earns"
    User ||--o{ QuizAttempt : "attempts"
    User ||--o{ AssignmentSubmission : "submits"

    Course ||--o{ Enrollment : "has"
    Course ||--o{ Certificate : "awards"
    Course ||--o{ Chapter : "contains"
    Course ||--|| ChatRoom : "has"

    Chapter ||--o{ Lesson : "contains"
    Chapter ||--o| Quiz : "has"

    Lesson ||--o{ UserProgress : "tracked by"
    Lesson ||--o{ Bookmark : "bookmarked in"
    Lesson ||--o{ Note : "has notes"

    Quiz ||--o{ QuizAttempt : "has"

    Assignment ||--o{ AssignmentSubmission : "receives"

    %% Personal Features
    User ||--o{ Bookmark : "creates"
    User ||--o{ Note : "writes"
    User ||--o{ CourseReview : "writes"
    Course ||--o{ CourseReview : "has"

    %% Community
    User ||--o{ ForumThread : "creates"
    User ||--o{ ForumReply : "writes"
    User ||--o{ Message : "sends"
    ForumThread ||--o{ ForumReply : "has"
    ChatRoom ||--o{ Message : "contains"

    %% Notifications & Settings
    User ||--o{ Notification : "receives"
    User ||--o| NotificationPreference : "has"
    User ||--o{ ConsentRecord : "grants"

    %% Calendar & Groups
    User ||--o{ CalendarEvent : "has"
    User ||--o| CalendarToken : "has"
    User ||--o{ GroupMember : "joins"
    Course ||--o{ CalendarEvent : "has"
    Course ||--o{ CourseGroup : "has"
    CourseGroup ||--o{ GroupMember : "has"
    CourseGroup ||--o{ AssignmentSubmission : "submits"

    %% Learning Paths
    User ||--o{ LearningPathEnrollment : "enrolls"
    LearningPath ||--o{ LearningPathEnrollment : "has"
```

---

## 2. Instructor Data Model

This section shows all entities that instructors create, manage, and monitor.

```mermaid
erDiagram
    User {
        String id PK
        String name
        String email UK
        DateTime emailVerified
        String image
        String password
        UserRole role
        String bio
        Boolean profileVisibility
        Boolean mfaEnabled
        DateTime createdAt
        DateTime updatedAt
    }

    Course {
        String id PK
        String title
        String slug UK
        String description
        String imageUrl
        Boolean isPublished
        Boolean autoGradeSync
        String instructorId FK
        String categoryId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Category {
        String id PK
        String name UK
        String slug UK
        DateTime createdAt
        DateTime updatedAt
    }

    Chapter {
        String id PK
        String title
        String description
        Int position
        Boolean isPublished
        Boolean isFree
        String courseId FK
        DateTime availableFrom
        DateTime availableUntil
        DateTime createdAt
        DateTime updatedAt
    }

    Lesson {
        String id PK
        String title
        String description
        LessonType type
        String content
        String videoUrl
        String attachmentUrl
        Json sceneConfig
        Int position
        Int duration
        String chapterId FK
        DateTime availableFrom
        DateTime availableUntil
        DateTime createdAt
        DateTime updatedAt
    }

    Quiz {
        String id PK
        String title
        String description
        Int passingScore
        String chapterId FK UK
        AssessmentType assessmentType
        Int timeLimit
        Int attemptLimit
        DateTime availableFrom
        DateTime availableUntil
        Boolean shuffleQuestions
        Boolean shuffleOptions
        String showAnswersAfter
        Boolean isProctored
        String passwordProtected
        Json ipRestrictions
        Boolean honorCodeRequired
        Int lateGracePeriod
        String lateSubmissionPolicy
        Int latePenaltyPercent
        Int poolSize
        String questionBankId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Question {
        String id PK
        String text
        QuestionType type
        Json options
        Int correctAnswer
        Int points
        Int position
        String quizId FK
        String explanation
        Json acceptedAnswers
        Json matchingPairs
        Json orderingItems
        Boolean correctBoolAnswer
        Json blanks
        Json multiSelectAnswers
        Boolean partialCreditEnabled
        Int essayWordLimit
        String essayRubricId
        DateTime createdAt
        DateTime updatedAt
    }

    QuestionBank {
        String id PK
        String title
        String description
        String courseId FK
        DateTime createdAt
        DateTime updatedAt
    }

    QuestionBankItem {
        String id PK
        String questionBankId FK
        String questionId FK
        Int position
        DateTime createdAt
    }

    Assignment {
        String id PK
        String title
        String description
        AssignmentType type
        String courseId FK
        String chapterId FK
        DateTime dueDate
        Int points
        Boolean isPublished
        Int position
        String allowedFileTypes
        Int maxFileSize
        Int maxSubmissions
        LatePolicy latePolicy
        Int latePenaltyPercent
        DateTime availableFrom
        DateTime availableUntil
        String rubricId FK
        Boolean isGroupAssignment
        DateTime createdAt
        DateTime updatedAt
    }

    AssignmentSubmission {
        String id PK
        String assignmentId FK
        String userId FK
        SubmissionStatus status
        Int submissionNumber
        String groupId FK
        String fileUrl
        String fileName
        Int fileSize
        String textContent
        String urlLink
        Float grade
        String feedback
        Json rubricScores
        DateTime gradedAt
        String gradedBy
        DateTime submittedAt
        Boolean isLate
        Float latePenaltyApplied
        DateTime createdAt
        DateTime updatedAt
    }

    SubmissionComment {
        String id PK
        String submissionId FK
        String authorId FK
        String content
        DateTime createdAt
        DateTime updatedAt
    }

    SubmissionAnnotation {
        String id PK
        String submissionId FK
        String authorId FK
        Int startOffset
        Int endOffset
        String content
        DateTime createdAt
        DateTime updatedAt
    }

    Rubric {
        String id PK
        String title
        String description
        String courseId FK
        Boolean isTemplate
        String createdBy
        DateTime createdAt
        DateTime updatedAt
    }

    RubricCriterion {
        String id PK
        String rubricId FK
        String title
        String description
        Int position
        Int maxPoints
        Json levels
        DateTime createdAt
        DateTime updatedAt
    }

    GradeCategory {
        String id PK
        String name
        Float weight
        String courseId FK
        Int position
        Int dropLowest
        DateTime createdAt
        DateTime updatedAt
    }

    GradeItem {
        String id PK
        String categoryId FK
        String title
        Float points
        GradeItemType type
        String referenceId
        Boolean isExtraCredit
        Boolean isVisible
        DateTime dueDate
        DateTime createdAt
        DateTime updatedAt
    }

    StudentGrade {
        String id PK
        String gradeItemId FK
        String userId FK
        Float score
        String letterGrade
        Float overrideScore
        String overrideBy
        String overrideReason
        DateTime gradedAt
        DateTime createdAt
        DateTime updatedAt
    }

    GradingScale {
        String id PK
        String name
        String courseId FK
        Boolean isDefault
        Json levels
        DateTime createdAt
        DateTime updatedAt
    }

    ReleaseCondition {
        String id PK
        String targetType
        String targetId
        String courseId FK
        String conditionType
        Json conditionValue
        String operator
        Int position
        DateTime createdAt
        DateTime updatedAt
    }

    Announcement {
        String id PK
        String title
        String content
        String courseId FK
        String authorId FK
        Boolean isPinned
        Boolean isPublished
        DateTime publishedAt
        DateTime scheduledFor
        String attachmentUrl
        DateTime createdAt
        DateTime updatedAt
    }

    AttendanceSession {
        String id PK
        String courseId FK
        DateTime date
        String title
        String type
        String notes
        String createdBy
        DateTime createdAt
        DateTime updatedAt
    }

    AttendanceRecord {
        String id PK
        String sessionId FK
        String userId FK
        AttendanceStatus status
        String notes
        DateTime markedAt
        String markedBy
        DateTime createdAt
        DateTime updatedAt
    }

    UserActivity {
        String id PK
        String userId FK
        String courseId FK
        String lessonId FK
        String eventType
        Json metadata
        String sessionId
        DateTime timestamp
    }

    Media {
        String id PK
        String name
        String url
        MediaType type
        Int size
        String mimeType
        String userId FK
        String courseId FK
        DateTime createdAt
        DateTime updatedAt
    }

    CourseGroup {
        String id PK
        String name
        String courseId FK
        Int maxMembers
        String createdBy
        DateTime createdAt
        DateTime updatedAt
    }

    GroupMember {
        String id PK
        String groupId FK
        String userId FK
        GroupRole role
        DateTime joinedAt
    }

    ChatRoom {
        String id PK
        String courseId FK UK
        DateTime createdAt
    }

    CalendarEvent {
        String id PK
        String title
        String description
        DateTime startDate
        DateTime endDate
        Boolean allDay
        CalendarEventType type
        String color
        String courseId FK
        String userId FK
        String referenceType
        String referenceId
        DateTime createdAt
        DateTime updatedAt
    }

    Enrollment {
        String id PK
        String userId FK
        String courseId FK
        DateTime completedAt
        DateTime createdAt
        DateTime updatedAt
    }

    QuizAttempt {
        String id PK
        String userId FK
        String quizId FK
        Int score
        Boolean passed
        Json answers
        DateTime completedAt
        Boolean needsManualGrading
        DateTime manualGradedAt
        String manualGradedBy
    }

    %% Course Structure
    User ||--o{ Course : "teaches"
    Course }o--o| Category : "belongs to"
    Course ||--o{ Chapter : "contains"
    Chapter ||--o{ Lesson : "contains"

    %% Assessments
    Chapter ||--o| Quiz : "has"
    Quiz ||--o{ Question : "contains"
    Course ||--o{ QuestionBank : "has"
    QuestionBank ||--o{ QuestionBankItem : "contains"
    QuestionBankItem }o--|| Question : "references"
    Quiz }o--o| QuestionBank : "pulls from"

    %% Assignments & Grading
    Course ||--o{ Assignment : "has"
    Chapter ||--o{ Assignment : "has"
    Assignment }o--o| Rubric : "graded by"
    Assignment ||--o{ AssignmentSubmission : "receives"
    AssignmentSubmission ||--o{ SubmissionComment : "has"
    AssignmentSubmission ||--o{ SubmissionAnnotation : "has"

    %% Rubrics
    Course ||--o{ Rubric : "has"
    Rubric ||--o{ RubricCriterion : "has"

    %% Gradebook
    Course ||--o{ GradeCategory : "has"
    Course ||--o{ GradingScale : "has"
    GradeCategory ||--o{ GradeItem : "contains"
    GradeItem ||--o{ StudentGrade : "has"

    %% Scheduling
    Course ||--o{ ReleaseCondition : "has"
    Course ||--o{ CalendarEvent : "has"

    %% Attendance
    Course ||--o{ AttendanceSession : "has"
    AttendanceSession ||--o{ AttendanceRecord : "has"

    %% Announcements
    Course ||--o{ Announcement : "has"
    User ||--o{ Announcement : "creates"

    %% Groups
    Course ||--o{ CourseGroup : "has"
    CourseGroup ||--o{ GroupMember : "has"

    %% Media & Chat
    Course ||--o{ Media : "uses"
    User ||--o{ Media : "uploads"
    Course ||--|| ChatRoom : "has"

    %% Student Data View
    Course ||--o{ Enrollment : "has"
    Quiz ||--o{ QuizAttempt : "has"
    User ||--o{ UserActivity : "generates"
    Course ||--o{ UserActivity : "receives"
```

---

## 3. Admin Data Model

This section shows all entities that administrators manage for platform-wide operations.

```mermaid
erDiagram
    User {
        String id PK
        String name
        String email UK
        DateTime emailVerified
        String image
        String password
        UserRole role
        String bio
        Boolean profileVisibility
        Boolean mfaEnabled
        DateTime consentAcceptedAt
        DateTime createdAt
        DateTime updatedAt
    }

    Account {
        String id PK
        String userId FK
        String type
        String provider
        String providerAccountId
        String refresh_token
        String access_token
        Int expires_at
        String token_type
        String scope
        String id_token
        String session_state
    }

    Session {
        String id PK
        String sessionToken UK
        String userId FK
        DateTime expires
    }

    AuditLog {
        String id PK
        AuditAction action
        String userId FK
        String targetId
        String targetType
        String ipAddress
        String userAgent
        Json details
        DateTime createdAt
    }

    PlatformSettings {
        String id PK
        Boolean registrationOpen
        UserRole defaultRole
        Boolean maintenanceMode
        String platformName
        String platformDescription
        Int maxFileUploadSize
        String allowedFileTypes
        DateTime createdAt
        DateTime updatedAt
    }

    Category {
        String id PK
        String name UK
        String slug UK
        DateTime createdAt
        DateTime updatedAt
    }

    ForumCategory {
        String id PK
        String name
        String slug UK
        String description
        String icon
        String color
        Int position
        DateTime createdAt
        DateTime updatedAt
    }

    MFAConfig {
        String id PK
        String userId FK UK
        MFAMethod method
        Boolean isEnabled
        Json backupCodes
        DateTime lastUsedAt
        Int failedAttempts
        DateTime lockedUntil
        DateTime createdAt
        DateTime updatedAt
    }

    OTPToken {
        String id PK
        String userId FK
        String code
        DateTime expiresAt
        DateTime usedAt
        String purpose
        DateTime createdAt
    }

    CourseApproval {
        String id PK
        String courseId FK UK
        ApprovalStatus status
        DateTime submittedAt
        String reviewedBy
        DateTime reviewedAt
        String reviewComment
        Json history
        DateTime createdAt
        DateTime updatedAt
    }

    Course {
        String id PK
        String title
        String slug UK
        String description
        String imageUrl
        Boolean isPublished
        String instructorId FK
        String categoryId FK
        DateTime createdAt
        DateTime updatedAt
    }

    EmailCampaign {
        String id PK
        String title
        String subject
        String content
        Json recipientFilter
        CampaignStatus status
        DateTime sentAt
        DateTime scheduledFor
        String sentBy FK
        Int sentCount
        Int failedCount
        DateTime createdAt
        DateTime updatedAt
    }

    RetentionPolicy {
        String id PK
        DataType dataType UK
        Int retentionDays
        RetentionAction action
        Boolean isActive
        DateTime lastExecutedAt
        String description
        DateTime createdAt
        DateTime updatedAt
    }

    ConsentRecord {
        String id PK
        String userId FK
        ConsentType consentType
        Boolean granted
        DateTime grantedAt
        DateTime revokedAt
        String ipAddress
        DateTime createdAt
        DateTime updatedAt
    }

    Webhook {
        String id PK
        String url
        String description
        String secret
        WebhookEvent[] events
        Boolean isActive
        String userId FK
        DateTime createdAt
        DateTime updatedAt
    }

    WebhookDelivery {
        String id PK
        String webhookId FK
        WebhookEvent event
        Json payload
        Int statusCode
        String responseBody
        Boolean success
        Int attempts
        Int maxAttempts
        DateTime nextRetryAt
        String error
        DateTime deliveredAt
        DateTime completedAt
    }

    APIKey {
        String id PK
        String name
        String keyPrefix
        String keyHash UK
        APIKeyPermission[] permissions
        String userId FK
        Boolean isActive
        DateTime expiresAt
        DateTime lastUsedAt
        DateTime createdAt
    }

    LearningPath {
        String id PK
        String title
        String slug UK
        String description
        String imageUrl
        Boolean isPublished
        Int position
        DateTime createdAt
        DateTime updatedAt
    }

    LearningPathCourse {
        String id PK
        String learningPathId FK
        String courseId FK
        Int position
    }

    CoursePrerequisite {
        String id PK
        String courseId FK
        String prerequisiteCourseId FK
    }

    ForumThread {
        String id PK
        String title
        String content
        String userId FK
        String categoryId FK
        Boolean isPinned
        Boolean isLocked
        Int views
        DateTime createdAt
        DateTime updatedAt
    }

    Notification {
        String id PK
        NotificationType type
        String title
        String message
        Boolean read
        String userId FK
        String link
        Json metadata
        DateTime createdAt
    }

    Enrollment {
        String id PK
        String userId FK
        String courseId FK
        DateTime completedAt
        DateTime createdAt
        DateTime updatedAt
    }

    %% User Management
    User ||--o{ Account : "has"
    User ||--o{ Session : "has"
    User ||--o| MFAConfig : "has"
    User ||--o{ OTPToken : "generates"
    User ||--o{ AuditLog : "generates"
    User ||--o{ ConsentRecord : "grants"

    %% Platform Configuration
    Category ||--o{ Course : "contains"
    ForumCategory ||--o{ ForumThread : "contains"

    %% Course Approval
    Course ||--o| CourseApproval : "has"

    %% Email Campaigns
    User ||--o{ EmailCampaign : "sends"

    %% Integrations
    User ||--o{ Webhook : "creates"
    Webhook ||--o{ WebhookDelivery : "has"
    User ||--o{ APIKey : "creates"

    %% Learning Paths
    LearningPath ||--o{ LearningPathCourse : "contains"
    Course ||--o{ LearningPathCourse : "included in"

    %% Course Prerequisites
    Course ||--o{ CoursePrerequisite : "has prerequisites"
    Course ||--o{ CoursePrerequisite : "prerequisite for"

    %% Forum Moderation
    User ||--o{ ForumThread : "creates"

    %% Notifications
    User ||--o{ Notification : "receives"

    %% Enrollment Overview
    User ||--o{ Enrollment : "has"
    Course ||--o{ Enrollment : "has"
```

---

> **Note:** For detailed definitions of each entity and its role context, see [ERD_ROLE_DEFINITIONS.md](./ERD_ROLE_DEFINITIONS.md).
