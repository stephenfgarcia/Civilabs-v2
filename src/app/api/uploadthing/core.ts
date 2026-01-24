import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Course thumbnail images
  courseImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
        throw new UploadThingError("Only instructors can upload course images");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Course image upload complete for userId:", metadata.userId);
      console.log("File URL:", file.ufsUrl);
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // User avatar images
  userAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Lesson video files
  lessonVideo: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
        throw new UploadThingError("Only instructors can upload videos");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Video upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Lesson PDF attachments
  lessonPdf: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
        throw new UploadThingError("Only instructors can upload PDFs");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("PDF upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Lesson document attachments (Word, Excel, PowerPoint)
  lessonDocument: f({
    "application/msword": { maxFileSize: "16MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB" },
    "application/vnd.ms-excel": { maxFileSize: "16MB" },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { maxFileSize: "16MB" },
    "application/vnd.ms-powerpoint": { maxFileSize: "32MB" },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": { maxFileSize: "32MB" },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
        throw new UploadThingError("Only instructors can upload documents");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // 3D model files (GLB, GLTF)
  lessonModel: f({
    "model/gltf-binary": { maxFileSize: "64MB" },
    "model/gltf+json": { maxFileSize: "64MB" },
    "application/octet-stream": { maxFileSize: "64MB" }, // For .glb files
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
        throw new UploadThingError("Only instructors can upload 3D models");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("3D model upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // General attachment files
  attachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    "application/zip": { maxFileSize: "64MB", maxFileCount: 3 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
        throw new UploadThingError("Only instructors can upload attachments");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Attachment upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Forum attachments (for forum posts/replies)
  forumAttachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 3 },
    pdf: { maxFileSize: "8MB", maxFileCount: 2 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Forum attachment upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Assignment submission files (student uploads)
  assignmentSubmission: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    pdf: { maxFileSize: "32MB", maxFileCount: 5 },
    "application/zip": { maxFileSize: "64MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 5 },
    "text/plain": { maxFileSize: "4MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Assignment submission upload for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.ufsUrl, name: file.name, size: file.size };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
