import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Plus, MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateCategoryDialog } from "@/components/forums/create-category-dialog";
import { CategoryList } from "@/components/forums/category-list";

async function getCategories() {
  return db.forumCategory.findMany({
    orderBy: { position: "asc" },
    include: {
      _count: {
        select: { threads: true },
      },
    },
  });
}

export default async function ForumAdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/forums");
  }

  const categories = await getCategories();

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/forums">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Forum Administration</h1>
          <p className="text-muted-foreground">
            Manage forum categories and settings
          </p>
        </div>
        <CreateCategoryDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </CreateCategoryDialog>
      </div>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Forum Categories
          </CardTitle>
          <CardDescription>
            Create, edit, and organize forum categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                No categories created yet
              </p>
              <CreateCategoryDialog>
                <Button>Create First Category</Button>
              </CreateCategoryDialog>
            </div>
          ) : (
            <CategoryList
              categories={categories.map((c) => ({
                ...c,
                threadCount: c._count.threads,
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
