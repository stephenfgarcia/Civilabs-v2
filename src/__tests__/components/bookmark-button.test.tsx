import { render, screen, waitFor } from "../test-utils";
import { BookmarkButton } from "@/components/learn/bookmark-button";

// Mock fetch
global.fetch = jest.fn();

describe("BookmarkButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders unbookmarked state", () => {
    render(<BookmarkButton lessonId="lesson-1" isBookmarked={false} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("renders bookmarked state", () => {
    render(<BookmarkButton lessonId="lesson-1" isBookmarked={true} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("adds bookmark on click when not bookmarked", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "bookmark-1" }),
    });

    const { user } = render(
      <BookmarkButton lessonId="lesson-1" isBookmarked={false} />
    );

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: "lesson-1" }),
      });
    });
  });

  it("removes bookmark on click when bookmarked", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Removed" }),
    });

    const { user } = render(
      <BookmarkButton lessonId="lesson-1" isBookmarked={true} />
    );

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/bookmarks?lessonId=lesson-1",
        { method: "DELETE" }
      );
    });
  });

  it("handles fetch error gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { user } = render(
      <BookmarkButton lessonId="lesson-1" isBookmarked={false} />
    );

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to toggle bookmark:",
        expect.any(Error)
      );
    });

    // Button should still be usable after error
    expect(screen.getByRole("button")).not.toBeDisabled();
    consoleSpy.mockRestore();
  });
});
