"use client";

import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { Grid3X3, Plus, Trash2, GripVertical, Edit, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RubricLevel {
  label: string;
  description: string;
  points: number;
}

interface RubricCriterion {
  id?: string;
  title: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
  position: number;
}

interface Rubric {
  id: string;
  title: string;
  description: string | null;
  isTemplate: boolean;
  criteria: RubricCriterion[];
  _count?: { assignments: number };
}

export default function RubricBuilderPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Rubric | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  // Builder state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isTemplate, setIsTemplate] = useState(false);
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);

  useEffect(() => {
    fetchRubrics();
  }, [courseId]);

  async function fetchRubrics() {
    try {
      const res = await fetch(`/api/courses/${courseId}/rubrics`);
      if (res.ok) setRubrics(await res.json());
    } catch {
      toast.error("Failed to load rubrics");
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setIsTemplate(false);
    setCriteria([createDefaultCriterion(0)]);
    setShowBuilder(true);
  }

  function startEdit(rubric: Rubric) {
    setEditing(rubric);
    setTitle(rubric.title);
    setDescription(rubric.description || "");
    setIsTemplate(rubric.isTemplate);
    setCriteria(
      rubric.criteria.map((c, i) => ({
        ...c,
        position: i,
        levels: c.levels as RubricLevel[],
      }))
    );
    setShowBuilder(true);
  }

  function createDefaultCriterion(position: number): RubricCriterion {
    return {
      title: "",
      description: "",
      maxPoints: 10,
      position,
      levels: [
        { label: "Excellent", description: "", points: 10 },
        { label: "Good", description: "", points: 7 },
        { label: "Satisfactory", description: "", points: 5 },
        { label: "Needs Improvement", description: "", points: 2 },
      ],
    };
  }

  function addCriterion() {
    setCriteria([...criteria, createDefaultCriterion(criteria.length)]);
  }

  function removeCriterion(index: number) {
    if (criteria.length <= 1) {
      toast.error("Rubric must have at least one criterion");
      return;
    }
    setCriteria(criteria.filter((_, i) => i !== index).map((c, i) => ({ ...c, position: i })));
  }

  function updateCriterion(index: number, updates: Partial<RubricCriterion>) {
    setCriteria(criteria.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  }

  function addLevel(criterionIndex: number) {
    const c = criteria[criterionIndex];
    updateCriterion(criterionIndex, {
      levels: [...c.levels, { label: "", description: "", points: 0 }],
    });
  }

  function removeLevel(criterionIndex: number, levelIndex: number) {
    const c = criteria[criterionIndex];
    if (c.levels.length <= 2) {
      toast.error("Must have at least 2 levels");
      return;
    }
    updateCriterion(criterionIndex, {
      levels: c.levels.filter((_, i) => i !== levelIndex),
    });
  }

  function updateLevel(criterionIndex: number, levelIndex: number, updates: Partial<RubricLevel>) {
    const c = criteria[criterionIndex];
    updateCriterion(criterionIndex, {
      levels: c.levels.map((l, i) => (i === levelIndex ? { ...l, ...updates } : l)),
    });
  }

  async function saveRubric() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (criteria.some((c) => !c.title.trim())) {
      toast.error("All criteria must have titles");
      return;
    }
    if (criteria.some((c) => c.levels.some((l) => !l.label.trim()))) {
      toast.error("All levels must have labels");
      return;
    }

    const payload = {
      title,
      description: description || undefined,
      isTemplate,
      criteria: criteria.map((c) => ({
        title: c.title,
        description: c.description || undefined,
        maxPoints: Math.max(...c.levels.map((l) => l.points)),
        levels: c.levels,
      })),
    };

    try {
      const url = editing
        ? `/api/courses/${courseId}/rubrics/${editing.id}`
        : `/api/courses/${courseId}/rubrics`;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editing ? "Rubric updated" : "Rubric created");
        setShowBuilder(false);
        fetchRubrics();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to save rubric");
      }
    } catch {
      toast.error("Error saving rubric");
    }
  }

  async function deleteRubric(id: string) {
    if (!confirm("Delete this rubric? Assignments using it will lose their rubric reference.")) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/rubrics/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Rubric deleted");
        fetchRubrics();
      }
    } catch {
      toast.error("Error deleting rubric");
    }
  }

  async function duplicateRubric(rubric: Rubric) {
    setEditing(null);
    setTitle(`${rubric.title} (Copy)`);
    setDescription(rubric.description || "");
    setIsTemplate(false);
    setCriteria(
      rubric.criteria.map((c, i) => ({
        title: c.title,
        description: c.description || "",
        maxPoints: c.maxPoints,
        position: i,
        levels: (c.levels as RubricLevel[]).map((l) => ({ ...l })),
      }))
    );
    setShowBuilder(true);
  }

  if (loading) return <div className="p-6">Loading rubrics...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Rubric Builder</h1>
        </div>
        {!showBuilder && (
          <Button size="sm" onClick={startNew}>
            <Plus className="w-4 h-4 mr-1" /> New Rubric
          </Button>
        )}
      </div>

      {/* ===== BUILDER VIEW ===== */}
      {showBuilder && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium">{editing ? "Edit Rubric" : "Create Rubric"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Title</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="e.g., Research Paper Rubric"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Description (optional)</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="Brief description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
              />
              Save as template (reusable across courses)
            </label>
          </div>

          {/* Criteria Grid */}
          {criteria.map((criterion, ci) => (
            <div key={ci} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Criterion {ci + 1}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeCriterion(ci)}>
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium">Criterion Title</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="e.g., Thesis Statement"
                    value={criterion.title}
                    onChange={(e) => updateCriterion(ci, { title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Description</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="Optional..."
                    value={criterion.description}
                    onChange={(e) => updateCriterion(ci, { description: e.target.value })}
                  />
                </div>
              </div>

              {/* Levels Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border px-2 py-1 text-left w-24">Label</th>
                      <th className="border px-2 py-1 text-left">Description</th>
                      <th className="border px-2 py-1 text-center w-16">Points</th>
                      <th className="border px-2 py-1 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {criterion.levels.map((level, li) => (
                      <tr key={li}>
                        <td className="border px-1 py-1">
                          <input
                            type="text"
                            className="w-full border-0 bg-transparent text-xs px-1"
                            placeholder="Level name"
                            value={level.label}
                            onChange={(e) => updateLevel(ci, li, { label: e.target.value })}
                          />
                        </td>
                        <td className="border px-1 py-1">
                          <input
                            type="text"
                            className="w-full border-0 bg-transparent text-xs px-1"
                            placeholder="What this level looks like..."
                            value={level.description}
                            onChange={(e) => updateLevel(ci, li, { description: e.target.value })}
                          />
                        </td>
                        <td className="border px-1 py-1">
                          <input
                            type="number"
                            min={0}
                            className="w-full border-0 bg-transparent text-xs text-center"
                            value={level.points}
                            onChange={(e) => updateLevel(ci, li, { points: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="border px-1 py-1 text-center">
                          <button className="text-red-400 hover:text-red-600" onClick={() => removeLevel(ci, li)}>
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Button size="sm" variant="ghost" className="text-xs mt-1" onClick={() => addLevel(ci)}>
                  + Add Level
                </Button>
              </div>
            </div>
          ))}

          <Button size="sm" variant="outline" onClick={addCriterion}>
            <Plus className="w-3 h-3 mr-1" /> Add Criterion
          </Button>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="text-xs font-medium mb-2">Preview — Total Points: {criteria.reduce((sum, c) => sum + Math.max(...c.levels.map((l) => l.points)), 0)}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="border px-2 py-1.5 text-left">Criteria</th>
                    {criteria[0]?.levels.map((_, i) => (
                      <th key={i} className="border px-2 py-1.5 text-center">
                        {criteria[0]?.levels[i]?.label || `Level ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((c, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1.5 font-medium">{c.title || "(Untitled)"}</td>
                      {c.levels.map((l, j) => (
                        <td key={j} className="border px-2 py-1.5 text-center text-muted-foreground">
                          {l.points} pts
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={saveRubric}>{editing ? "Update Rubric" : "Create Rubric"}</Button>
            <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* ===== LIST VIEW ===== */}
      {!showBuilder && (
        <>
          {rubrics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No rubrics created yet</p>
              <p className="text-sm mt-1">Create rubrics to use for grading assignments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rubrics.map((rubric) => (
                <div key={rubric.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{rubric.title}</h3>
                        {rubric.isTemplate && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Template</span>
                        )}
                      </div>
                      {rubric.description && <p className="text-sm text-muted-foreground mt-1">{rubric.description}</p>}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{rubric.criteria.length} criteria</span>
                        <span>{rubric.criteria.reduce((sum, c) => sum + Math.max(...(c.levels as RubricLevel[]).map((l) => l.points)), 0)} max points</span>
                        {rubric._count && <span>{rubric._count.assignments} assignments</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(rubric)} title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => duplicateRubric(rubric)} title="Duplicate">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteRubric(rubric.id)} title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Mini preview grid */}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="border px-2 py-1 text-left">Criteria</th>
                          {(rubric.criteria[0]?.levels as RubricLevel[])?.map((l, i) => (
                            <th key={i} className="border px-2 py-1 text-center">{l.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rubric.criteria.map((c) => (
                          <tr key={c.id}>
                            <td className="border px-2 py-1">{c.title}</td>
                            {(c.levels as RubricLevel[]).map((l, j) => (
                              <td key={j} className="border px-2 py-1 text-center text-muted-foreground">{l.points}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
