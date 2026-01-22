import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ChatRoom } from "@/components/chat/chat-room";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

async function getChatRoomData(roomId: string, userId: string) {
  const chatRoom = await db.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      course: {
        include: {
          instructor: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: { enrollments: true },
          },
        },
      },
    },
  });

  if (!chatRoom) {
    return null;
  }

  // Verify access
  const isInstructor = chatRoom.course.instructorId === userId;
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: chatRoom.course.id,
      },
    },
  });

  if (!isInstructor && !enrollment) {
    return null;
  }

  // Get initial messages
  const messages = await db.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { id: true, name: true, image: true, role: true },
      },
    },
  });

  // Reverse to get chronological order
  messages.reverse();

  return {
    room: {
      id: chatRoom.id,
      courseId: chatRoom.course.id,
      courseTitle: chatRoom.course.title,
      courseImage: chatRoom.course.imageUrl,
      instructor: chatRoom.course.instructor,
      memberCount: chatRoom.course._count.enrollments + 1,
    },
    messages,
    isInstructor,
    currentUserId: userId,
  };
}

export default async function ChatRoomPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { roomId } = await params;
  const data = await getChatRoomData(roomId, session.user.id);

  if (!data) {
    notFound();
  }

  return (
    <ChatRoom
      room={data.room}
      initialMessages={data.messages}
      currentUserId={data.currentUserId}
      isInstructor={data.isInstructor}
    />
  );
}
