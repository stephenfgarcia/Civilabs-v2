import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderOpen,
  BarChart3,
  Settings,
  MessageSquare,
  Shield,
} from "lucide-react";

const adminNavItems = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
  },
  {
    label: "Courses",
    icon: BookOpen,
    href: "/admin/courses",
  },
  {
    label: "Categories",
    icon: FolderOpen,
    href: "/admin/categories",
  },
  {
    label: "Forums",
    icon: MessageSquare,
    href: "/admin/forums",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-destructive/10 rounded-lg">
          <Shield className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            Manage your LMS platform
          </p>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {adminNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
