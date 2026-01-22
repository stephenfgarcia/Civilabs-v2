import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  MessageSquare,
  Users,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function getChatRooms(userId: string) {
  // Get courses user is enrolled in (only published ones)
  const enrolledCourses = await db.course.findMany({
    where: {
      isPublished: true,
      enrollments: {
        some: { userId },
      },
    },
    include: {
      instructor: {
        select: { id: true, name: true, image: true },
      },
      chatRoom: true,
      _count: {
        select: { enrollments: true },
      },
    },
  });

  // Get courses user is instructing
  const instructorCourses = await db.course.findMany({
    where: {
      instructorId: userId,
      isPublished: true,
    },
    include: {
      instructor: {
        select: { id: true, name: true, image: true },
      },
      chatRoom: true,
      _count: {
        select: { enrollments: true },
      },
    },
  });

  // Combine and deduplicate
  const courseMap = new Map();

  for (const course of enrolledCourses) {
    courseMap.set(course.id, {
      ...course,
      memberCount: course._count.enrollments + 1,
      role: "student",
    });
  }

  for (const course of instructorCourses) {
    courseMap.set(course.id, {
      ...course,
      memberCount: course._count.enrollments + 1,
      role: "instructor",
    });
  }

  // Get chat rooms with latest messages
  const chatRooms = await Promise.all(
    Array.from(courseMap.values()).map(async (course) => {
      let chatRoom = course.chatRoom;

      // Create chat room if it doesn't exist
      if (!chatRoom) {
        chatRoom = await db.chatRoom.create({
          data: { courseId: course.id },
        });
      }

      const latestMessage = await db.message.findFirst({
        where: { roomId: chatRoom.id },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true },
          },
        },
      });

      return {
        id: chatRoom.id,
        courseId: course.id,
        courseTitle: course.title,
        courseImage: course.imageUrl,
        instructor: course.instructor,
        memberCount: course.memberCount,
        role: course.role,
        latestMessage: latestMessage
          ? {
              content: latestMessage.content,
              userName: latestMessage.user.name,
              createdAt: latestMessage.createdAt,
            }
          : null,
      };
    })
  );

  // Sort by latest message
  chatRooms.sort((a, b) => {
    if (!a.latestMessage) return 1;
    if (!b.latestMessage) return -1;
    return (
      new Date(b.latestMessage.createdAt).getTime() -
      new Date(a.latestMessage.createdAt).getTime()
    );
  });

  return chatRooms;
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

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const chatRooms = await getChatRooms(session.user.id);

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Chat</h1>
        <p className="text-muted-foreground mt-1">
          Connect with your course communities
        </p>
      </div>

      {/* Chat Rooms List */}
      <div className="space-y-3">
        {chatRooms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-2">No chat rooms available</p>
              <p className="text-sm text-muted-foreground">
                Enroll in a course to join its chat room
              </p>
            </CardContent>
          </Card>
        ) : (
          chatRooms.map((room, index) => (
            <Link
              key={room.id}
              href={`/chat/${room.id}`}
              className="block cascade-item"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Course Image */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {room.courseImage ? (
                        <img
                          src={room.courseImage}
                          alt={room.courseTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-blue-subtle">
                          <BookOpen className="h-6 w-6 text-primary/50" />
                        </div>
                      )}
                    </div>

                    {/* Room Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">
                          {room.courseTitle}
                        </h3>
                        {room.role === "instructor" && (
                          <Badge variant="secondary" className="text-xs">
                            Instructor
                          </Badge>
                        )}
                      </div>
                      {room.latestMessage ? (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          <span className="font-medium">
                            {room.latestMessage.userName}:
                          </span>{" "}
                          {room.latestMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          No messages yet - start the conversation!
                        </p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {room.latestMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(room.latestMessage.createdAt)}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {room.memberCount}
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
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
