import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  MessageSquare,
  Users,
  Clock,
  ChevronRight,
  Plus,
  MessageCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

async function getForumData() {
  const categories = await db.forumCategory.findMany({
    orderBy: { position: "asc" },
    include: {
      _count: {
        select: { threads: true },
      },
      threads: {
        take: 1,
        orderBy: { updatedAt: "desc" },
        include: {
          user: {
            select: { name: true, image: true },
          },
          _count: {
            select: { replies: true },
          },
        },
      },
    },
  });

  // Get total reply count per category
  const categoriesWithStats = await Promise.all(
    categories.map(async (category) => {
      const replyCount = await db.forumReply.count({
        where: {
          thread: {
            categoryId: category.id,
          },
        },
      });

      return {
        ...category,
        threadCount: category._count.threads,
        replyCount,
        latestThread: category.threads[0] || null,
      };
    })
  );

  return categoriesWithStats;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default async function ForumsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const categories = await getForumData();

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discussion Forums</h1>
          <p className="text-muted-foreground mt-1">
            Connect with the community and discuss topics
          </p>
        </div>
        {session.user.role === "ADMIN" && (
          <Button asChild>
            <Link href="/forums/admin">
              <Plus className="h-4 w-4 mr-2" />
              Manage Forums
            </Link>
          </Button>
        )}
      </div>

      {/* Forum Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categories.reduce((acc, c) => acc + c.threadCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Threads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-full">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categories.reduce((acc, c) => acc + c.replyCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Replies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                No forum categories yet
              </p>
              {session.user.role === "ADMIN" && (
                <Button asChild>
                  <Link href="/forums/admin">Create First Category</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/forums/${category.slug}`}
              className="block cascade-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`p-3 rounded-lg ${
                        category.color || "bg-primary/10"
                      }`}
                    >
                      <MessageSquare
                        className={`h-6 w-6 ${
                          category.color
                            ? "text-white"
                            : "text-primary"
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {category.name}
                        </h3>
                      </div>
                      {category.description && (
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
                          {category.description}
                        </p>
                      )}

                      {/* Latest Thread */}
                      {category.latestThread && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={category.latestThread.user.image || undefined}
                            />
                            <AvatarFallback className="text-xs">
                              {category.latestThread.user.name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[200px]">
                            {category.latestThread.title}
                          </span>
                          <span className="text-muted-foreground/50">by</span>
                          <span>{category.latestThread.user.name}</span>
                          <Clock className="h-3 w-3 ml-2" />
                          <span>
                            {formatRelativeTime(category.latestThread.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">
                          {category.threadCount}
                        </p>
                        <p>Threads</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">
                          {category.replyCount}
                        </p>
                        <p>Replies</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
