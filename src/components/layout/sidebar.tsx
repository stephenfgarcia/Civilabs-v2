"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  MessageSquare,
  MessagesSquare,
  Award,
  Settings,
  Users,
  FolderOpen,
  BarChart3,
  PlusCircle,
  ImageIcon,
  FileSpreadsheet,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";

interface SidebarProps {
  userRole: UserRole;
}

// Common routes available to all authenticated users
const commonRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Browse Courses",
    icon: BookOpen,
    href: "/courses",
  },
  {
    label: "Forums",
    icon: MessagesSquare,
    href: "/forums",
  },
  {
    label: "Certificates",
    icon: Award,
    href: "/certificates",
  },
];

const studentRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Browse Courses",
    icon: BookOpen,
    href: "/courses",
  },
  {
    label: "Forums",
    icon: MessagesSquare,
    href: "/forums",
  },
  {
    label: "Chat",
    icon: MessageSquare,
    href: "/chat",
  },
  {
    label: "Certificates",
    icon: Award,
    href: "/certificates",
  },
];

const instructorRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "My Courses",
    icon: BookOpen,
    href: "/instructor/courses",
  },
  {
    label: "Create Course",
    icon: PlusCircle,
    href: "/instructor/courses/create",
  },
  {
    label: "Media Library",
    icon: ImageIcon,
    href: "/instructor/media",
  },
  {
    label: "Browse Courses",
    icon: GraduationCap,
    href: "/courses",
  },
  {
    label: "Forums",
    icon: MessagesSquare,
    href: "/forums",
  },
  {
    label: "Chat",
    icon: MessageSquare,
    href: "/chat",
  },
  {
    label: "Certificates",
    icon: Award,
    href: "/certificates",
  },
];

const adminRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Browse Courses",
    icon: BookOpen,
    href: "/courses",
  },
  {
    label: "Media Library",
    icon: ImageIcon,
    href: "/instructor/media",
  },
  {
    label: "Forums",
    icon: MessagesSquare,
    href: "/forums",
  },
  {
    label: "Chat",
    icon: MessageSquare,
    href: "/chat",
  },
  {
    label: "Certificates",
    icon: Award,
    href: "/certificates",
  },
  {
    label: "Reports",
    icon: FileSpreadsheet,
    href: "/admin/reports",
  },
  {
    label: "Audit Logs",
    icon: ScrollText,
    href: "/admin/audit-logs",
  },
  {
    label: "Admin Panel",
    icon: Settings,
    href: "/admin",
  },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const routes =
    userRole === "ADMIN"
      ? adminRoutes
      : userRole === "INSTRUCTOR"
        ? instructorRoutes
        : studentRoutes;

  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-card shadow-sm">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">CL</span>
          </div>
          <span className="font-bold text-xl">CiviLabs</span>
        </Link>
      </div>
      <div className="flex flex-col w-full">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-x-2 text-muted-foreground text-sm font-medium pl-6 transition-all hover:text-foreground hover:bg-muted/50",
              pathname === route.href &&
                "text-primary bg-primary/10 hover:bg-primary/10 hover:text-primary border-r-2 border-primary"
            )}
          >
            <div className="flex items-center gap-x-2 py-4">
              <route.icon
                className={cn(
                  "h-5 w-5",
                  pathname === route.href && "text-primary"
                )}
              />
              {route.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
