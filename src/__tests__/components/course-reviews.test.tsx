import { render, screen, waitFor } from "../test-utils";
import { CourseReviews } from "@/components/courses/course-reviews";

global.fetch = jest.fn();

describe("CourseReviews", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves
    render(<CourseReviews courseId="course-1" isEnrolled={false} />);
    // The component renders a loader during fetch
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("displays reviews after loading", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviews: [
          {
            id: "review-1",
            rating: 5,
            title: "Great course",
            content: "Learned a lot",
            createdAt: "2024-01-15T00:00:00Z",
            user: { id: "user-1", name: "John", image: null },
          },
        ],
        stats: {
          averageRating: 5,
          totalReviews: 1,
          distribution: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      }),
    });

    render(<CourseReviews courseId="course-1" isEnrolled={false} />);

    await waitFor(() => {
      expect(screen.getByText("Student Reviews")).toBeInTheDocument();
    });

    expect(screen.getByText("Great course")).toBeInTheDocument();
    expect(screen.getByText("Learned a lot")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("5.0")).toBeInTheDocument();
    expect(screen.getByText("1 review")).toBeInTheDocument();
  });

  it("shows empty state when no reviews and not enrolled", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviews: [],
        stats: { averageRating: 0, totalReviews: 0, distribution: {} },
      }),
    });

    render(<CourseReviews courseId="course-1" isEnrolled={false} />);

    await waitFor(() => {
      expect(
        screen.getByText("No reviews yet. Be the first to review this course!")
      ).toBeInTheDocument();
    });
  });

  it("shows write review button when enrolled", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviews: [],
        stats: { averageRating: 0, totalReviews: 0, distribution: {} },
      }),
    });

    render(
      <CourseReviews courseId="course-1" isEnrolled={true} userId="user-1" />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /write a review/i })
      ).toBeInTheDocument();
    });
  });

  it("does not show write review button when not enrolled", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviews: [],
        stats: { averageRating: 0, totalReviews: 0, distribution: {} },
      }),
    });

    render(<CourseReviews courseId="course-1" isEnrolled={false} />);

    await waitFor(() => {
      expect(screen.getByText("Student Reviews")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: /write a review/i })
    ).not.toBeInTheDocument();
  });

  it("opens review form when write button is clicked", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviews: [],
        stats: { averageRating: 0, totalReviews: 0, distribution: {} },
      }),
    });

    const { user } = render(
      <CourseReviews courseId="course-1" isEnrolled={true} userId="user-1" />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /write a review/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /write a review/i }));

    expect(screen.getByPlaceholderText("Review title (optional)")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Share your experience with this course...")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit review/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows edit button when user already has a review", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviews: [
          {
            id: "review-1",
            rating: 4,
            title: "Good",
            content: "Nice",
            createdAt: "2024-01-15T00:00:00Z",
            user: { id: "user-1", name: "John", image: null },
          },
        ],
        stats: {
          averageRating: 4,
          totalReviews: 1,
          distribution: { 5: 0, 4: 1, 3: 0, 2: 0, 1: 0 },
        },
      }),
    });

    render(
      <CourseReviews courseId="course-1" isEnrolled={true} userId="user-1" />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /edit your review/i })
      ).toBeInTheDocument();
    });
  });

  it("displays rating distribution", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviews: [
          {
            id: "review-1",
            rating: 5,
            title: null,
            content: null,
            createdAt: "2024-01-15T00:00:00Z",
            user: { id: "user-1", name: "Alice", image: null },
          },
          {
            id: "review-2",
            rating: 4,
            title: null,
            content: null,
            createdAt: "2024-01-16T00:00:00Z",
            user: { id: "user-2", name: "Bob", image: null },
          },
        ],
        stats: {
          averageRating: 4.5,
          totalReviews: 2,
          distribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 },
        },
      }),
    });

    render(<CourseReviews courseId="course-1" isEnrolled={false} />);

    await waitFor(() => {
      expect(screen.getByText("4.5")).toBeInTheDocument();
      expect(screen.getByText("2 reviews")).toBeInTheDocument();
    });
  });
});
