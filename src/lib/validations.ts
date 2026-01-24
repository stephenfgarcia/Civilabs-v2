import { z } from "zod";

// Auth validations
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Course validations
export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const chapterSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  isFree: z.boolean().optional().default(false),
});

export const lessonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["VIDEO", "PDF", "DOCUMENT", "POWERPOINT", "SCENE_3D", "TEXT"]),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
  sceneConfig: z.any().optional(),
});

// Assessment validations (expanded from quiz)
export const assessmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100).default(70),
  assessmentType: z.enum(["QUIZ", "EXAM", "PRACTICE"]).default("QUIZ"),
  timeLimit: z.number().min(1).max(600).nullable().optional(),
  attemptLimit: z.number().min(1).max(100).nullable().optional(),
  availableFrom: z.string().datetime().nullable().optional(),
  availableUntil: z.string().datetime().nullable().optional(),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showAnswersAfter: z.enum(["SUBMISSION", "AFTER_DUE", "MANUAL", "NEVER"]).default("SUBMISSION"),
  isProctored: z.boolean().default(false),
  passwordProtected: z.string().nullable().optional(),
  ipRestrictions: z.array(z.string()).nullable().optional(),
  honorCodeRequired: z.boolean().default(false),
  lateGracePeriod: z.number().min(0).max(120).nullable().optional(),
  lateSubmissionPolicy: z.enum(["ACCEPT", "REJECT", "PENALTY"]).default("ACCEPT"),
  latePenaltyPercent: z.number().min(0).max(100).default(0),
  poolSize: z.number().min(1).nullable().optional(),
  questionBankId: z.string().nullable().optional(),
});

// Backward-compatible alias
export const quizSchema = assessmentSchema;

export const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: z.enum([
    "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER",
    "MULTI_SELECT", "MATCHING", "ORDERING",
    "ESSAY", "FILL_IN_BLANK"
  ]).default("MULTIPLE_CHOICE"),
  options: z.array(z.string()).nullable().optional(),
  correctAnswer: z.number().min(0).nullable().optional(),
  points: z.number().min(1).default(1),
  explanation: z.string().nullable().optional(),
  acceptedAnswers: z.array(z.object({
    text: z.string(),
    matchMode: z.enum(["exact", "contains", "regex"]).default("exact"),
  })).nullable().optional(),
  matchingPairs: z.array(z.object({
    left: z.string(),
    right: z.string(),
  })).nullable().optional(),
  orderingItems: z.array(z.string()).nullable().optional(),
  correctBoolAnswer: z.boolean().nullable().optional(),
  blanks: z.array(z.object({
    position: z.number(),
    acceptedAnswers: z.array(z.string()),
  })).nullable().optional(),
  multiSelectAnswers: z.array(z.number()).nullable().optional(),
  partialCreditEnabled: z.boolean().default(false),
  essayWordLimit: z.number().min(1).nullable().optional(),
});

// Assignment validations
export const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["FILE_UPLOAD", "TEXT_ENTRY", "URL_LINK", "MEDIA_RECORDING"]).default("FILE_UPLOAD"),
  chapterId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  points: z.number().min(1).max(10000).default(100),
  isPublished: z.boolean().default(false),
  allowedFileTypes: z.string().nullable().optional(),
  maxFileSize: z.number().min(1).max(500).nullable().optional(),
  maxSubmissions: z.number().min(1).max(100).default(1),
  latePolicy: z.enum(["ACCEPT_LATE", "REJECT_LATE", "NO_DUE_DATE"]).default("ACCEPT_LATE"),
  latePenaltyPercent: z.number().min(0).max(100).default(0),
  availableFrom: z.string().datetime().nullable().optional(),
  availableUntil: z.string().datetime().nullable().optional(),
  rubricId: z.string().nullable().optional(),
  isGroupAssignment: z.boolean().default(false),
});

// Assignment submission validation
export const assignmentSubmissionSchema = z.object({
  textContent: z.string().nullable().optional(),
  urlLink: z.string().url().nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
});

// Rubric validations
export const rubricSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  isTemplate: z.boolean().default(false),
});

export const rubricCriterionSchema = z.object({
  title: z.string().min(1, "Criterion title is required"),
  description: z.string().optional(),
  maxPoints: z.number().min(1).default(10),
  levels: z.array(z.object({
    label: z.string().min(1),
    description: z.string().optional(),
    points: z.number().min(0),
  })).min(2, "At least 2 levels required"),
});

// Question bank validation
export const questionBankSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
});

// Grade submission validation
export const gradeSubmissionSchema = z.object({
  grade: z.number().min(0),
  feedback: z.string().optional(),
  rubricScores: z.record(z.string(), z.object({
    levelIndex: z.number().min(0),
    points: z.number().min(0),
    comment: z.string().optional(),
  })).nullable().optional(),
});

// Discussion validations
export const discussionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

export const replySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty"),
});

// Message validations
export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

// User profile validations
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  image: z.string().url().optional().or(z.literal("")),
});

// Password change validation
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// Notification preferences validation
export const notificationPreferenceSchema = z.object({
  emailEnrollment: z.boolean(),
  emailCourseUpdates: z.boolean(),
  emailCertificates: z.boolean(),
  emailQuizResults: z.boolean(),
  emailForumReplies: z.boolean(),
  emailAnnouncements: z.boolean(),
  emailChatMentions: z.boolean(),
});

// Privacy settings validation (student)
export const privacySettingsSchema = z.object({
  profileVisibility: z.boolean(),
});

// Platform settings validation (admin)
export const platformSettingsSchema = z.object({
  registrationOpen: z.boolean(),
  defaultRole: z.enum(["STUDENT", "INSTRUCTOR"]),
  maintenanceMode: z.boolean(),
  platformName: z.string().min(1, "Platform name is required").max(100),
  platformDescription: z.string().max(500).optional().or(z.literal("")),
  maxFileUploadSize: z.number().min(1).max(100),
  allowedFileTypes: z.string().min(1),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type ChapterInput = z.infer<typeof chapterSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type AssessmentInput = z.infer<typeof assessmentSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type AssignmentSubmissionInput = z.infer<typeof assignmentSubmissionSchema>;
export type RubricInput = z.infer<typeof rubricSchema>;
export type RubricCriterionInput = z.infer<typeof rubricCriterionSchema>;
export type QuestionBankInput = z.infer<typeof questionBankSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type DiscussionInput = z.infer<typeof discussionSchema>;
export type ReplyInput = z.infer<typeof replySchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;

// ==================== Phase 15 Validations ====================

// Grade Category
export const gradeCategorySchema = z.object({
  name: z.string().min(1).max(100),
  weight: z.number().min(0).max(100),
  position: z.number().int().min(0).optional(),
  dropLowest: z.number().int().min(0).default(0),
});

// Grade Item
export const gradeItemSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(1).max(200),
  points: z.number().min(0).default(100),
  type: z.enum(["ASSIGNMENT", "ASSESSMENT", "ATTENDANCE", "MANUAL"]).default("MANUAL"),
  referenceId: z.string().optional(),
  isExtraCredit: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  dueDate: z.string().optional(),
});

// Student Grade (manual entry or override)
export const studentGradeSchema = z.object({
  gradeItemId: z.string().min(1),
  userId: z.string().min(1),
  score: z.number().min(0).optional(),
  overrideScore: z.number().min(0).optional(),
  overrideReason: z.string().optional(),
});

// Grading Scale
export const gradingScaleSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().default(false),
  levels: z.array(z.object({
    label: z.string().min(1),
    minPercent: z.number().min(0).max(100),
    maxPercent: z.number().min(0).max(100),
    gpaValue: z.number().min(0).max(4.0).optional(),
  })).min(1),
});

// Release Condition
export const releaseConditionSchema = z.object({
  targetType: z.enum(["CHAPTER", "LESSON", "ASSIGNMENT", "ASSESSMENT"]),
  targetId: z.string().min(1),
  conditionType: z.enum([
    "DATE_AFTER", "LESSON_COMPLETED", "CHAPTER_COMPLETED",
    "ASSESSMENT_PASSED", "ASSESSMENT_SCORE_ABOVE",
    "ASSIGNMENT_SUBMITTED", "ASSIGNMENT_GRADED",
  ]),
  conditionValue: z.record(z.string(), z.unknown()),
  operator: z.enum(["AND", "OR"]).default("AND"),
  position: z.number().int().min(0).optional(),
});

// Announcement
export const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  isPinned: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  scheduledFor: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
});

// Attendance Session
export const attendanceSessionSchema = z.object({
  date: z.string().optional(),
  title: z.string().max(200).optional(),
  type: z.enum(["IN_PERSON", "VIRTUAL", "ASYNC"]).default("IN_PERSON"),
  notes: z.string().optional(),
});

// Attendance Record
export const attendanceRecordSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  notes: z.string().optional(),
});

// Batch attendance (multiple students at once)
export const batchAttendanceSchema = z.object({
  records: z.array(attendanceRecordSchema).min(1),
});

// Course Clone
export const courseCloneSchema = z.object({
  title: z.string().min(1).max(200),
  dateShiftDays: z.number().int().optional(), // Shift all dates by N days
  includeAssignments: z.boolean().default(true),
  includeAssessments: z.boolean().default(true),
  includeRubrics: z.boolean().default(true),
  includeReleaseConditions: z.boolean().default(true),
  includeAnnouncements: z.boolean().default(false),
});

// Telemetry Event
export const telemetryEventSchema = z.object({
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  eventType: z.enum(["VIEW", "SCROLL", "VIDEO_PLAY", "VIDEO_PAUSE", "SUBMIT", "LOGIN", "IDLE"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().optional(),
});

// Batch telemetry
export const batchTelemetrySchema = z.object({
  events: z.array(telemetryEventSchema).min(1).max(50),
});

// ==================== Phase 16 Schemas ====================

// MFA
export const mfaSetupSchema = z.object({
  method: z.enum(["EMAIL_OTP"]).default("EMAIL_OTP"),
});

export const mfaVerifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must be numeric"),
});

export const mfaEnforcementSchema = z.object({
  requireMFA: z.boolean(),
  roles: z.array(z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"])).optional(),
});

// Course Approval
export const courseApprovalSubmitSchema = z.object({
  courseId: z.string().min(1),
});

export const courseApprovalReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]),
  comment: z.string().optional(),
});

// Email Campaigns
export const emailCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().min(1).max(200),
  content: z.string().min(1),
  recipientFilter: z.object({
    role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]).optional(),
    courseId: z.string().optional(),
    enrollmentStatus: z.enum(["ACTIVE", "COMPLETED"]).optional(),
    inactiveDays: z.number().int().positive().optional(),
    registeredAfter: z.string().datetime().optional(),
  }),
  scheduledFor: z.string().datetime().optional(),
});

export const emailCampaignUpdateSchema = emailCampaignSchema.partial();

// Data Retention
export const retentionPolicySchema = z.object({
  dataType: z.enum(["USER_DATA", "ENROLLMENTS", "SUBMISSIONS", "TELEMETRY", "AUDIT_LOGS", "CHAT_MESSAGES", "FORUM_POSTS"]),
  retentionDays: z.number().int().min(1).max(3650),
  action: z.enum(["ARCHIVE", "ANONYMIZE", "DELETE"]).default("ARCHIVE"),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

export const retentionPolicyUpdateSchema = retentionPolicySchema.partial().omit({ dataType: true });

// Consent
export const consentSchema = z.object({
  consentType: z.enum(["DATA_PROCESSING", "ANALYTICS", "MARKETING"]),
  granted: z.boolean(),
});

export const batchConsentSchema = z.object({
  consents: z.array(consentSchema).min(1).max(10),
});

// ==================== PHASE 17: Calendar & Groups ====================

// Calendar Events
export const calendarEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  allDay: z.boolean().optional().default(false),
  type: z.enum(["ASSIGNMENT_DUE", "ASSESSMENT_OPEN", "ASSESSMENT_CLOSE", "CONTENT_AVAILABLE", "ATTENDANCE_SESSION", "CUSTOM"]).optional().default("CUSTOM"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  courseId: z.string().optional(),
});

export const calendarEventUpdateSchema = calendarEventSchema.partial();

// Groups
export const courseGroupSchema = z.object({
  name: z.string().min(1).max(100),
  maxMembers: z.number().int().min(2).max(50).optional().default(5),
});

export const courseGroupUpdateSchema = courseGroupSchema.partial();

export const groupMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(["LEADER", "MEMBER"]).optional().default("MEMBER"),
});

export const autoAssignGroupsSchema = z.object({
  strategy: z.enum(["RANDOM", "BALANCED"]),
  groupSize: z.number().int().min(2).max(50),
  groupNamePrefix: z.string().min(1).max(50).optional().default("Group"),
});

// Type exports
export type GradeCategoryInput = z.infer<typeof gradeCategorySchema>;
export type GradeItemInput = z.infer<typeof gradeItemSchema>;
export type StudentGradeInput = z.infer<typeof studentGradeSchema>;
export type GradingScaleInput = z.infer<typeof gradingScaleSchema>;
export type ReleaseConditionInput = z.infer<typeof releaseConditionSchema>;
export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type AttendanceSessionInput = z.infer<typeof attendanceSessionSchema>;
export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;
export type CourseCloneInput = z.infer<typeof courseCloneSchema>;
export type TelemetryEventInput = z.infer<typeof telemetryEventSchema>;
export type MFAVerifyInput = z.infer<typeof mfaVerifySchema>;
export type CourseApprovalReviewInput = z.infer<typeof courseApprovalReviewSchema>;
export type EmailCampaignInput = z.infer<typeof emailCampaignSchema>;
export type RetentionPolicyInput = z.infer<typeof retentionPolicySchema>;
export type ConsentInput = z.infer<typeof consentSchema>;
export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
export type CourseGroupInput = z.infer<typeof courseGroupSchema>;
export type GroupMemberInput = z.infer<typeof groupMemberSchema>;
export type AutoAssignGroupsInput = z.infer<typeof autoAssignGroupsSchema>;
