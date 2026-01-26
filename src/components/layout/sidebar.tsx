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
  Bookmark,
  StickyNote,
  Route,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";

interface SidebarProps {
  userRole: UserRole;
}

interface RouteItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  group: string;
}

const studentRoutes: RouteItem[] = [
  // Learning
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", group: "Learning" },
  { label: "Browse Courses", icon: BookOpen, href: "/courses", group: "Learning" },
  { label: "My Progress", icon: BarChart3, href: "/progress", group: "Learning" },
  { label: "Calendar", icon: Calendar, href: "/calendar", group: "Learning" },
  // Resources
  { label: "Bookmarks", icon: Bookmark, href: "/bookmarks", group: "Resources" },
  { label: "My Notes", icon: StickyNote, href: "/notes", group: "Resources" },
  { label: "Certificates", icon: Award, href: "/certificates", group: "Resources" },
  { label: "Learning Paths", icon: Route, href: "/learning-paths", group: "Resources" },
  // Community
  { label: "Forums", icon: MessagesSquare, href: "/forums", group: "Community" },
  { label: "Chat", icon: MessageSquare, href: "/chat", group: "Community" },
  // Account
  { label: "Settings", icon: Settings, href: "/student/settings", group: "Account" },
];

const instructorRoutes: RouteItem[] = [
  // Teaching
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", group: "Teaching" },
  { label: "My Courses", icon: BookOpen, href: "/instructor/courses", group: "Teaching" },
  { label: "Create Course", icon: PlusCircle, href: "/instructor/courses/create", group: "Teaching" },
  { label: "Media Library", icon: ImageIcon, href: "/instructor/media", group: "Teaching" },
  { label: "Analytics", icon: BarChart3, href: "/instructor/analytics", group: "Teaching" },
  // Browse
  { label: "Browse Courses", icon: GraduationCap, href: "/courses", group: "Browse" },
  // Community
  { label: "Forums", icon: MessagesSquare, href: "/forums", group: "Community" },
  { label: "Chat", icon: MessageSquare, href: "/chat", group: "Community" },
  // Account
  { label: "Certificates", icon: Award, href: "/certificates", group: "Account" },
  { label: "Settings", icon: Settings, href: "/instructor/settings", group: "Account" },
];

const adminRoutes: RouteItem[] = [
  // Overview
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", group: "Overview" },
  { label: "Browse Courses", icon: BookOpen, href: "/courses", group: "Overview" },
  // Management
  { label: "Admin Panel", icon: Settings, href: "/admin", group: "Management" },
  { label: "Reports", icon: FileSpreadsheet, href: "/admin/reports", group: "Management" },
  { label: "Audit Logs", icon: ScrollText, href: "/admin/audit-logs", group: "Management" },
  // Tools
  { label: "Media Library", icon: ImageIcon, href: "/instructor/media", group: "Tools" },
  // Community
  { label: "Forums", icon: MessagesSquare, href: "/forums", group: "Community" },
  { label: "Chat", icon: MessageSquare, href: "/chat", group: "Community" },
  // Account
  { label: "Certificates", icon: Award, href: "/certificates", group: "Account" },
  { label: "Settings", icon: Settings, href: "/admin/settings", group: "Account" },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const routes =
    userRole === "ADMIN"
      ? adminRoutes
      : userRole === "INSTRUCTOR"
        ? instructorRoutes
        : studentRoutes;

  // Group routes by their group property
  const groupedRoutes = routes.reduce<Record<string, RouteItem[]>>((acc, route) => {
    if (!acc[route.group]) {
      acc[route.group] = [];
    }
    acc[route.group].push(route);
    return acc;
  }, {});

  const groupOrder = Object.keys(groupedRoutes);

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
      <div className="flex flex-col w-full px-3 pb-4">
        {groupOrder.map((group, groupIndex) => (
          <div key={group} className={cn(groupIndex > 0 && "mt-4")}>
            <div className="px-3 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group}
              </span>
            </div>
            {groupedRoutes[group].map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-x-2 text-muted-foreground text-sm font-medium px-3 py-2.5 rounded-md transition-all hover:text-foreground hover:bg-muted/50",
                  pathname === route.href &&
                    "text-primary bg-primary/10 hover:bg-primary/10 hover:text-primary"
                )}
              >
                <route.icon
                  className={cn(
                    "h-4 w-4",
                    pathname === route.href && "text-primary"
                  )}
                />
                {route.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
