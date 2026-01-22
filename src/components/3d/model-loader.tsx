"use client";

import { useRef, useEffect, useMemo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface ModelLoaderProps {
  url: string;
  format: "glb" | "gltf" | "obj" | "fbx";
  isSelected?: boolean;
  isHovered?: boolean;
  highlightColor?: string;
  animationName?: string;
}

export function ModelLoader({
  url,
  format,
  isSelected = false,
  isHovered = false,
  highlightColor = "#3b82f6",
}: ModelLoaderProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Load GLTF/GLB models
  const { scene, animations } = useGLTF(url);
  const { actions, mixer } = useAnimations(animations, groupRef);

  // Clone the scene to avoid issues with reusing the same model
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Enable shadows for all meshes
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Clone materials to avoid shared state
        if (child.material) {
          child.material = child.material.clone();
        }
      }
    });

    return clone;
  }, [scene]);

  // Apply highlight effect when selected or hovered
  useEffect(() => {
    if (!groupRef.current) return;

    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;

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
      }
    });
  }, [isSelected, isHovered, highlightColor]);

  // Play first animation by default if available
  useEffect(() => {
    if (animations.length > 0 && actions) {
      const firstAnimationName = animations[0].name;
      const action = actions[firstAnimationName];
      if (action) {
        action.play();
      }
    }

    return () => {
      mixer?.stopAllAction();
    };
  }, [animations, actions, mixer]);

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload models for better performance
ModelLoader.preload = (url: string) => {
  useGLTF.preload(url);
};
