"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Circle,
  Cylinder,
  Cone,
  Square,
  Lightbulb,
  Sun,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Plus,
  Save,
  Upload,
  Download,
  Settings,
  Move3D,
  RotateCw,
  Maximize,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SceneViewer } from "@/components/3d/scene-viewer";
import {
  SceneConfig,
  SceneObject,
  Transform,
  defaultSceneConfig,
  defaultTransform,
} from "@/types/scene";

interface SceneEditorProps {
  initialConfig?: SceneConfig;
  onSave?: (config: SceneConfig) => void;
  lessonId?: string;
}

type TransformMode = "translate" | "rotate" | "scale";

export function SceneEditor({
  initialConfig = defaultSceneConfig,
  onSave,
  lessonId,
}: SceneEditorProps) {
  const [config, setConfig] = useState<SceneConfig>({
    ...initialConfig,
    id: initialConfig.id || `scene-${Date.now()}`,
  });
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>("translate");
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const selectedObject = config.objects.find((o) => o.id === selectedObjectId);

  const updateConfig = useCallback((updates: Partial<SceneConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateObject = useCallback(
    (objectId: string, updates: Partial<SceneObject>) => {
      setConfig((prev) => ({
        ...prev,
        objects: prev.objects.map((obj) =>
          obj.id === objectId ? { ...obj, ...updates } : obj
        ),
      }));
    },
    []
  );

  const updateObjectTransform = useCallback(
    (objectId: string, property: keyof Transform, axis: "x" | "y" | "z", value: number) => {
      setConfig((prev) => ({
        ...prev,
        objects: prev.objects.map((obj) =>
          obj.id === objectId
            ? {
                ...obj,
                transform: {
                  ...obj.transform,
                  [property]: {
                    ...obj.transform[property],
                    [axis]: value,
                  },
                },
              }
            : obj
        ),
      }));
    },
    []
  );

  const addPrimitive = useCallback(
    (type: "box" | "sphere" | "cylinder" | "cone" | "plane") => {
      const newObject: SceneObject = {
        id: `${type}-${Date.now()}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type: "primitive",
        transform: { ...defaultTransform },
        primitive: {
          type,
          material: { color: "#6b7280" },
        },
      };

      updateConfig({ objects: [...config.objects, newObject] });
      setSelectedObjectId(newObject.id);
    },
    [config.objects, updateConfig]
  );

  const addLight = useCallback(
    (type: "ambient" | "directional" | "point" | "spot") => {
      const newObject: SceneObject = {
        id: `${type}-light-${Date.now()}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Light`,
        type: "light",
        transform: {
          ...defaultTransform,
          position: { x: 5, y: 5, z: 5 },
        },
        light: {
          type,
          color: "#ffffff",
          intensity: 1,
          castShadow: type !== "ambient",
        },
      };

      updateConfig({ objects: [...config.objects, newObject] });
      setSelectedObjectId(newObject.id);
    },
    [config.objects, updateConfig]
  );

  const addAnnotation = useCallback(() => {
    const newObject: SceneObject = {
      id: `annotation-${Date.now()}`,
      name: "New Annotation",
      type: "annotation",
      transform: { ...defaultTransform },
      annotation: {
        id: `annotation-${Date.now()}`,
        title: "Annotation",
        description: "Click to add description",
        icon: "info",
        color: "#3b82f6",
        pulseAnimation: true,
      },
    };

    updateConfig({ objects: [...config.objects, newObject] });
    setSelectedObjectId(newObject.id);
  }, [config.objects, updateConfig]);

  const deleteObject = useCallback(
    (objectId: string) => {
      updateConfig({
        objects: config.objects.filter((o) => o.id !== objectId),
      });
      if (selectedObjectId === objectId) {
        setSelectedObjectId(null);
      }
    },
    [config.objects, selectedObjectId, updateConfig]
  );

  const duplicateObject = useCallback(
    (objectId: string) => {
      const original = config.objects.find((o) => o.id === objectId);
      if (!original) return;

      const duplicate: SceneObject = {
        ...JSON.parse(JSON.stringify(original)),
        id: `${original.id}-copy-${Date.now()}`,
        name: `${original.name} (Copy)`,
        transform: {
          ...original.transform,
          position: {
            x: original.transform.position.x + 1,
            y: original.transform.position.y,
            z: original.transform.position.z,
          },
        },
      };

      updateConfig({ objects: [...config.objects, duplicate] });
      setSelectedObjectId(duplicate.id);
    },
    [config.objects, updateConfig]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(config);
    } finally {
      setIsSaving(false);
    }
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setConfig({
          ...imported,
          id: config.id, // Keep current ID
        });
      } catch {
        alert("Invalid scene configuration file");
      }
    };
    reader.readAsText(file);
  };

  const getObjectIcon = (obj: SceneObject) => {
    switch (obj.type) {
      case "primitive":
        switch (obj.primitive?.type) {
          case "box":
            return <Box className="h-4 w-4" />;
          case "sphere":
            return <Circle className="h-4 w-4" />;
          case "cylinder":
            return <Cylinder className="h-4 w-4" />;
          case "cone":
            return <Cone className="h-4 w-4" />;
          default:
            return <Square className="h-4 w-4" />;
        }
      case "light":
        return obj.light?.type === "ambient" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Lightbulb className="h-4 w-4" />
        );
      case "annotation":
        return <Type className="h-4 w-4" />;
      case "model":
        return <Box className="h-4 w-4" />;
      default:
        return <Box className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Object Hierarchy */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Scene Objects</h3>
        </div>

        {/* Add object buttons */}
        <div className="p-2 border-b space-y-2">
          <div className="text-xs text-muted-foreground px-1">Add Primitive</div>
          <div className="flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => addPrimitive("box")}
              title="Add Box"
            >
              <Box className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => addPrimitive("sphere")}
              title="Add Sphere"
            >
              <Circle className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => addPrimitive("cylinder")}
              title="Add Cylinder"
            >
              <Cylinder className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => addPrimitive("cone")}
              title="Add Cone"
            >
              <Cone className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => addPrimitive("plane")}
              title="Add Plane"
            >
              <Square className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-xs text-muted-foreground px-1">Add Light</div>
          <div className="flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => addLight("ambient")}
              title="Ambient Light"
            >
              <Sun className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => addLight("directional")}
              title="Directional Light"
            >
              <Lightbulb className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => addLight("point")}
              title="Point Light"
            >
              <Circle className="h-3 w-3" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addAnnotation}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Annotation
          </Button>
        </div>

        {/* Object list */}
        <div className="flex-1 overflow-y-auto p-2">
          {config.objects.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No objects in scene
            </p>
          ) : (
            <div className="space-y-0.5">
              {config.objects.map((obj) => (
                <div
                  key={obj.id}
                  className={`
                    flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer
                    ${
                      selectedObjectId === obj.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }
                  `}
                  onClick={() => setSelectedObjectId(obj.id)}
                >
                  {getObjectIcon(obj)}
                  <span className="flex-1 text-sm truncate">{obj.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateObject(obj.id, { visible: !obj.visible });
                    }}
                  >
                    {obj.visible !== false ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center - 3D Viewport */}
      <div className="flex-1 relative">
        <SceneViewer
          config={{ ...config, selectedObjectId: selectedObjectId || undefined }}
          editorMode={true}
          onObjectSelect={setSelectedObjectId}
        />

        {/* Transform mode toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 z-20">
          <Button
            variant={transformMode === "translate" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setTransformMode("translate")}
            title="Move"
          >
            <Move3D className="h-4 w-4" />
          </Button>
          <Button
            variant={transformMode === "rotate" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setTransformMode("rotate")}
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant={transformMode === "scale" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setTransformMode("scale")}
            title="Scale"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="w-72 border-l bg-muted/30 flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Properties</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={exportConfig}>
              <Download className="h-3 w-3" />
            </Button>
            <label>
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <span>
                  <Upload className="h-3 w-3" />
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={importConfig}
              />
            </label>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Scene properties */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Scene Name</Label>
            <Input
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value })}
              placeholder="Scene name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={config.description || ""}
              onChange={(e) => updateConfig({ description: e.target.value })}
              placeholder="Scene description"
              rows={2}
            />
          </div>

          <Separator />

          {/* Selected object properties */}
          {selectedObject ? (
            <>
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{selectedObject.name}</h4>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => duplicateObject(selectedObject.id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteObject(selectedObject.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  value={selectedObject.name}
                  onChange={(e) =>
                    updateObject(selectedObject.id, { name: e.target.value })
                  }
                />
              </div>

              {/* Transform controls */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Position</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["x", "y", "z"] as const).map((axis) => (
                    <div key={axis}>
                      <Label className="text-[10px] text-muted-foreground uppercase">
                        {axis}
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={selectedObject.transform.position[axis]}
                        onChange={(e) =>
                          updateObjectTransform(
                            selectedObject.id,
                            "position",
                            axis,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Rotation (deg)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["x", "y", "z"] as const).map((axis) => (
                    <div key={axis}>
                      <Label className="text-[10px] text-muted-foreground uppercase">
                        {axis}
                      </Label>
                      <Input
                        type="number"
                        step="1"
                        value={Math.round(
                          (selectedObject.transform.rotation[axis] * 180) / Math.PI
                        )}
                        onChange={(e) =>
                          updateObjectTransform(
                            selectedObject.id,
                            "rotation",
                            axis,
                            ((parseFloat(e.target.value) || 0) * Math.PI) / 180
                          )
                        }
                        className="h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Scale</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["x", "y", "z"] as const).map((axis) => (
                    <div key={axis}>
                      <Label className="text-[10px] text-muted-foreground uppercase">
                        {axis}
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={selectedObject.transform.scale[axis]}
                        onChange={(e) =>
                          updateObjectTransform(
                            selectedObject.id,
                            "scale",
                            axis,
                            parseFloat(e.target.value) || 1
                          )
                        }
                        className="h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Type-specific properties */}
              {selectedObject.type === "primitive" && selectedObject.primitive && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={selectedObject.primitive.material?.color || "#6b7280"}
                        onChange={(e) =>
                          updateObject(selectedObject.id, {
                            primitive: {
                              ...selectedObject.primitive!,
                              material: {
                                ...selectedObject.primitive!.material,
                                color: e.target.value,
                              },
                            },
                          })
                        }
                        className="h-8 w-12 p-1"
                      />
                      <Input
                        value={selectedObject.primitive.material?.color || "#6b7280"}
                        onChange={(e) =>
                          updateObject(selectedObject.id, {
                            primitive: {
                              ...selectedObject.primitive!,
                              material: {
                                ...selectedObject.primitive!.material,
                                color: e.target.value,
                              },
                            },
                          })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Wireframe</Label>
                    <Switch
                      checked={selectedObject.primitive.material?.wireframe || false}
                      onCheckedChange={(checked) =>
                        updateObject(selectedObject.id, {
                          primitive: {
                            ...selectedObject.primitive!,
                            material: {
                              ...selectedObject.primitive!.material,
                              wireframe: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </>
              )}

              {selectedObject.type === "light" && selectedObject.light && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Light Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={selectedObject.light.color || "#ffffff"}
                        onChange={(e) =>
                          updateObject(selectedObject.id, {
                            light: {
                              ...selectedObject.light!,
                              color: e.target.value,
                            },
                          })
                        }
                        className="h-8 w-12 p-1"
                      />
                      <Input
                        value={selectedObject.light.color || "#ffffff"}
                        onChange={(e) =>
                          updateObject(selectedObject.id, {
                            light: {
                              ...selectedObject.light!,
                              color: e.target.value,
                            },
                          })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Intensity</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={selectedObject.light.intensity ?? 1}
                      onChange={(e) =>
                        updateObject(selectedObject.id, {
                          light: {
                            ...selectedObject.light!,
                            intensity: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="h-8"
                    />
                  </div>

                  {selectedObject.light.type !== "ambient" && (
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Cast Shadow</Label>
                      <Switch
                        checked={selectedObject.light.castShadow ?? true}
                        onCheckedChange={(checked) =>
                          updateObject(selectedObject.id, {
                            light: {
                              ...selectedObject.light!,
                              castShadow: checked,
                            },
                          })
                        }
                      />
                    </div>
                  )}
                </>
              )}

              {selectedObject.type === "annotation" && selectedObject.annotation && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input
                      value={selectedObject.annotation.title}
                      onChange={(e) =>
                        updateObject(selectedObject.id, {
                          annotation: {
                            ...selectedObject.annotation!,
                            title: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Textarea
                      value={selectedObject.annotation.description}
                      onChange={(e) =>
                        updateObject(selectedObject.id, {
                          annotation: {
                            ...selectedObject.annotation!,
                            description: e.target.value,
                          },
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Icon</Label>
                    <Select
                      value={selectedObject.annotation.icon || "info"}
                      onValueChange={(value) =>
                        updateObject(selectedObject.id, {
                          annotation: {
                            ...selectedObject.annotation!,
                            icon: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="tip">Tip</SelectItem>
                        <SelectItem value="help">Help</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={selectedObject.annotation.color || "#3b82f6"}
                        onChange={(e) =>
                          updateObject(selectedObject.id, {
                            annotation: {
                              ...selectedObject.annotation!,
                              color: e.target.value,
                            },
                          })
                        }
                        className="h-8 w-12 p-1"
                      />
                      <Input
                        value={selectedObject.annotation.color || "#3b82f6"}
                        onChange={(e) =>
                          updateObject(selectedObject.id, {
                            annotation: {
                              ...selectedObject.annotation!,
                              color: e.target.value,
                            },
                          })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Pulse Animation</Label>
                    <Switch
                      checked={selectedObject.annotation.pulseAnimation ?? true}
                      onCheckedChange={(checked) =>
                        updateObject(selectedObject.id, {
                          annotation: {
                            ...selectedObject.annotation!,
                            pulseAnimation: checked,
                          },
                        })
                      }
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              Select an object to edit its properties
            </div>
          )}

          <Separator />

          {/* Environment settings */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Environment
            </h4>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Preset</Label>
              <Select
                value={config.environment.preset || "studio"}
                onValueChange={(value: any) =>
                  updateConfig({
                    environment: { ...config.environment, preset: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="dawn">Dawn</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="forest">Forest</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="park">Park</SelectItem>
                  <SelectItem value="lobby">Lobby</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Show Background</Label>
              <Switch
                checked={config.environment.background ?? true}
                onCheckedChange={(checked) =>
                  updateConfig({
                    environment: { ...config.environment, background: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Shadows</Label>
              <Switch
                checked={config.shadows ?? true}
                onCheckedChange={(checked) => updateConfig({ shadows: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Auto-Rotate</Label>
              <Switch
                checked={config.controls.autoRotate ?? false}
                onCheckedChange={(checked) =>
                  updateConfig({
                    controls: { ...config.controls, autoRotate: checked },
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
