"use client";

import { useRef } from "react";
import { useHelper } from "@react-three/drei";
import * as THREE from "three";
import { LightConfig } from "@/types/scene";

interface SceneLightsProps {
  config: LightConfig;
  position: [number, number, number];
  showHelper?: boolean;
}

export function SceneLights({
  config,
  position,
  showHelper = false,
}: SceneLightsProps) {
  const lightRef = useRef<THREE.Light>(null);

  // Show helpers in editor mode
  const DirectionalLightHelper = showHelper && config.type === "directional"
    ? useHelper(lightRef as React.MutableRefObject<THREE.DirectionalLight>, THREE.DirectionalLightHelper, 1, config.color || "#ffffff")
    : null;

  const PointLightHelper = showHelper && config.type === "point"
    ? useHelper(lightRef as React.MutableRefObject<THREE.PointLight>, THREE.PointLightHelper, 0.5, config.color || "#ffffff")
    : null;

  const SpotLightHelper = showHelper && config.type === "spot"
    ? useHelper(lightRef as React.MutableRefObject<THREE.SpotLight>, THREE.SpotLightHelper, config.color || "#ffffff")
    : null;

  const color = config.color || "#ffffff";
  const intensity = config.intensity ?? 1;

  switch (config.type) {
    case "ambient":
      return <ambientLight color={color} intensity={intensity} />;

    case "directional":
      return (
        <directionalLight
          ref={lightRef as React.RefObject<THREE.DirectionalLight>}
          position={position}
          color={color}
          intensity={intensity}
          castShadow={config.castShadow ?? true}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
      );

    case "point":
      return (
        <pointLight
          ref={lightRef as React.RefObject<THREE.PointLight>}
          position={position}
          color={color}
          intensity={intensity}
          castShadow={config.castShadow ?? false}
          shadow-mapSize={[1024, 1024]}
        />
      );

    case "spot":
      return (
        <spotLight
          ref={lightRef as React.RefObject<THREE.SpotLight>}
          position={position}
          color={color}
          intensity={intensity}
          angle={config.angle ?? Math.PI / 6}
          penumbra={config.penumbra ?? 0.5}
          castShadow={config.castShadow ?? true}
          shadow-mapSize={[1024, 1024]}
        />
      );

    case "hemisphere":
      return (
        <hemisphereLight
          position={position}
          color={color}
          groundColor={config.groundColor || "#444444"}
          intensity={intensity}
        />
      );

    default:
      return null;
  }
}
