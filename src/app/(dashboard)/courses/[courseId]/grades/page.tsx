"use client";

import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { BookOpen, Trophy } from "lucide-react";

interface GradeCategory {
  id: string;
  name: string;
  weight: number;
  gradeItems: GradeItem[];
}

interface GradeItem {
  id: string;
  title: string;
  points: number;
  type: string;
  isExtraCredit: boolean;
  dueDate: string | null;
  studentGrades: Array<{ score: number | null; overrideScore: number | null; gradedAt: string | null }>;
}

export default function StudentGradesPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [categories, setCategories] = useState<GradeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchGrades(); }, []);

  async function fetchGrades() {
    try {
      const res = await fetch(`/api/courses/${courseId}/gradebook`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch { toast.error("Failed to load grades"); }
    finally { setLoading(false); }
  }

  function getScore(item: GradeItem): number | null {
    const g = item.studentGrades[0]; // Student only sees own grades
    if (!g) return null;
    return g.overrideScore ?? g.score;
  }

  function calculateCategoryTotal(cat: GradeCategory): { earned: number; possible: number; percent: number | null } {
    let earned = 0;
    let possible = 0;

    for (const item of cat.gradeItems) {
      const score = getScore(item);
      if (score !== null) {
        earned += score;
        possible += item.points;
      }
    }

    return {
      earned,
      possible,
      percent: possible > 0 ? Math.round((earned / possible) * 100) : null,
    };
  }

  function calculateOverallGrade(): { percent: number | null; letter: string } {
    let weightedTotal = 0;
    let totalWeight = 0;

    for (const cat of categories) {
      const { earned, possible } = calculateCategoryTotal(cat);
      if (possible > 0 && cat.weight > 0) {
        weightedTotal += (earned / possible) * cat.weight;
        totalWeight += cat.weight;
      }
    }

    if (totalWeight === 0) return { percent: null, letter: "-" };

    const percent = Math.round((weightedTotal / totalWeight) * 100);
    let letter = "F";
    if (percent >= 93) letter = "A";
    else if (percent >= 90) letter = "A-";
    else if (percent >= 87) letter = "B+";
    else if (percent >= 83) letter = "B";
    else if (percent >= 80) letter = "B-";
    else if (percent >= 77) letter = "C+";
    else if (percent >= 73) letter = "C";
    else if (percent >= 70) letter = "C-";
    else if (percent >= 67) letter = "D+";
    else if (percent >= 60) letter = "D";

    return { percent, letter };
  }

  if (loading) return <div className="p-6">Loading grades...</div>;

  const overall = calculateOverallGrade();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Grades</h1>
        {overall.percent !== null && (
          <div className="text-right">
            <div className="text-3xl font-bold">{overall.letter}</div>
            <div className="text-sm text-muted-foreground">{overall.percent}%</div>
          </div>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No grades available yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const total = calculateCategoryTotal(cat);
            return (
              <div key={cat.id} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
                  <span className="font-medium text-sm">{cat.name}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Weight: {cat.weight}%</span>
                    {total.percent !== null && (
                      <span className="font-medium text-foreground">{total.percent}%</span>
                    )}
                  </div>
                </div>
                <div className="divide-y">
                  {cat.gradeItems.map((item) => {
                    const score = getScore(item);
                    return (
                      <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.type} &middot; {item.points} pts
                            {item.isExtraCredit && " (Extra Credit)"}
                            {item.dueDate && ` &middot; Due ${new Date(item.dueDate).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div className="text-right">
                          {score !== null ? (
                            <div>
                              <span className="font-medium">{score}</span>
                              <span className="text-muted-foreground">/{item.points}</span>
                              <div className="text-xs text-muted-foreground">
                                {Math.round((score / item.points) * 100)}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not graded</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
