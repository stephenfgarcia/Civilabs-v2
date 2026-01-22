import { db } from "@/lib/db";
import Link from "next/link";
import {
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CourseSearch } from "@/components/admin/course-search";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    categoryId?: string;
  }>;
}

async function getCourses(
  page: number,
  search: string,
  status: string,
  categoryId: string
) {
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        {
          instructor: {
            name: { contains: search, mode: "insensitive" as const },
          },
        },
      ],
    }),
    ...(status === "published" && { isPublished: true }),
    ...(status === "draft" && { isPublished: false }),
    ...(categoryId && { categoryId }),
  };

  const [courses, total, categories] = await Promise.all([
    db.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        instructor: {
          select: { id: true, name: true, image: true },
        },
        category: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            enrollments: true,
            chapters: true,
          },
        },
      },
    }),
    db.course.count({ where }),
    db.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    courses,
    categories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export default async function AdminCoursesPage({ searchParams }: PageProps) {
  const {
    page: pageParam,
    search,
    status,
    categoryId,
  } = await searchParams;
  const page = parseInt(pageParam || "1");

  const { courses, categories, pagination } = await getCourses(
    page,
    search || "",
    status || "",
    categoryId || ""
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Course Management</h2>
          <p className="text-sm text-muted-foreground">
            {pagination.total} courses total
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <CourseSearch
        currentSearch={search || ""}
        currentStatus={status || ""}
        currentCategoryId={categoryId || ""}
        categories={categories}
      />

      {/* Courses List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {courses.length === 0 ? (
              <div className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No courses found</p>
              </div>
            ) : (
              courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/admin/courses/${course.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{course.title}</p>
                      {course.isPublished ? (
                        <Badge variant="default" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={course.instructor.image || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {course.instructor.name?.[0] || "I"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {course.instructor.name}
                      </span>
                      {course.category && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <Badge variant="outline" className="text-xs">
                            {course.category.name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="font-medium text-foreground">
                        {course._count.chapters}
                      </p>
                      <p>Chapters</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">
                        {course._count.enrollments}
                      </p>
                      <p>Students</p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <p>
                        {new Date(course.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p>Created</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link
                href={`/admin/courses?page=${page - 1}${
                  search ? `&search=${search}` : ""
                }${status ? `&status=${status}` : ""}${
                  categoryId ? `&categoryId=${categoryId}` : ""
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Link>
            </Button>
          )}
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          {page < pagination.totalPages && (
            <Button variant="outline" asChild>
              <Link
                href={`/admin/courses?page=${page + 1}${
                  search ? `&search=${search}` : ""
                }${status ? `&status=${status}` : ""}${
                  categoryId ? `&categoryId=${categoryId}` : ""
                }`}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
