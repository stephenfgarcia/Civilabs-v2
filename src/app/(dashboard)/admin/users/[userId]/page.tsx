import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Calendar,
  BookOpen,
  GraduationCap,
  Award,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { UserDeleteButton } from "@/components/admin/user-delete-button";

interface PageProps {
  params: Promise<{ userId: string }>;
}

async function getUser(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      bio: true,
      createdAt: true,
      enrollments: {
        include: {
          course: {
            select: { id: true, title: true, imageUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      courses: {
        select: {
          id: true,
          title: true,
          isPublished: true,
          imageUrl: true,
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      certificates: {
        include: {
          course: {
            select: { title: true },
          },
        },
        orderBy: { issuedAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          enrollments: true,
          courses: true,
          certificates: true,
          forumThreads: true,
          forumReplies: true,
        },
      },
    },
  });
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

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const user = await getUser(userId);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">User Details</h2>
        </div>
        <UserDeleteButton userId={user.id} userName={user.name || user.email} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Info */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">
                {user.name || "Unnamed User"}
              </h3>
              <div className="mt-1">{getRoleBadge(user.role)}</div>

              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>

              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Joined{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              {user.bio && (
                <p className="mt-4 text-sm text-muted-foreground">{user.bio}</p>
              )}
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Change Role</label>
                <UserRoleSelect userId={user.id} currentRole={user.role} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats and Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <GraduationCap className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{user._count.enrollments}</p>
                <p className="text-sm text-muted-foreground">Enrollments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{user._count.courses}</p>
                <p className="text-sm text-muted-foreground">Courses Created</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Award className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <p className="text-2xl font-bold">{user._count.certificates}</p>
                <p className="text-sm text-muted-foreground">Certificates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageSquare className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold">
                  {user._count.forumThreads + user._count.forumReplies}
                </p>
                <p className="text-sm text-muted-foreground">Forum Posts</p>
              </CardContent>
            </Card>
          </div>

          {/* Courses Created (if instructor) */}
          {user.courses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Courses Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.courses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/admin/courses/${course.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-12 h-8 rounded bg-muted overflow-hidden">
                        {course.imageUrl ? (
                          <img
                            src={course.imageUrl}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{course.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {course._count.enrollments} students
                        </p>
                      </div>
                      <Badge
                        variant={course.isPublished ? "default" : "secondary"}
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Enrollments */}
          {user.enrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Recent Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="w-12 h-8 rounded bg-muted overflow-hidden">
                        {enrollment.course.imageUrl ? (
                          <img
                            src={enrollment.course.imageUrl}
                            alt={enrollment.course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {enrollment.course.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Enrolled{" "}
                          {new Date(enrollment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certificates */}
          {user.certificates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certificates Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="p-2 bg-yellow-500/10 rounded-full">
                        <Award className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {cert.course.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Issued{" "}
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
