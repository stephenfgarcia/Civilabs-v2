"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserSearchProps {
  currentSearch: string;
  currentRole: string;
}

export function UserSearch({ currentSearch, currentRole }: UserSearchProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [role, setRole] = useState(currentRole);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (newRole && newRole !== "all") params.set("role", newRole);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10"
        />
      </div>
      <Select value={role || "all"} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-[180px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Filter by role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="STUDENT">Students</SelectItem>
          <SelectItem value="INSTRUCTOR">Instructors</SelectItem>
          <SelectItem value="ADMIN">Admins</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleSearch}>Search</Button>
    </div>
  );
}
