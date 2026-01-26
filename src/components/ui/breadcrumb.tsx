import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 shrink-0" />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors truncate max-w-[200px]"
                title={item.label}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="text-foreground font-medium truncate max-w-[200px]"
                title={item.label}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
