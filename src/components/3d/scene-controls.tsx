"use client";

import { useState } from "react";
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Grid3x3,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SceneConfig } from "@/types/scene";

interface SceneControlsProps {
  config: SceneConfig;
  editorMode?: boolean;
  onResetCamera?: () => void;
  onToggleFullscreen?: () => void;
  onToggleGrid?: () => void;
  onToggleWireframe?: () => void;
  onToggleAutoRotate?: () => void;
}

export function SceneControls({
  config,
  editorMode = false,
  onResetCamera,
  onToggleFullscreen,
  onToggleGrid,
  onToggleWireframe,
  onToggleAutoRotate,
}: SceneControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(editorMode);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(config.controls.autoRotate ?? false);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    onToggleFullscreen?.();
  };

  const handleGridToggle = () => {
    setShowGrid(!showGrid);
    onToggleGrid?.();
  };

  const handleWireframeToggle = () => {
    setWireframeMode(!wireframeMode);
    onToggleWireframe?.();
  };

  const handleAutoRotateToggle = () => {
    setAutoRotate(!autoRotate);
    onToggleAutoRotate?.();
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute bottom-4 left-4 flex gap-1 z-20">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={onResetCamera}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Reset Camera</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={handleAutoRotateToggle}
            >
              {autoRotate ? (
                <Eye className="h-4 w-4 text-primary" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{autoRotate ? "Stop Auto-Rotate" : "Auto-Rotate"}</p>
          </TooltipContent>
        </Tooltip>

        {editorMode && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                  onClick={handleGridToggle}
                >
                  <Grid3x3
                    className={`h-4 w-4 ${showGrid ? "text-primary" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{showGrid ? "Hide Grid" : "Show Grid"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                  onClick={handleWireframeToggle}
                >
                  {wireframeMode ? (
                    <Sun className="h-4 w-4 text-primary" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{wireframeMode ? "Solid Mode" : "Wireframe Mode"}</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      <div className="absolute bottom-4 right-4 flex gap-1 z-20">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={handleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Scene info */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm">
          <span className="font-medium">{config.name}</span>
          {config.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {config.description}
            </p>
          )}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>🖱️ Rotate</span>
            <span>⌘ + 🖱️ Pan</span>
            <span>Scroll Zoom</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
