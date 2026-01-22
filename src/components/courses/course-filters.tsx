"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    courses: number;
  };
}

interface CourseFiltersProps {
  categories: Category[];
  selectedCategory?: string;
  searchQuery?: string;
}

export function CourseFilters({
  categories,
  selectedCategory,
  searchQuery,
}: CourseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery || "");

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.push(`/courses?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters("search", search || null);
  };

  const clearFilters = () => {
    setSearch("");
    startTransition(() => {
      router.push("/courses");
    });
  };

  const hasFilters = selectedCategory || searchQuery;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 focus-glow"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          Search
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={isPending}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </form>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!selectedCategory ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilters("category", null)}
          disabled={isPending}
          className="transition-all duration-200"
        >
          All Courses
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.slug ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters("category", category.slug)}
            disabled={isPending}
            className="transition-all duration-200"
          >
            {category.name}
            <span className="ml-1 text-xs opacity-70">
              ({category._count.courses})
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
