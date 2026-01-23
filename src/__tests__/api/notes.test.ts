/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    note: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
    },
  },
}));

import { GET, POST } from "@/app/api/notes/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

function createRequest(url: string, options: RequestInit = {}) {
  return new NextRequest(new URL(url, "http://localhost:3000"), options as any);
}

describe("Notes API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/notes", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as any);

      const req = createRequest("/api/notes");
      const response = await GET(req);

      expect(response.status).toBe(401);
    });

    it("returns user notes", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      const mockNotes = [
        {
          id: "note-1",
          userId: "user-1",
          lessonId: "lesson-1",
          content: "My note content",
          timestamp: 120,
          createdAt: new Date(),
          lesson: {
            id: "lesson-1",
            title: "Lesson 1",
            chapter: {
              id: "chapter-1",
              title: "Chapter 1",
              course: { id: "course-1", title: "Course 1" },
            },
          },
        },
      ];

      (db.note.findMany as jest.Mock).mockResolvedValue(mockNotes);

      const req = createRequest("/api/notes");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].content).toBe("My note content");
    });

    it("filters by lessonId", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.note.findMany as jest.Mock).mockResolvedValue([]);

      const req = createRequest("/api/notes?lessonId=lesson-1");
      await GET(req);

      expect(db.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            lessonId: "lesson-1",
          }),
        })
      );
    });

    it("filters by courseId", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.note.findMany as jest.Mock).mockResolvedValue([]);

      const req = createRequest("/api/notes?courseId=course-1");
      await GET(req);

      expect(db.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            lesson: { chapter: { courseId: "course-1" } },
          }),
        })
      );
    });
  });

  describe("POST /api/notes", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as any);

      const req = createRequest("/api/notes", {
        method: "POST",
        body: JSON.stringify({ lessonId: "lesson-1", content: "Note" }),
      });
      const response = await POST(req);

      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid input (missing content)", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      const req = createRequest("/api/notes", {
        method: "POST",
        body: JSON.stringify({ lessonId: "lesson-1" }),
      });
      const response = await POST(req);

      expect(response.status).toBe(400);
    });

    it("returns 400 for empty content", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      const req = createRequest("/api/notes", {
        method: "POST",
        body: JSON.stringify({ lessonId: "lesson-1", content: "" }),
      });
      const response = await POST(req);

      expect(response.status).toBe(400);
    });

    it("returns 404 when lesson not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.lesson.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createRequest("/api/notes", {
        method: "POST",
        body: JSON.stringify({ lessonId: "nonexistent", content: "My note" }),
      });
      const response = await POST(req);

      expect(response.status).toBe(404);
    });

    it("returns 403 when not enrolled", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.lesson.findUnique as jest.Mock).mockResolvedValue({
        id: "lesson-1",
        chapter: { courseId: "course-1" },
      });
      (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createRequest("/api/notes", {
        method: "POST",
        body: JSON.stringify({ lessonId: "lesson-1", content: "My note" }),
      });
      const response = await POST(req);

      expect(response.status).toBe(403);
    });

    it("creates a note successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.lesson.findUnique as jest.Mock).mockResolvedValue({
        id: "lesson-1",
        chapter: { courseId: "course-1" },
      });
      (db.enrollment.findUnique as jest.Mock).mockResolvedValue({
        id: "enrollment-1",
      });
      (db.note.create as jest.Mock).mockResolvedValue({
        id: "note-1",
        userId: "user-1",
        lessonId: "lesson-1",
        content: "My note",
        timestamp: null,
        createdAt: new Date(),
      });

      const req = createRequest("/api/notes", {
        method: "POST",
        body: JSON.stringify({ lessonId: "lesson-1", content: "My note" }),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.content).toBe("My note");
    });

    it("creates a note with timestamp", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.lesson.findUnique as jest.Mock).mockResolvedValue({
        id: "lesson-1",
        chapter: { courseId: "course-1" },
      });
      (db.enrollment.findUnique as jest.Mock).mockResolvedValue({
        id: "enrollment-1",
      });
      (db.note.create as jest.Mock).mockResolvedValue({
        id: "note-1",
        userId: "user-1",
        lessonId: "lesson-1",
        content: "Note at timestamp",
        timestamp: 120,
        createdAt: new Date(),
      });

      const req = createRequest("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "lesson-1",
          content: "Note at timestamp",
          timestamp: 120,
        }),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.timestamp).toBe(120);
      expect(db.note.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          lessonId: "lesson-1",
          content: "Note at timestamp",
          timestamp: 120,
        },
      });
    });
  });
});
