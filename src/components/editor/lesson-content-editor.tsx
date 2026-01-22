"use client";

import { useState, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  FileText,
  File,
  Box,
  Type,
  Link as LinkIcon,
  CheckCircle,
  Pencil,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoUpload, FileUpload } from "@/components/upload";
import { SceneConfig } from "@/types/scene";

// Lazy load the SceneEditor to avoid loading Three.js unless needed
const SceneEditor = lazy(() =>
  import("@/components/editor/scene-editor").then((mod) => ({
    default: mod.SceneEditor,
  }))
);

const SceneViewer = lazy(() =>
  import("@/components/3d/scene-viewer").then((mod) => ({
    default: mod.SceneViewer,
  }))
);

interface Lesson {
  id: string;
  title: string;
  type: string;
  content: string | null;
  videoUrl: string | null;
  attachmentUrl: string | null;
  sceneConfig: unknown;
}

interface LessonContentEditorProps {
  courseId: string;
  chapterId: string;
  lesson: Lesson;
}

export function LessonContentEditor({
  courseId,
  chapterId,
  lesson,
}: LessonContentEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form states for different lesson types
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl || "");
  const [content, setContent] = useState(lesson.content || "");
  const [attachmentUrl, setAttachmentUrl] = useState(lesson.attachmentUrl || "");
  const [sceneConfig, setSceneConfig] = useState(
    lesson.sceneConfig ? JSON.stringify(lesson.sceneConfig, null, 2) : ""
  );

  const handleSave = async () => {
    setIsLoading(true);
    setIsSaved(false);

    try {
      const payload: Record<string, unknown> = {};

      switch (lesson.type) {
        case "VIDEO":
          payload.videoUrl = videoUrl || null;
          break;
        case "TEXT":
          payload.content = content || null;
          break;
        case "PDF":
        case "DOCUMENT":
        case "POWERPOINT":
          payload.attachmentUrl = attachmentUrl || null;
          break;
        case "SCENE_3D":
          try {
            payload.sceneConfig = sceneConfig ? JSON.parse(sceneConfig) : null;
          } catch {
            alert("Invalid JSON configuration");
            setIsLoading(false);
            return;
          }
          break;
      }

      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        setIsSaved(true);
        router.refresh();
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVideoEditor = () => (
    <div className="space-y-4">
      <Tabs defaultValue={videoUrl && (videoUrl.includes("youtube") || videoUrl.includes("vimeo")) ? "url" : "upload"}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Video</TabsTrigger>
          <TabsTrigger value="url">Embed URL</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <VideoUpload
            value={videoUrl && !videoUrl.includes("youtube") && !videoUrl.includes("vimeo") ? videoUrl : ""}
            onChange={(url) => setVideoUrl(url)}
            onRemove={() => setVideoUrl("")}
          />
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="videoUrl" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Video URL
            </Label>
            <Input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              className="focus-glow"
            />
            <p className="text-xs text-muted-foreground">
              Paste a YouTube, Vimeo, or direct video URL
            </p>
          </div>

          {videoUrl && (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo.com")) && (
            <div className="rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
              {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                <iframe
                  src={getYouTubeEmbedUrl(videoUrl)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src={getVimeoEmbedUrl(videoUrl)}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderTextEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content" className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          Lesson Content
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your lesson content here..."
          rows={15}
          className="focus-glow resize-none font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          You can use Markdown formatting for rich text
        </p>
      </div>
    </div>
  );

  const getFileUploadEndpoint = () => {
    switch (lesson.type) {
      case "PDF":
        return "lessonPdf";
      case "POWERPOINT":
      case "DOCUMENT":
        return "lessonDocument";
      default:
        return "lessonDocument";
    }
  };

  const getAcceptedFileTypes = (): Record<string, string[]> => {
    switch (lesson.type) {
      case "PDF":
        return { "application/pdf": [".pdf"] };
      case "POWERPOINT":
        return {
          "application/vnd.ms-powerpoint": [".ppt"],
          "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
        };
      case "DOCUMENT":
        return {
          "application/msword": [".doc"],
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
          "application/vnd.ms-excel": [".xls"],
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
          "application/pdf": [".pdf"],
        };
      default:
        return {};
    }
  };

  const renderFileUploader = () => (
    <div className="space-y-4">
      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="url">Paste URL</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <FileUpload
            value={attachmentUrl}
            onChange={(url) => setAttachmentUrl(url)}
            onRemove={() => setAttachmentUrl("")}
            endpoint={getFileUploadEndpoint() as "lessonPdf" | "lessonDocument" | "attachment"}
            accept={getAcceptedFileTypes()}
          />
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <File className="h-4 w-4" />
              File URL
            </Label>
            <Input
              type="url"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://example.com/document.pdf"
              className="focus-glow"
            />
            <p className="text-xs text-muted-foreground">
              Paste a direct URL to your{" "}
              {lesson.type === "PDF"
                ? "PDF document"
                : lesson.type === "POWERPOINT"
                ? "PowerPoint presentation"
                : "document"}
            </p>
          </div>

          {attachmentUrl && (
            <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Attached File</p>
                <p className="text-xs text-muted-foreground truncate">{attachmentUrl}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                  Preview
                </a>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSceneSave = async (config: SceneConfig) => {
    setSceneConfig(JSON.stringify(config, null, 2));

    // Also save to API
    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sceneConfig: config }),
        }
      );

      if (response.ok) {
        setIsSaved(true);
        router.refresh();
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save scene:", error);
    }
  };

  const getSceneConfig = (): SceneConfig | null => {
    try {
      return sceneConfig ? JSON.parse(sceneConfig) : null;
    } catch {
      return null;
    }
  };

  const renderSceneEditor = () => {
    if (showVisualEditor) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              Visual 3D Scene Editor
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVisualEditor(false)}
            >
              Switch to JSON
            </Button>
          </div>

          <div className="h-[600px] border rounded-lg overflow-hidden">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              <SceneEditor
                initialConfig={getSceneConfig() || undefined}
                onSave={handleSceneSave}
                lessonId={lesson.id}
              />
            </Suspense>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="sceneConfig" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            3D Scene Configuration (JSON)
          </Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? "Hide Preview" : "Preview"}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowVisualEditor(true)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Visual Editor
            </Button>
          </div>
        </div>

        <Textarea
          id="sceneConfig"
          value={sceneConfig}
          onChange={(e) => setSceneConfig(e.target.value)}
          placeholder={`{
  "id": "scene-1",
  "name": "My 3D Scene",
  "version": "1.0.0",
  "camera": {
    "type": "perspective",
    "position": { "x": 5, "y": 5, "z": 5 },
    "target": { "x": 0, "y": 0, "z": 0 },
    "fov": 50
  },
  "controls": {
    "type": "orbit",
    "enablePan": true,
    "enableZoom": true
  },
  "environment": {
    "preset": "studio",
    "background": true
  },
  "objects": []
}`}
          rows={15}
          className="focus-glow resize-none font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Enter JSON configuration for your 3D scene, or use the Visual Editor for a graphical interface.
        </p>

        {showPreview && (
          <div className="border rounded-lg overflow-hidden aspect-video">
            {getSceneConfig() ? (
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }
              >
                <SceneViewer config={getSceneConfig()!} editorMode={false} />
              </Suspense>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {sceneConfig ? "Invalid JSON configuration" : "No scene configured yet"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderEditor = () => {
    switch (lesson.type) {
      case "VIDEO":
        return renderVideoEditor();
      case "TEXT":
        return renderTextEditor();
      case "PDF":
      case "DOCUMENT":
      case "POWERPOINT":
        return renderFileUploader();
      case "SCENE_3D":
        return renderSceneEditor();
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Unknown lesson type: {lesson.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderEditor()}

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isLoading} className="btn-hover-lift">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isSaved ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : null}
          {isLoading ? "Saving..." : isSaved ? "Saved!" : "Save Content"}
        </Button>

        {isSaved && (
          <span className="text-sm text-green-600 animate-fade-in">
            Changes saved successfully
          </span>
        )}
      </div>
    </div>
  );
}

// Helper functions for video embeds
function getYouTubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

function getVimeoEmbedUrl(url: string): string {
  const regExp = /vimeo\.com\/(\d+)/;
  const match = url.match(regExp);
  const videoId = match ? match[1] : null;
  return videoId ? `https://player.vimeo.com/video/${videoId}` : "";
}
