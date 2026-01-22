"use client";

import { useRef, useEffect, ReactNode } from "react";
import { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { PrimitiveConfig, primitiveDefaults } from "@/types/scene";

interface PrimitiveObjectProps {
  config: PrimitiveConfig;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isSelected?: boolean;
  isHovered?: boolean;
  highlightColor?: string;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: () => void;
  children?: ReactNode;
}

export function PrimitiveObject({
  config,
  position,
  rotation,
  scale,
  isSelected = false,
  isHovered = false,
  highlightColor = "#3b82f6",
  onClick,
  onPointerOver,
  onPointerOut,
  children,
}: PrimitiveObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const args = config.args || primitiveDefaults[config.type];

  // Apply highlight effect
  useEffect(() => {
    if (!meshRef.current || !meshRef.current.material) return;

    const material = meshRef.current.material as THREE.MeshStandardMaterial;

    if (isSelected) {
      material.emissive = new THREE.Color(highlightColor);
      material.emissiveIntensity = 0.3;
    } else if (isHovered) {
      material.emissive = new THREE.Color(highlightColor);
      material.emissiveIntensity = 0.15;
    } else {
      material.emissive = new THREE.Color(0x000000);
      material.emissiveIntensity = 0;
    }
  }, [isSelected, isHovered, highlightColor]);

  const getGeometry = () => {
    switch (config.type) {
      case "box":
        return <boxGeometry args={args as [number, number, number]} />;
      case "sphere":
        return <sphereGeometry args={args as [number, number, number]} />;
      case "cylinder":
        return <cylinderGeometry args={args as [number, number, number, number]} />;
      case "cone":
        return <coneGeometry args={args as [number, number, number]} />;
      case "plane":
        return <planeGeometry args={args as [number, number]} />;
      case "torus":
        return <torusGeometry args={args as [number, number, number, number]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const materialProps = {
    color: config.material?.color || "#6b7280",
    metalness: config.material?.metalness ?? 0.1,
    roughness: config.material?.roughness ?? 0.8,
    opacity: config.material?.opacity ?? 1,
    transparent: config.material?.transparent ?? false,
    wireframe: config.material?.wireframe ?? false,
    emissive: config.material?.emissive || "#000000",
    emissiveIntensity: config.material?.emissiveIntensity ?? 0,
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {getGeometry()}
      <meshStandardMaterial {...materialProps} />
      {children}
    </mesh>
  );
}
