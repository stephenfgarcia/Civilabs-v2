/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    bookmark: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
  },
}));

import { GET, POST, DELETE } from "@/app/api/bookmarks/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

function createRequest(url: string, options: RequestInit = {}) {
  return new NextRequest(new URL(url, "http://localhost:3000"), options as any);
}

describe("Bookmarks API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/bookmarks", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as any);

      const req = createRequest("/api/bookmarks");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
    });

    it("returns user bookmarks", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      const mockBookmarks = [
        {
          id: "bookmark-1",
          userId: "user-1",
          lessonId: "lesson-1",
          note: "Important lesson",
          createdAt: new Date(),
          lesson: {
            id: "lesson-1",
            title: "Lesson 1",
            chapter: {
              course: { id: "course-1", title: "Course 1", slug: "course-1" },
            },
          },
        },
      ];

      (db.bookmark.findMany as jest.Mock).mockResolvedValue(mockBookmarks);

      const req = createRequest("/api/bookmarks");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("bookmark-1");
    });

    it("filters by courseId when provided", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.bookmark.findMany as jest.Mock).mockResolvedValue([]);

      const req = createRequest("/api/bookmarks?courseId=course-1");
      await GET(req);

      expect(db.bookmark.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            lesson: { chapter: { courseId: "course-1" } },
          }),
        })
      );
    });
  });

  describe("POST /api/bookmarks", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as any);

      const req = createRequest("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ lessonId: "lesson-1" }),
      });
      const response = await POST(req);

      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid input", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      const req = createRequest("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({}),
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

      const req = createRequest("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ lessonId: "nonexistent" }),
      });
      const response = await POST(req);

      expect(response.status).toBe(404);
    });

    it("creates a new bookmark", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.lesson.findUnique as jest.Mock).mockResolvedValue({ id: "lesson-1" });
      (db.bookmark.findUnique as jest.Mock).mockResolvedValue(null);
      (db.bookmark.create as jest.Mock).mockResolvedValue({
        id: "bookmark-1",
        userId: "user-1",
        lessonId: "lesson-1",
        note: null,
      });

      const req = createRequest("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ lessonId: "lesson-1" }),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("bookmark-1");
    });

    it("updates existing bookmark when it already exists", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.lesson.findUnique as jest.Mock).mockResolvedValue({ id: "lesson-1" });
      (db.bookmark.findUnique as jest.Mock).mockResolvedValue({
        id: "bookmark-1",
        userId: "user-1",
        lessonId: "lesson-1",
      });
      (db.bookmark.update as jest.Mock).mockResolvedValue({
        id: "bookmark-1",
        userId: "user-1",
        lessonId: "lesson-1",
        note: "Updated note",
      });

      const req = createRequest("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ lessonId: "lesson-1", note: "Updated note" }),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.note).toBe("Updated note");
    });
  });

  describe("DELETE /api/bookmarks", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as any);

      const req = createRequest("/api/bookmarks?lessonId=lesson-1", {
        method: "DELETE",
      });
      const response = await DELETE(req);

      expect(response.status).toBe(401);
    });

    it("returns 400 when lessonId is missing", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      const req = createRequest("/api/bookmarks", {
        method: "DELETE",
      });
      const response = await DELETE(req);

      expect(response.status).toBe(400);
    });

    it("deletes a bookmark", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
        expires: "",
      } as any);

      (db.bookmark.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const req = createRequest("/api/bookmarks?lessonId=lesson-1", {
        method: "DELETE",
      });
      const response = await DELETE(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Bookmark removed");
      expect(db.bookmark.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1", lessonId: "lesson-1" },
      });
    });
  });
});
