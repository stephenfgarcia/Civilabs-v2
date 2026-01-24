"use client";

import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { Users, Crown, Mail } from "lucide-react";

interface GroupMember {
  id: string;
  userId: string;
  role: "LEADER" | "MEMBER";
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface Group {
  id: string;
  name: string;
  maxMembers: number;
  members: GroupMember[];
  _count: { members: number };
}

export default function StudentGroupsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch(`/api/courses/${courseId}/groups`);
        if (res.ok) setGroups(await res.json());
      } catch {
        toast.error("Failed to load groups");
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, [courseId]);

  if (loading) return <div className="p-6">Loading groups...</div>;

  // Find the current user's group (will be highlighted)
  const myGroup = groups.find((g) =>
    g.members.some((m) => m.userId === "current") // We'll check via API response
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-6 h-6" />
        <h1 className="text-2xl font-bold">My Group</h1>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No groups have been created for this course yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="border rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{group.name}</h2>
                <span className="text-sm text-muted-foreground">
                  {group._count.members}/{group.maxMembers} members
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate">
                          {member.user.name || "Unknown"}
                        </p>
                        {member.role === "LEADER" && (
                          <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{member.user.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
