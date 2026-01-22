import { db } from "@/lib/db";
import Link from "next/link";
import { Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserSearch } from "@/components/admin/user-search";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
  }>;
}

async function getUsers(page: number, search: string, role: string) {
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(role && { role: role as "STUDENT" | "INSTRUCTOR" | "ADMIN" }),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            courses: true,
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

function getRoleBadge(role: string) {
  switch (role) {
    case "ADMIN":
      return <Badge variant="destructive">Admin</Badge>;
    case "INSTRUCTOR":
      return <Badge variant="secondary">Instructor</Badge>;
    default:
      return <Badge variant="outline">Student</Badge>;
  }
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { page: pageParam, search, role } = await searchParams;
  const page = parseInt(pageParam || "1");

  const { users, pagination } = await getUsers(page, search || "", role || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">
            {pagination.total} users total
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <UserSearch currentSearch={search || ""} currentRole={role || ""} />

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              users.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback>
                      {user.name?.[0] || user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {user.name || "Unnamed"}
                      </p>
                      {getRoleBadge(user.role)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                    {user.role === "INSTRUCTOR" && (
                      <div className="text-center">
                        <p className="font-medium text-foreground">
                          {user._count.courses}
                        </p>
                        <p>Courses</p>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-medium text-foreground">
                        {user._count.enrollments}
                      </p>
                      <p>Enrollments</p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <p>
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p>Joined</p>
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
                href={`/admin/users?page=${page - 1}${
                  search ? `&search=${search}` : ""
                }${role ? `&role=${role}` : ""}`}
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
                href={`/admin/users?page=${page + 1}${
                  search ? `&search=${search}` : ""
                }${role ? `&role=${role}` : ""}`}
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
