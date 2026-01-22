import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  PlusCircle,
  Edit,
  BarChart3,
  Users,
  Eye,
  EyeOff,
  Search,
  ArrowLeft,
} from "lucide-react";

interface SearchParams {
  search?: string;
  status?: string;
  sort?: string;
}

async function getInstructorCourses(userId: string, searchParams: SearchParams) {
  const { search, status, sort } = searchParams;

  const where: Record<string, unknown> = {
    instructorId: userId,
  };

  // Filter by search term
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter by status
  if (status === "published") {
    where.isPublished = true;
  } else if (status === "draft") {
    where.isPublished = false;
  }

  const courses = await db.course.findMany({
    where,
    include: {
      chapters: {
        include: {
          lessons: true,
        },
      },
      category: true,
      _count: {
        select: {
          enrollments: true,
          chapters: true,
        },
      },
    },
    orderBy:
      sort === "title"
        ? { title: "asc" as const }
        : sort === "enrollments"
          ? { enrollments: { _count: "desc" as const } }
          : sort === "created"
            ? { createdAt: "desc" as const }
            : { updatedAt: "desc" as const },
  });

  return courses;
}

export default async function InstructorCoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is instructor or admin
  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
    redirect("/student");
  }

  const params = await searchParams;
  const courses = await getInstructorCourses(session.user.id, params);

  const totalLessons = courses.reduce(
    (acc, course) =>
      acc +
      course.chapters.reduce(
        (chapterAcc, chapter) => chapterAcc + chapter.lessons.length,
        0
      ),
    0
  );

  const publishedCount = courses.filter((c) => c.isPublished).length;
  const draftCount = courses.filter((c) => !c.isPublished).length;

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/instructor">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground">
              Manage and organize all your courses
            </p>
          </div>
        </div>
        <Button asChild className="btn-hover-lift">
          <Link href="/instructor/courses/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedCount}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <EyeOff className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{draftCount}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {courses.reduce((acc, c) => acc + c._count.enrollments, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search courses..."
                defaultValue={params.search}
                className="pl-10"
              />
            </div>
            <Select name="status" defaultValue={params.status || "all"}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select name="sort" defaultValue={params.sort || "updated"}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="enrollments">Most Students</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {courses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => (
            <Card
              key={course.id}
              hover
              className="cascade-item overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="aspect-video bg-gradient-blue-subtle relative">
                {course.imageUrl ? (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-primary/50" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.isPublished
                        ? "bg-green-500/20 text-green-600"
                        : "bg-yellow-500/20 text-yellow-600"
                    }`}
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                {course.category && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm">
                      {course.category.name}
                    </span>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{course._count.chapters} chapters</span>
                  <span>
                    {course.chapters.reduce(
                      (acc, ch) => acc + ch.lessons.length,
                      0
                    )}{" "}
                    lessons
                  </span>
                  <span>{course._count.enrollments} students</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/instructor/courses/${course.id}`}>
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/instructor/courses/${course.id}/analytics`}>
                      <BarChart3 className="mr-1 h-3 w-3" />
                      Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {params.search || params.status
                ? "No courses found"
                : "No courses yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {params.search || params.status
                ? "Try adjusting your filters"
                : "Create your first course to start teaching"}
            </p>
            {!params.search && !params.status && (
              <Button asChild>
                <Link href="/instructor/courses/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Course
                </Link>
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
