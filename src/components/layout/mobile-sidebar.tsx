"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { UserRole } from "@prisma/client";

interface MobileSidebarProps {
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ userRole, isOpen, onClose }: MobileSidebarProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-background transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar userRole={userRole} />
      </div>
    </>
  );
}
