import { render, screen, waitFor } from "../test-utils";
import { LearningPathEnrollButton } from "@/components/courses/learning-path-enroll-button";

global.fetch = jest.fn();

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    refresh: mockRefresh,
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe("LearningPathEnrollButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the enroll button", () => {
    render(<LearningPathEnrollButton pathId="path-1" />);
    const button = screen.getByRole("button", { name: /enroll/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("calls the enrollment API on click", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { user } = render(<LearningPathEnrollButton pathId="path-1" />);

    await user.click(screen.getByRole("button", { name: /enroll/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/learning-paths/path-1/enroll",
        { method: "POST" }
      );
    });
  });

  it("calls router.refresh on successful enrollment", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { user } = render(<LearningPathEnrollButton pathId="path-1" />);

    await user.click(screen.getByRole("button", { name: /enroll/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("does not call router.refresh on failed enrollment", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    const { user } = render(<LearningPathEnrollButton pathId="path-1" />);

    await user.click(screen.getByRole("button", { name: /enroll/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("handles fetch error gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { user } = render(<LearningPathEnrollButton pathId="path-1" />);

    await user.click(screen.getByRole("button", { name: /enroll/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to enroll:",
        expect.any(Error)
      );
    });

    // Button should still be usable
    expect(screen.getByRole("button", { name: /enroll/i })).not.toBeDisabled();
    consoleSpy.mockRestore();
  });
});
