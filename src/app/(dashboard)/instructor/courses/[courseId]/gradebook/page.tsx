"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BookOpen, Plus, Download, Trash2, Eye, EyeOff,
} from "lucide-react";

interface GradeCategory {
  id: string;
  name: string;
  weight: number;
  position: number;
  dropLowest: number;
  gradeItems: GradeItem[];
}

interface GradeItem {
  id: string;
  title: string;
  points: number;
  type: string;
  isExtraCredit: boolean;
  isVisible: boolean;
  studentGrades: StudentGrade[];
}

interface StudentGrade {
  id: string;
  userId: string;
  score: number | null;
  overrideScore: number | null;
  user?: { id: string; name: string | null; email: string };
}

interface Student {
  id: string;
  name: string | null;
  email: string;
}

export default function GradebookPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [categories, setCategories] = useState<GradeCategory[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryWeight, setNewCategoryWeight] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemPoints, setNewItemPoints] = useState("100");
  const [editingGrade, setEditingGrade] = useState<{ itemId: string; userId: string } | null>(null);
  const [gradeValue, setGradeValue] = useState("");

  useEffect(() => { fetchGradebook(); }, []);

  async function fetchGradebook() {
    try {
      const res = await fetch(`/api/courses/${courseId}/gradebook`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
        setStudents(data.students);
      }
    } catch { toast.error("Failed to load gradebook"); }
    finally { setLoading(false); }
  }

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/gradebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName, weight: parseFloat(newCategoryWeight) || 0 }),
      });
      if (res.ok) {
        toast.success("Category added");
        setNewCategoryName(""); setNewCategoryWeight(""); setShowAddCategory(false);
        fetchGradebook();
      } else { const e = await res.json(); toast.error(e.message); }
    } catch { toast.error("Error adding category"); }
  }

  async function deleteCategory(categoryId: string) {
    if (!confirm("Delete this category and all its items?")) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/gradebook/categories/${categoryId}`, { method: "DELETE" });
      if (res.ok) { toast.success("Category deleted"); fetchGradebook(); }
    } catch { toast.error("Error deleting category"); }
  }

  async function addItem(categoryId: string) {
    if (!newItemTitle.trim()) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/gradebook/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, title: newItemTitle, points: parseFloat(newItemPoints) || 100 }),
      });
      if (res.ok) {
        toast.success("Item added");
        setNewItemTitle(""); setNewItemPoints("100"); setShowAddItem(null);
        fetchGradebook();
      } else { const e = await res.json(); toast.error(e.message); }
    } catch { toast.error("Error adding item"); }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Delete this grade item?")) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/gradebook/items/${itemId}`, { method: "DELETE" });
      if (res.ok) { toast.success("Item deleted"); fetchGradebook(); }
    } catch { toast.error("Error deleting item"); }
  }

  async function saveGrade(gradeItemId: string, userId: string) {
    const score = parseFloat(gradeValue);
    if (isNaN(score) || score < 0) { toast.error("Invalid grade"); return; }
    try {
      const res = await fetch(`/api/courses/${courseId}/gradebook/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeItemId, userId, score }),
      });
      if (res.ok) {
        toast.success("Grade saved");
        setEditingGrade(null); setGradeValue("");
        fetchGradebook();
      } else { const e = await res.json(); toast.error(e.message); }
    } catch { toast.error("Error saving grade"); }
  }

  async function exportGradebook() {
    window.open(`/api/courses/${courseId}/gradebook/export`, "_blank");
  }

  function getStudentGrade(item: GradeItem, studentId: string): string {
    const g = item.studentGrades.find((sg) => sg.userId === studentId);
    if (!g) return "-";
    const score = g.overrideScore ?? g.score;
    return score !== null ? String(score) : "-";
  }

  function calculateWeightedTotal(studentId: string): string {
    let weightedTotal = 0;
    let totalWeight = 0;

    for (const cat of categories) {
      let catEarned = 0;
      let catPossible = 0;

      for (const item of cat.gradeItems) {
        const g = item.studentGrades.find((sg) => sg.userId === studentId);
        const score = g?.overrideScore ?? g?.score;
        if (score !== null && score !== undefined) {
          catEarned += score;
          catPossible += item.points;
        }
      }

      if (catPossible > 0 && cat.weight > 0) {
        weightedTotal += (catEarned / catPossible) * cat.weight;
        totalWeight += cat.weight;
      }
    }

    if (totalWeight === 0) return "-";
    return ((weightedTotal / totalWeight) * 100).toFixed(1) + "%";
  }

  if (loading) return <div className="p-6">Loading gradebook...</div>;

  const allItems = categories.flatMap((c) => c.gradeItems);
  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gradebook</h1>
          <p className="text-sm text-muted-foreground">
            {students.length} students, {allItems.length} items, {totalWeight}% weight assigned
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportGradebook}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowAddCategory(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Category
          </Button>
        </div>
      </div>

      {totalWeight !== 100 && totalWeight > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded text-sm">
          Category weights sum to {totalWeight}% (should be 100%)
        </div>
      )}

      {showAddCategory && (
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">New Category</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. Assignments" />
            </div>
            <div className="w-24 space-y-1">
              <Label className="text-xs">Weight %</Label>
              <Input type="number" value={newCategoryWeight} onChange={(e) => setNewCategoryWeight(e.target.value)} min={0} max={100} />
            </div>
            <Button size="sm" onClick={addCategory}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddCategory(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No grade categories yet. Add categories to organize your gradebook.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 sticky left-0 bg-background min-w-[180px]">Student</th>
                {categories.map((cat) => (
                  cat.gradeItems.map((item) => (
                    <th key={item.id} className="p-2 text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs text-muted-foreground">{cat.name}</span>
                        <span className="text-xs font-medium truncate max-w-[80px]">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground">{item.points}pts</span>
                        <div className="flex gap-1">
                          {!item.isVisible && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                          <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))
                ))}
                <th className="p-2 text-center min-w-[80px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 sticky left-0 bg-background">
                    <div className="font-medium text-xs">{student.name || "Unknown"}</div>
                    <div className="text-[10px] text-muted-foreground">{student.email}</div>
                  </td>
                  {categories.map((cat) =>
                    cat.gradeItems.map((item) => (
                      <td key={`${student.id}-${item.id}`} className="p-2 text-center">
                        {editingGrade?.itemId === item.id && editingGrade?.userId === student.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={gradeValue}
                              onChange={(e) => setGradeValue(e.target.value)}
                              className="w-14 h-6 text-xs"
                              min={0}
                              max={item.points}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveGrade(item.id, student.id);
                                if (e.key === "Escape") { setEditingGrade(null); setGradeValue(""); }
                              }}
                            />
                          </div>
                        ) : (
                          <button
                            className="w-full text-center text-xs hover:bg-muted px-1 py-0.5 rounded"
                            onClick={() => {
                              setEditingGrade({ itemId: item.id, userId: student.id });
                              setGradeValue(getStudentGrade(item, student.id) === "-" ? "" : getStudentGrade(item, student.id));
                            }}
                          >
                            {getStudentGrade(item, student.id)}
                          </button>
                        )}
                      </td>
                    ))
                  )}
                  <td className="p-2 text-center font-medium text-xs">{calculateWeightedTotal(student.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Item to Category */}
      {categories.map((cat) => (
        <div key={cat.id} className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">{cat.name} ({cat.weight}%)</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAddItem(cat.id)}>
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteCategory(cat.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {showAddItem === cat.id && (
            <div className="flex gap-2 items-end mt-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Title</Label>
                <Input value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} placeholder="Item name" className="h-8" />
              </div>
              <div className="w-20 space-y-1">
                <Label className="text-xs">Points</Label>
                <Input type="number" value={newItemPoints} onChange={(e) => setNewItemPoints(e.target.value)} className="h-8" />
              </div>
              <Button size="sm" onClick={() => addItem(cat.id)}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddItem(null)}>Cancel</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
