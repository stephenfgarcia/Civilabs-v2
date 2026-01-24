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
  isFree: z.boolean(),
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

// Quiz validations
export const quizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100).default(70),
});

export const questionSchema = z.object({
  text: z.string().min(5, "Question must be at least 5 characters"),
  options: z.array(z.string()).min(2, "At least 2 options required"),
  correctAnswer: z.number().min(0),
  points: z.number().min(1).default(1),
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
export type QuizInput = z.infer<typeof quizSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type DiscussionInput = z.infer<typeof discussionSchema>;
export type ReplyInput = z.infer<typeof replySchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;
