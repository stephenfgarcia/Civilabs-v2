import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Eye,
  Pin,
  Lock,
  MoreVertical,
  Pencil,
  Trash2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReplyForm } from "@/components/forums/reply-form";
import { ThreadActions } from "@/components/forums/thread-actions";

interface PageProps {
  params: Promise<{ categorySlug: string; threadId: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getThreadWithReplies(threadId: string, page: number) {
  const thread = await db.forumThread.findUnique({
    where: { id: threadId },
    include: {
      user: {
        select: { id: true, name: true, image: true, role: true },
      },
      category: true,
    },
  });

  if (!thread) {
    return null;
  }

  // Increment view count
  await db.forumThread.update({
    where: { id: threadId },
    data: { views: { increment: 1 } },
  });

  const limit = 20;
  const skip = (page - 1) * limit;

  const replies = await db.forumReply.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    skip,
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, image: true, role: true },
      },
    },
  });

  const totalReplies = await db.forumReply.count({
    where: { threadId },
  });

  return {
    thread: {
      ...thread,
      views: thread.views + 1,
    },
    replies,
    pagination: {
      page,
      limit,
      total: totalReplies,
      totalPages: Math.ceil(totalReplies / limit),
    },
  };
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRoleBadge(role: string) {
  switch (role) {
    case "ADMIN":
      return (
        <Badge variant="destructive" className="gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      );
    case "INSTRUCTOR":
      return <Badge variant="secondary">Instructor</Badge>;
    default:
      return null;
  }
}

export default async function ThreadPage({ params, searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { categorySlug, threadId } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1");

  const data = await getThreadWithReplies(threadId, page);

  if (!data) {
    notFound();
  }

  const { thread, replies, pagination } = data;

  const isAuthor = thread.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const canModerate = isAuthor || isAdmin;

  return (
    <div className="space-y-6 page-transition max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/forums/${categorySlug}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/forums"
              className="hover:text-primary transition-colors"
            >
              Forums
            </Link>
            {" / "}
            <Link
              href={`/forums/${categorySlug}`}
              className="hover:text-primary transition-colors"
            >
              {thread.category.name}
            </Link>
          </p>
        </div>
      </div>

      {/* Thread */}
      <Card className="animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
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
              </div>
              <h1 className="text-2xl font-bold">{thread.title}</h1>
            </div>

            {canModerate && (
              <ThreadActions
                threadId={thread.id}
                categorySlug={categorySlug}
                isAuthor={isAuthor}
                isAdmin={isAdmin}
                isPinned={thread.isPinned}
                isLocked={thread.isLocked}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* Author Info */}
            <div className="flex flex-col items-center gap-2 w-24 flex-shrink-0">
              <Avatar className="h-16 w-16">
                <AvatarImage src={thread.user.image || undefined} />
                <AvatarFallback className="text-xl">
                  {thread.user.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-medium text-sm">{thread.user.name}</p>
                {getRoleBadge(thread.user.role)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{thread.content}</div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDate(thread.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {thread.views} views
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {pagination.total} {pagination.total === 1 ? "Reply" : "Replies"}
          </h2>
          {replies.map((reply, index) => (
            <Card
              key={reply.id}
              className="cascade-item"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Author Info */}
                  <div className="flex flex-col items-center gap-2 w-24 flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={reply.user.image || undefined} />
                      <AvatarFallback>
                        {reply.user.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="font-medium text-sm">{reply.user.name}</p>
                      {getRoleBadge(reply.user.role)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="prose prose-blue dark:prose-invert max-w-none text-sm">
                      <div className="whitespace-pre-wrap">{reply.content}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(reply.createdAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link
                href={`/forums/${categorySlug}/${threadId}?page=${page - 1}`}
              >
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
                href={`/forums/${categorySlug}/${threadId}?page=${page + 1}`}
              >
                Next
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Reply Form */}
      {!thread.isLocked ? (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <h3 className="font-semibold">Post a Reply</h3>
          </CardHeader>
          <CardContent>
            <ReplyForm threadId={thread.id} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>This thread is locked. No new replies can be posted.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
