/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    user: { findMany: jest.fn() },
    enrollment: { findMany: jest.fn() },
    course: { findMany: jest.fn() },
    certificate: { findMany: jest.fn() },
    quizAttempt: { findMany: jest.fn() },
  },
}));

import { GET } from "@/app/api/reports/export/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

function createRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("Reports Export API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);

    const req = createRequest("/api/reports/export?type=users");
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", role: "STUDENT" },
      expires: "",
    } as any);

    const req = createRequest("/api/reports/export?type=users");
    const response = await GET(req);

    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid export type", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com", role: "ADMIN" },
      expires: "",
    } as any);

    const req = createRequest("/api/reports/export?type=invalid");
    const response = await GET(req);

    expect(response.status).toBe(400);
  });

  it("exports users as CSV", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com", role: "ADMIN" },
      expires: "",
    } as any);

    (db.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: "user-1",
        name: "Test User",
        email: "user@test.com",
        role: "STUDENT",
        createdAt: new Date("2024-01-15"),
        _count: { enrollments: 3, certificates: 1 },
      },
    ]);

    const req = createRequest("/api/reports/export?type=users");
    const response = await GET(req);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("users-export.csv");
    expect(text).toContain("ID,Name,Email,Role,Enrollments,Certificates,Joined");
    expect(text).toContain("user-1,Test User,user@test.com,STUDENT,3,1,2024-01-15");
  });

  it("exports enrollments as CSV", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com", role: "ADMIN" },
      expires: "",
    } as any);

    (db.enrollment.findMany as jest.Mock).mockResolvedValue([
      {
        user: { name: "Test User", email: "user@test.com" },
        course: { title: "Test Course" },
        createdAt: new Date("2024-01-15"),
        completedAt: null,
      },
    ]);

    const req = createRequest("/api/reports/export?type=enrollments");
    const response = await GET(req);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("Student Name,Student Email,Course,Enrolled Date,Completed Date");
    expect(text).toContain("Test User,user@test.com,Test Course,2024-01-15,In Progress");
  });

  it("exports courses as CSV", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com", role: "ADMIN" },
      expires: "",
    } as any);

    (db.course.findMany as jest.Mock).mockResolvedValue([
      {
        title: "Test Course",
        instructor: { name: "Instructor" },
        category: { name: "Tech" },
        isPublished: true,
        createdAt: new Date("2024-01-15"),
        _count: { chapters: 5, enrollments: 10 },
      },
    ]);

    const req = createRequest("/api/reports/export?type=courses");
    const response = await GET(req);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain("courses-export.csv");
    expect(text).toContain("Title,Instructor,Category,Chapters,Enrollments,Published,Created");
    expect(text).toContain("Test Course,Instructor,Tech,5,10,Yes,2024-01-15");
  });

  it("exports certificates as CSV", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com", role: "ADMIN" },
      expires: "",
    } as any);

    (db.certificate.findMany as jest.Mock).mockResolvedValue([
      {
        user: { name: "Test User", email: "user@test.com" },
        course: { title: "Test Course" },
        uniqueCode: "CERT-ABC123",
        issuedAt: new Date("2024-02-01"),
      },
    ]);

    const req = createRequest("/api/reports/export?type=certificates");
    const response = await GET(req);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("Student Name,Student Email,Course,Certificate Code,Issued Date");
    expect(text).toContain("Test User,user@test.com,Test Course,CERT-ABC123,2024-02-01");
  });

  it("exports quiz attempts as CSV", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com", role: "ADMIN" },
      expires: "",
    } as any);

    (db.quizAttempt.findMany as jest.Mock).mockResolvedValue([
      {
        user: { name: "Test User", email: "user@test.com" },
        quiz: {
          title: "Quiz 1",
          chapter: { course: { title: "Test Course" } },
        },
        score: 85,
        passed: true,
        completedAt: new Date("2024-02-15"),
      },
    ]);

    const req = createRequest("/api/reports/export?type=quiz-attempts");
    const response = await GET(req);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("Student Name,Student Email,Course,Quiz,Score,Passed,Date");
    expect(text).toContain("Test User,user@test.com,Test Course,Quiz 1,85,Yes,2024-02-15");
  });

  it("handles CSV escaping for values with commas", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com", role: "ADMIN" },
      expires: "",
    } as any);

    (db.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: "user-1",
        name: "Last, First",
        email: "user@test.com",
        role: "STUDENT",
        createdAt: new Date("2024-01-15"),
        _count: { enrollments: 0, certificates: 0 },
      },
    ]);

    const req = createRequest("/api/reports/export?type=users");
    const response = await GET(req);
    const text = await response.text();

    expect(text).toContain('"Last, First"');
  });

  it("defaults to users export type when no type specified", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com", role: "ADMIN" },
      expires: "",
    } as any);

    (db.user.findMany as jest.Mock).mockResolvedValue([]);

    const req = createRequest("/api/reports/export");
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(db.user.findMany).toHaveBeenCalled();
  });
});
