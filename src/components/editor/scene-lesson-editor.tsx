"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SceneEditor } from "@/components/editor/scene-editor";
import { SceneConfig, defaultSceneConfig } from "@/types/scene";

interface SceneLessonEditorProps {
  courseId: string;
  chapterId: string;
  lessonId: string;
  lessonTitle: string;
  initialSceneConfig?: SceneConfig | null;
  onBack?: () => void;
}

export function SceneLessonEditor({
  courseId,
  chapterId,
  lessonId,
  lessonTitle,
  initialSceneConfig,
  onBack,
}: SceneLessonEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = async (config: SceneConfig) => {
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sceneConfig: config,
          }),
        }
      );

      if (response.ok) {
        setLastSaved(new Date());
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to save scene");
      }
    } catch (error) {
      console.error("Failed to save scene:", error);
      alert("Failed to save scene");
    } finally {
      setIsSaving(false);
    }
  };

  const config: SceneConfig = initialSceneConfig
    ? { ...initialSceneConfig }
    : {
        ...defaultSceneConfig,
        id: `scene-${lessonId}`,
        name: lessonTitle,
      };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="font-semibold">3D Scene Editor</h1>
            <p className="text-xs text-muted-foreground">{lessonTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {isSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <SceneEditor initialConfig={config} onSave={handleSave} lessonId={lessonId} />
      </div>
    </div>
  );
}
