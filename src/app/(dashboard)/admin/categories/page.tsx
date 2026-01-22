import { db } from "@/lib/db";
import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryList } from "@/components/admin/category-list";
import { CreateCategoryDialog } from "@/components/admin/create-category-dialog";

async function getCategories() {
  return db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Category Management</h2>
          <p className="text-sm text-muted-foreground">
            {categories.length} categories total
          </p>
        </div>
        <CreateCategoryDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </CreateCategoryDialog>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Course Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="py-8 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                No categories created yet
              </p>
              <CreateCategoryDialog>
                <Button>Create First Category</Button>
              </CreateCategoryDialog>
            </div>
          ) : (
            <CategoryList
              categories={categories.map((cat) => ({
                ...cat,
                courseCount: cat._count.courses,
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
