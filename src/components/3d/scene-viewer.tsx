"use client";

import { Suspense, useRef, useState, useCallback } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Grid,
  GizmoHelper,
  GizmoViewport,
} from "@react-three/drei";
import * as THREE from "three";
import { SceneConfig, SceneObject, defaultSceneConfig } from "@/types/scene";
import { ModelLoader } from "./model-loader";
import { SceneControls } from "./scene-controls";
import { Annotations } from "./annotations";
import { PrimitiveObject } from "./primitive-object";
import { SceneLights } from "./scene-lights";
import { Loader2 } from "lucide-react";

interface SceneViewerProps {
  config?: SceneConfig;
  editorMode?: boolean;
  onObjectSelect?: (objectId: string | null) => void;
  onCameraChange?: (position: THREE.Vector3, target: THREE.Vector3) => void;
  className?: string;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3b82f6" wireframe />
    </mesh>
  );
}

function SceneContent({
  config,
  editorMode,
  onObjectSelect,
}: {
  config: SceneConfig;
  editorMode: boolean;
  onObjectSelect?: (objectId: string | null) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const renderObject = (obj: SceneObject): React.ReactNode => {
    if (obj.visible === false) return null;

    const isSelected = config.selectedObjectId === obj.id;
    const isHovered = hoveredId === obj.id;

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onObjectSelect?.(obj.id);
    };

    const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHoveredId(obj.id);
      document.body.style.cursor = "pointer";
    };

    const handlePointerOut = () => {
      setHoveredId(null);
      document.body.style.cursor = "auto";
    };

    const position: [number, number, number] = [
      obj.transform.position.x,
      obj.transform.position.y,
      obj.transform.position.z,
    ];
    const rotation: [number, number, number] = [
      obj.transform.rotation.x,
      obj.transform.rotation.y,
      obj.transform.rotation.z,
    ];
    const scale: [number, number, number] = [
      obj.transform.scale.x,
      obj.transform.scale.y,
      obj.transform.scale.z,
    ];

    switch (obj.type) {
      case "model":
        if (!obj.model) return null;
        return (
          <group
            key={obj.id}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={editorMode ? handleClick : undefined}
            onPointerOver={editorMode ? handlePointerOver : undefined}
            onPointerOut={editorMode ? handlePointerOut : undefined}
          >
            <Suspense fallback={<LoadingFallback />}>
              <ModelLoader
                url={obj.model.url}
                format={obj.model.format}
                isSelected={isSelected}
                isHovered={isHovered}
                highlightColor={config.highlightColor}
              />
            </Suspense>
            {obj.children?.map(renderObject)}
          </group>
        );

      case "primitive":
        if (!obj.primitive) return null;
        return (
          <PrimitiveObject
            key={obj.id}
            config={obj.primitive}
            position={position}
            rotation={rotation}
            scale={scale}
            isSelected={isSelected}
            isHovered={isHovered}
            highlightColor={config.highlightColor}
            onClick={editorMode ? handleClick : undefined}
            onPointerOver={editorMode ? handlePointerOver : undefined}
            onPointerOut={editorMode ? handlePointerOut : undefined}
          >
            {obj.children?.map(renderObject)}
          </PrimitiveObject>
        );

      case "light":
        if (!obj.light) return null;
        return (
          <SceneLights
            key={obj.id}
            config={obj.light}
            position={position}
            showHelper={editorMode}
          />
        );

      case "annotation":
        if (!obj.annotation) return null;
        return (
          <Annotations
            key={obj.id}
            config={obj.annotation}
            position={position}
            isSelected={isSelected}
          />
        );

      case "group":
        return (
          <group
            key={obj.id}
            position={position}
            rotation={rotation}
            scale={scale}
          >
            {obj.children?.map(renderObject)}
          </group>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Scene objects */}
      {config.objects.map(renderObject)}

      {/* Grid for editor mode */}
      {editorMode && (
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6b7280"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#3b82f6"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}

      {/* Default lights if none defined */}
      {config.objects.filter((o) => o.type === "light").length === 0 && (
        <>
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow={config.shadows}
          />
        </>
      )}
    </>
  );
}

export function SceneViewer({
  config = defaultSceneConfig,
  editorMode = false,
  onObjectSelect,
  onCameraChange,
  className,
}: SceneViewerProps) {
  const controlsRef = useRef<any>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Deselect when clicking on empty space
      if (e.target === e.currentTarget) {
        onObjectSelect?.(null);
      }
    },
    [onObjectSelect]
  );

  const getEnvironmentPreset = () => {
    if (config.environment.preset) {
      return config.environment.preset;
    }
    return "studio";
  };

  return (
    <div className={`relative w-full h-full min-h-[400px] ${className || ""}`}>
      {/* Loading overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 pointer-events-none opacity-0 transition-opacity duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>

      <Canvas
        shadows={config.shadows}
        gl={{
          antialias: config.antialias ?? true,
        }}
        dpr={config.pixelRatio ?? window.devicePixelRatio}
        onClick={handleCanvasClick}
      >
        {/* Camera */}
        <PerspectiveCamera
          makeDefault
          position={[
            config.camera.position.x,
            config.camera.position.y,
            config.camera.position.z,
          ]}
          fov={config.camera.fov ?? 50}
          near={config.camera.near ?? 0.1}
          far={config.camera.far ?? 1000}
        />

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          target={[
            config.camera.target.x,
            config.camera.target.y,
            config.camera.target.z,
          ]}
          enablePan={config.controls.enablePan ?? true}
          enableZoom={config.controls.enableZoom ?? true}
          enableRotate={config.controls.enableRotate ?? true}
          autoRotate={config.controls.autoRotate ?? false}
          autoRotateSpeed={config.controls.autoRotateSpeed ?? 2}
          minDistance={config.controls.minDistance ?? 1}
          maxDistance={config.controls.maxDistance ?? 100}
          dampingFactor={config.controls.dampingFactor ?? 0.05}
          enableDamping
          onChange={() => {
            if (controlsRef.current && onCameraChange) {
              const camera = controlsRef.current.object;
              const target = controlsRef.current.target;
              onCameraChange(camera.position.clone(), target.clone());
            }
          }}
        />

        {/* Environment */}
        <Suspense fallback={null}>
          <Environment
            preset={getEnvironmentPreset()}
            background={config.environment.background ?? true}
            blur={config.environment.blur ?? 0.5}
          />
        </Suspense>

        {/* Fog */}
        {config.environment.fog && (
          <fog
            attach="fog"
            args={[
              config.environment.fog.color,
              config.environment.fog.near,
              config.environment.fog.far,
            ]}
          />
        )}

        {/* Scene content */}
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent
            config={config}
            editorMode={editorMode}
            onObjectSelect={onObjectSelect}
          />
        </Suspense>

        {/* Gizmo helper for editor mode */}
        {editorMode && (
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport
              axisColors={["#ef4444", "#22c55e", "#3b82f6"]}
              labelColor="white"
            />
          </GizmoHelper>
        )}
      </Canvas>

      {/* Scene controls overlay */}
      <SceneControls
        config={config}
        editorMode={editorMode}
        onResetCamera={() => {
          if (controlsRef.current) {
            controlsRef.current.reset();
          }
        }}
      />
    </div>
  );
}
