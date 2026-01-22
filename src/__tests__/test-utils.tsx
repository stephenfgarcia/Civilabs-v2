import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock session data for authenticated tests
export const mockSession = {
  user: {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    role: "STUDENT" as const,
    image: null,
    emailVerified: new Date(),
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockAdminSession = {
  user: {
    ...mockSession.user,
    id: "admin-user-id",
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN" as const,
  },
  expires: mockSession.expires,
};

export const mockInstructorSession = {
  user: {
    ...mockSession.user,
    id: "instructor-user-id",
    name: "Instructor User",
    email: "instructor@example.com",
    role: "INSTRUCTOR" as const,
  },
  expires: mockSession.expires,
};

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  session?: typeof mockSession | null;
}

// Simple wrapper for tests without session provider (since next-auth is mocked globally)
function customRender(
  ui: ReactElement,
  { session: _session = null, ...renderOptions }: CustomRenderOptions = {}
) {
  return {
    user: userEvent.setup(),
    ...render(ui, renderOptions),
  };
}

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
export { userEvent };

// Helper to wait for async operations
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// Mock data generators
export const createMockCourse = (overrides = {}) => ({
  id: "course-1",
  title: "Test Course",
  description: "A test course description",
  imageUrl: null,
  isPublished: true,
  instructorId: "instructor-1",
  categoryId: "category-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockChapter = (overrides = {}) => ({
  id: "chapter-1",
  title: "Test Chapter",
  description: "A test chapter",
  position: 1,
  isPublished: true,
  isFree: false,
  courseId: "course-1",
  ...overrides,
});

export const createMockLesson = (overrides = {}) => ({
  id: "lesson-1",
  title: "Test Lesson",
  description: "A test lesson",
  type: "VIDEO",
  content: null,
  videoUrl: "https://example.com/video.mp4",
  position: 1,
  duration: 600,
  chapterId: "chapter-1",
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: "user-1",
  name: "Test User",
  email: "user@example.com",
  role: "STUDENT",
  image: null,
  ...overrides,
});

export const createMockEnrollment = (overrides = {}) => ({
  id: "enrollment-1",
  userId: "user-1",
  courseId: "course-1",
  createdAt: new Date(),
  ...overrides,
});

export const createMockNotification = (overrides = {}) => ({
  id: "notification-1",
  type: "ENROLLMENT",
  title: "New Enrollment",
  message: "You have enrolled in a course",
  read: false,
  link: "/courses/course-1",
  userId: "user-1",
  createdAt: new Date().toISOString(),
  ...overrides,
});
