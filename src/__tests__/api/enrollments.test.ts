/**
 * @jest-environment node
 */

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    enrollment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    coursePrerequisite: {
      findMany: jest.fn(),
    },
    userProgress: {
      count: jest.fn(),
    },
  },
}));

jest.mock("@/lib/email", () => ({
  sendEnrollmentEmail: jest.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "@/app/api/enrollments/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe("Enrollments API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/enrollments", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
    });

    it("returns enrollments with progress", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      const mockEnrollments = [
        {
          id: "enrollment-1",
          userId: "user-1",
          courseId: "course-1",
          createdAt: new Date(),
          course: {
            id: "course-1",
            title: "Test Course",
            instructor: { name: "Instructor", image: null },
            chapters: [
              {
                lessons: [{ id: "lesson-1" }, { id: "lesson-2" }],
              },
            ],
            _count: { enrollments: 5 },
          },
        },
      ];

      (db.enrollment.findMany as jest.Mock).mockResolvedValue(mockEnrollments);
      (db.userProgress.count as jest.Mock).mockResolvedValue(1);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].progress).toEqual({
        completed: 1,
        total: 2,
        percentage: 50,
      });
    });
  });

  describe("POST /api/enrollments", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as any);

      const request = new Request("http://localhost:3000/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId: "course-1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("returns 400 when courseId is missing", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      const request = new Request("http://localhost:3000/api/enrollments", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("returns 404 when course not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.course.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId: "nonexistent" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it("returns 400 when already enrolled", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: "course-1",
        title: "Test Course",
        isPublished: true,
      });
      (db.enrollment.findUnique as jest.Mock).mockResolvedValue({
        id: "enrollment-1",
      });

      const request = new Request("http://localhost:3000/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId: "course-1" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe("Already enrolled in this course");
    });

    it("returns 400 when prerequisites not met", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: "course-2",
        title: "Advanced Course",
        isPublished: true,
      });
      (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
      (db.coursePrerequisite.findMany as jest.Mock).mockResolvedValue([
        {
          courseId: "course-2",
          prerequisiteCourseId: "course-1",
          prerequisiteCourse: { id: "course-1", title: "Basics Course" },
        },
      ]);
      // User has not completed the prerequisite
      (db.enrollment.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId: "course-2" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe("Prerequisites not met");
      expect(data.unmetPrerequisites).toHaveLength(1);
      expect(data.unmetPrerequisites[0].title).toBe("Basics Course");
    });

    it("enrolls successfully when prerequisites are met", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", name: "Test", role: "STUDENT" },
        expires: "",
      } as any);

      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: "course-2",
        title: "Advanced Course",
        isPublished: true,
      });
      (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
      (db.coursePrerequisite.findMany as jest.Mock).mockResolvedValue([
        {
          courseId: "course-2",
          prerequisiteCourseId: "course-1",
          prerequisiteCourse: { id: "course-1", title: "Basics Course" },
        },
      ]);
      // User has completed the prerequisite
      (db.enrollment.findMany as jest.Mock).mockResolvedValue([
        { courseId: "course-1" },
      ]);
      (db.enrollment.create as jest.Mock).mockResolvedValue({
        id: "enrollment-1",
        userId: "user-1",
        courseId: "course-2",
      });

      const request = new Request("http://localhost:3000/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId: "course-2" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.courseId).toBe("course-2");
    });

    it("enrolls successfully with no prerequisites", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", name: "Test", role: "STUDENT" },
        expires: "",
      } as any);

      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: "course-1",
        title: "Beginner Course",
        isPublished: true,
      });
      (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
      (db.coursePrerequisite.findMany as jest.Mock).mockResolvedValue([]);
      (db.enrollment.create as jest.Mock).mockResolvedValue({
        id: "enrollment-1",
        userId: "user-1",
        courseId: "course-1",
      });

      const request = new Request("http://localhost:3000/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId: "course-1" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.courseId).toBe("course-1");
    });
  });
});
