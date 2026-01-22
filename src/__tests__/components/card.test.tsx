import { render, screen } from "../test-utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

describe("Card", () => {
  it("renders card with all parts", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test content</p>
        </CardContent>
        <CardFooter>
          <p>Test footer</p>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(screen.getByText("Test footer")).toBeInTheDocument();
  });

  it("applies custom className to Card", () => {
    render(<Card className="custom-class">Content</Card>);
    const card = screen.getByText("Content").closest(".custom-class");
    expect(card).toBeInTheDocument();
  });

  it("renders CardTitle with correct heading", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Title</CardTitle>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText("My Title")).toHaveClass("tracking-tight");
  });

  it("renders CardDescription with muted styles", () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>My Description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText("My Description")).toHaveClass("text-muted-foreground");
  });
});
