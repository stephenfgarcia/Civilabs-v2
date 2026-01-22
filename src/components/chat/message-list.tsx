"use client";

import { useState } from "react";
import { MoreVertical, Trash2, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isInstructor: boolean;
  onDelete: (messageId: string) => void;
}

function formatMessageTime(date: Date): string {
  const messageDate = new Date(date);
  const now = new Date();
  const isToday = messageDate.toDateString() === now.toDateString();

  if (isToday) {
    return messageDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = messageDate.toDateString() === yesterday.toDateString();

  if (isYesterday) {
    return `Yesterday ${messageDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }

  return messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRoleBadge(role: string | undefined) {
  if (role === "ADMIN") {
    return (
      <Badge variant="destructive" className="text-xs gap-1 ml-2">
        <Shield className="h-3 w-3" />
        Admin
      </Badge>
    );
  }
  if (role === "INSTRUCTOR") {
    return (
      <Badge variant="secondary" className="text-xs ml-2">
        Instructor
      </Badge>
    );
  }
  return null;
}

export function MessageList({
  messages,
  currentUserId,
  isInstructor,
  onDelete,
}: MessageListProps) {
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt).toDateString();
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({ date: messageDate, messages: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  return (
    <div className="space-y-6">
      {groupedMessages.map((group) => (
        <div key={group.date}>
          {/* Date Separator */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground px-2">
              {new Date(group.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {group.messages.map((message) => {
              const isOwn = message.userId === currentUserId;
              const canDelete = isOwn || isInstructor;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 group ${
                    isOwn ? "flex-row-reverse" : ""
                  }`}
                  onMouseEnter={() => setHoveredMessage(message.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.user.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {message.user.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Content */}
                  <div
                    className={`flex flex-col max-w-[70%] ${
                      isOwn ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {isOwn ? "You" : message.user.name}
                      </span>
                      {getRoleBadge(message.user.role)}
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {canDelete && hoveredMessage === message.id && (
                    <div
                      className={`flex items-center ${
                        isOwn ? "order-first" : ""
                      }`}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isOwn ? "start" : "end"}>
                          <DropdownMenuItem
                            onClick={() => onDelete(message.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
