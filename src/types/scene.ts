// 3D Scene Types for CiviLabs LMS

export type SceneObjectType =
  | "model"      // 3D model (GLB, GLTF, OBJ, FBX)
  | "primitive"  // Basic shapes (box, sphere, cylinder, plane)
  | "light"      // Light sources
  | "annotation" // Interactive annotation/hotspot
  | "group";     // Group of objects

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Euler {
  x: number;
  y: number;
  z: number;
  order?: "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";
}

export interface Transform {
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
}

export interface Material {
  color?: string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
}

export interface PrimitiveConfig {
  type: "box" | "sphere" | "cylinder" | "cone" | "plane" | "torus";
  args?: number[]; // Dimensions based on type
  material?: Material;
}

export interface ModelConfig {
  url: string;
  format: "glb" | "gltf" | "obj" | "fbx";
  animations?: string[]; // Animation names to play
  currentAnimation?: string;
}

export interface LightConfig {
  type: "ambient" | "directional" | "point" | "spot" | "hemisphere";
  color?: string;
  intensity?: number;
  castShadow?: boolean;
  // Directional/Spot specific
  target?: Vector3;
  // Spot specific
  angle?: number;
  penumbra?: number;
  // Hemisphere specific
  groundColor?: string;
}

export interface AnnotationConfig {
  id: string;
  title: string;
  description: string;
  icon?: string;
  color?: string;
  pulseAnimation?: boolean;
  linkedCameraPosition?: Vector3;
  linkedCameraTarget?: Vector3;
}

export interface SceneObject {
  id: string;
  name: string;
  type: SceneObjectType;
  transform: Transform;
  visible?: boolean;
  children?: SceneObject[];
  // Type-specific configs
  primitive?: PrimitiveConfig;
  model?: ModelConfig;
  light?: LightConfig;
  annotation?: AnnotationConfig;
}

export interface CameraConfig {
  type: "perspective" | "orthographic";
  position: Vector3;
  target: Vector3;
  fov?: number; // Perspective only
  zoom?: number; // Orthographic only
  near?: number;
  far?: number;
}

export interface ControlsConfig {
  type: "orbit" | "fly" | "first-person";
  enablePan?: boolean;
  enableZoom?: boolean;
  enableRotate?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  dampingFactor?: number;
}

export interface EnvironmentConfig {
  preset?: "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "studio" | "city" | "park" | "lobby";
  background?: boolean;
  blur?: number;
  backgroundImage?: string;
  backgroundColor?: string;
  fog?: {
    color: string;
    near: number;
    far: number;
  };
  ground?: {
    height: number;
    radius: number;
    color?: string;
  };
}

export interface SceneConfig {
  id: string;
  name: string;
  description?: string;
  version: string;
  camera: CameraConfig;
  controls: ControlsConfig;
  environment: EnvironmentConfig;
  objects: SceneObject[];
  // Scene-level settings
  shadows?: boolean;
  antialias?: boolean;
  pixelRatio?: number;
  // Interaction
  selectedObjectId?: string;
  highlightColor?: string;
}

// Default configurations
export const defaultTransform: Transform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

export const defaultCamera: CameraConfig = {
  type: "perspective",
  position: { x: 5, y: 5, z: 5 },
  target: { x: 0, y: 0, z: 0 },
  fov: 50,
  near: 0.1,
  far: 1000,
};

export const defaultControls: ControlsConfig = {
  type: "orbit",
  enablePan: true,
  enableZoom: true,
  enableRotate: true,
  autoRotate: false,
  autoRotateSpeed: 2,
  minDistance: 1,
  maxDistance: 100,
  dampingFactor: 0.05,
};

export const defaultEnvironment: EnvironmentConfig = {
  preset: "studio",
  background: true,
  blur: 0.5,
};

export const defaultSceneConfig: SceneConfig = {
  id: "",
  name: "Untitled Scene",
  version: "1.0.0",
  camera: defaultCamera,
  controls: defaultControls,
  environment: defaultEnvironment,
  objects: [],
  shadows: true,
  antialias: true,
};

// Primitive factory helpers
export const primitiveDefaults: Record<PrimitiveConfig["type"], number[]> = {
  box: [1, 1, 1],           // width, height, depth
  sphere: [0.5, 32, 16],     // radius, widthSegments, heightSegments
  cylinder: [0.5, 0.5, 1, 32], // radiusTop, radiusBottom, height, radialSegments
  cone: [0.5, 1, 32],        // radius, height, radialSegments
  plane: [1, 1],             // width, height
  torus: [0.5, 0.2, 16, 48], // radius, tube, radialSegments, tubularSegments
};

// Lesson scene data stored in database
export interface LessonSceneData {
  lessonId: string;
  sceneConfig: SceneConfig;
  createdAt: Date;
  updatedAt: Date;
}
