import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  Eye,
  Pin,
  Lock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreateThreadDialog } from "@/components/forums/create-thread-dialog";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getCategoryWithThreads(slug: string, page: number) {
  const category = await db.forumCategory.findUnique({
    where: { slug },
  });

  if (!category) {
    return null;
  }

  const limit = 20;
  const skip = (page - 1) * limit;

  const threads = await db.forumThread.findMany({
    where: { categoryId: category.id },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    skip,
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  const totalThreads = await db.forumThread.count({
    where: { categoryId: category.id },
  });

  return {
    category,
    threads: threads.map((thread) => ({
      ...thread,
      replyCount: thread._count.replies,
    })),
    pagination: {
      page,
      limit,
      total: totalThreads,
      totalPages: Math.ceil(totalThreads / limit),
    },
  };
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

export default async function ForumCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { categorySlug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1");

  const data = await getCategoryWithThreads(categorySlug, page);

  if (!data) {
    notFound();
  }

  const { category, threads, pagination } = data;

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/forums">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-1">{category.description}</p>
          )}
        </div>
        <CreateThreadDialog categoryId={category.id}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        </CreateThreadDialog>
      </div>

      {/* Threads List */}
      <div className="space-y-3">
        {threads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                No threads in this category yet
              </p>
              <CreateThreadDialog categoryId={category.id}>
                <Button>Start the First Thread</Button>
              </CreateThreadDialog>
            </CardContent>
          </Card>
        ) : (
          threads.map((thread, index) => (
            <Link
              key={thread.id}
              href={`/forums/${categorySlug}/${thread.id}`}
              className="block cascade-item"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Author Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={thread.user.image || undefined} />
                      <AvatarFallback>
                        {thread.user.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {thread.isPinned && (
                          <Badge variant="secondary" className="gap-1">
                            <Pin className="h-3 w-3" />
                            Pinned
                          </Badge>
                        )}
                        {thread.isLocked && (
                          <Badge variant="outline" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </Badge>
                        )}
                        <h3 className="font-medium hover:text-primary transition-colors line-clamp-1">
                          {thread.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>by {thread.user.name}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(thread.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{thread.replyCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{thread.views}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link href={`/forums/${categorySlug}?page=${page - 1}`}>
                Previous
              </Link>
            </Button>
          )}
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          {page < pagination.totalPages && (
            <Button variant="outline" asChild>
              <Link href={`/forums/${categorySlug}?page=${page + 1}`}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
