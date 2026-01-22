"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Users, BookOpen, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { getPusherClient, getChannelName, PUSHER_EVENTS } from "@/lib/pusher";

interface User {
  id: string;
  name: string | null;
  image: string | null;
  role?: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  user: User;
}

interface Room {
  id: string;
  courseId: string;
  courseTitle: string;
  courseImage: string | null;
  instructor: User;
  memberCount: number;
}

interface ChatRoomProps {
  room: Room;
  initialMessages: Message[];
  currentUserId: string;
  isInstructor: boolean;
}

export function ChatRoom({
  room,
  initialMessages,
  currentUserId,
  isInstructor,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Subscribe to Pusher channel
  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = getChannelName.courseChat(room.courseId);
    const channel = pusher.subscribe(channelName);

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    channel.bind("pusher:subscription_error", () => {
      setIsConnected(false);
    });

    channel.bind(PUSHER_EVENTS.NEW_MESSAGE, (newMessage: Message) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    });

    channel.bind(
      PUSHER_EVENTS.MESSAGE_DELETED,
      ({ messageId }: { messageId: string }) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [room.courseId]);

  const handleSendMessage = async (content: string) => {
    try {
      const response = await fetch(`/api/chat/${room.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        // Only add if Pusher hasn't already added it
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(
        `/api/chat/${room.id}/messages/${messageId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chat">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {room.courseImage ? (
            <img
              src={room.courseImage}
              alt={room.courseTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-blue-subtle">
              <BookOpen className="h-5 w-5 text-primary/50" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{room.courseTitle}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{room.memberCount} members</span>
            {isConnected ? (
              <Badge variant="secondary" className="text-xs">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Connecting...
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={room.instructor.image || undefined} />
            <AvatarFallback className="text-xs">
              {room.instructor.name?.[0] || "I"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-sm">
            <p className="font-medium">{room.instructor.name}</p>
            <p className="text-xs text-muted-foreground">Instructor</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Info className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to start the conversation!
            </p>
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            isInstructor={isInstructor}
            onDelete={handleDeleteMessage}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4 bg-card">
        <MessageInput onSend={handleSendMessage} />
      </div>
    </div>
  );
}
