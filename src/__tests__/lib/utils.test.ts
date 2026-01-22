import {
  cn,
  getInitials,
  formatDuration,
  slugify,
  formatDate,
  truncate,
  calculateProgress,
} from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("handles undefined values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("handles tailwind class conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("getInitials", () => {
  it("returns initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns single initial for single name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("handles multiple names - returns first two", () => {
    expect(getInitials("John Michael Doe")).toBe("JM");
  });

  it("handles lowercase names", () => {
    expect(getInitials("john doe")).toBe("JD");
  });
});

describe("formatDuration", () => {
  it("formats seconds to mm:ss", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("formats minutes", () => {
    expect(formatDuration(120)).toBe("2:00");
  });

  it("formats hours", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0:00");
  });
});

describe("slugify", () => {
  it("converts string to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(slugify("Hello    World")).toBe("hello-world");
  });
});

describe("formatDate", () => {
  it("formats a date object", () => {
    const date = new Date("2024-01-15");
    expect(formatDate(date)).toMatch(/Jan 1[45], 2024/);
  });

  it("formats a date string", () => {
    expect(formatDate("2024-06-20")).toMatch(/Jun (19|20), 2024/);
  });
});

describe("truncate", () => {
  it("truncates text longer than limit", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("returns original text if shorter than limit", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });

  it("returns original text if equal to limit", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });
});

describe("calculateProgress", () => {
  it("calculates progress percentage", () => {
    expect(calculateProgress(5, 10)).toBe(50);
  });

  it("returns 0 when total is 0", () => {
    expect(calculateProgress(5, 0)).toBe(0);
  });

  it("returns 100 when complete", () => {
    expect(calculateProgress(10, 10)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(calculateProgress(1, 3)).toBe(33);
  });
});
