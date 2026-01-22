"use client";

import { useState, useRef } from "react";
import { Html, Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AnnotationConfig } from "@/types/scene";
import { Info, AlertCircle, Lightbulb, HelpCircle } from "lucide-react";

interface AnnotationsProps {
  config: AnnotationConfig;
  position: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  alert: AlertCircle,
  tip: Lightbulb,
  help: HelpCircle,
};

export function Annotations({
  config,
  position,
  isSelected = false,
  onClick,
}: AnnotationsProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);

  // Pulse animation
  useFrame((state, delta) => {
    if (config.pulseAnimation && meshRef.current) {
      pulseRef.current += delta * 2;
      const scale = 1 + Math.sin(pulseRef.current) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const color = config.color || "#3b82f6";
  const IconComponent = iconMap[config.icon || "info"] || Info;

  return (
    <group position={position}>
      {/* 3D marker */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered || isSelected ? 0.8 : 0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.8 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* HTML annotation label */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Html
          center
          distanceFactor={10}
          style={{
            transition: "all 0.2s ease",
            opacity: isHovered || isExpanded ? 1 : 0.8,
            pointerEvents: "none",
          }}
        >
          <div
            className={`
              bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg
              transition-all duration-200 select-none
              ${isExpanded ? "w-64 p-3" : "px-2 py-1"}
            `}
            style={{
              transform: "translateY(-30px)",
              borderColor: color,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="p-1 rounded"
                style={{ backgroundColor: `${color}20`, color }}
              >
                <IconComponent className="h-3 w-3" />
              </div>
              <span className="text-xs font-medium">{config.title}</span>
            </div>

            {isExpanded && config.description && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {config.description}
              </p>
            )}

            {!isExpanded && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Click to expand
              </p>
            )}
          </div>
        </Html>
      </Billboard>

      {/* Connection line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, 0, 0.5, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </line>
    </group>
  );
}

// Annotation group component for multiple annotations
interface AnnotationGroupProps {
  annotations: Array<{
    config: AnnotationConfig;
    position: [number, number, number];
  }>;
  onAnnotationClick?: (id: string) => void;
  selectedId?: string;
}

export function AnnotationGroup({
  annotations,
  onAnnotationClick,
  selectedId,
}: AnnotationGroupProps) {
  return (
    <group>
      {annotations.map(({ config, position }) => (
        <Annotations
          key={config.id}
          config={config}
          position={position}
          isSelected={selectedId === config.id}
          onClick={() => onAnnotationClick?.(config.id)}
        />
      ))}
    </group>
  );
}
