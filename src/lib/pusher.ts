import PusherServer from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance (singleton pattern)
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = () => {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
      }
    );
  }
  return pusherClientInstance;
};

// Channel naming conventions
export const getChannelName = {
  // Private channel for course chat rooms
  courseChat: (courseId: string) => `private-course-${courseId}`,
  // Private channel for direct messages between users
  directMessage: (roomId: string) => `private-dm-${roomId}`,
  // Presence channel for online users in a course
  coursePresence: (courseId: string) => `presence-course-${courseId}`,
};

// Event names
export const PUSHER_EVENTS = {
  NEW_MESSAGE: "new-message",
  MESSAGE_DELETED: "message-deleted",
  MESSAGE_UPDATED: "message-updated",
  USER_TYPING: "user-typing",
  USER_STOPPED_TYPING: "user-stopped-typing",
};
