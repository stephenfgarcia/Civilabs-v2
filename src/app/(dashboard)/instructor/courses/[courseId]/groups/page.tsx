"use client";

import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { Users, Plus, Shuffle, Trash2, UserPlus, UserMinus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface EnrolledStudent {
  userId: string;
  user: { id: string; name: string | null; email: string };
}

export default function InstructorGroupsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [groups, setGroups] = useState<Group[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  // Create form state
  const [newGroup, setNewGroup] = useState({ name: "", maxMembers: 5 });

  // Auto-assign form state
  const [autoAssign, setAutoAssign] = useState({
    strategy: "RANDOM" as "RANDOM" | "BALANCED",
    groupSize: 4,
    groupNamePrefix: "Group",
  });

  useEffect(() => {
    fetchGroups();
    fetchStudents();
  }, [courseId]);

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

  async function fetchStudents() {
    try {
      const res = await fetch(`/api/courses/${courseId}/gradebook?action=students`);
      if (res.ok) {
        const data = await res.json();
        // The gradebook students endpoint returns enrollments
        if (Array.isArray(data)) {
          setEnrolledStudents(data);
        }
      }
    } catch {
      // Fallback: fetch enrollments directly
      try {
        const res = await fetch(`/api/courses/${courseId}/groups`);
        if (res.ok) {
          // We'll get students from group data
        }
      } catch {
        // Ignore
      }
    }
  }

  async function createGroup() {
    if (!newGroup.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    try {
      const res = await fetch(`/api/courses/${courseId}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });
      if (res.ok) {
        toast.success("Group created");
        setShowCreate(false);
        setNewGroup({ name: "", maxMembers: 5 });
        fetchGroups();
      } else {
        toast.error("Failed to create group");
      }
    } catch {
      toast.error("Error creating group");
    }
  }

  async function deleteGroup(groupId: string) {
    if (!confirm("Delete this group? Members will be unassigned.")) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/groups/${groupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Group deleted");
        fetchGroups();
      } else {
        toast.error("Failed to delete group");
      }
    } catch {
      toast.error("Error deleting group");
    }
  }

  async function addMember(groupId: string, userId: string) {
    try {
      const res = await fetch(`/api/courses/${courseId}/groups/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "MEMBER" }),
      });
      if (res.ok) {
        toast.success("Member added");
        setAddingTo(null);
        fetchGroups();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to add member");
      }
    } catch {
      toast.error("Error adding member");
    }
  }

  async function removeMember(groupId: string, userId: string) {
    try {
      const res = await fetch(`/api/courses/${courseId}/groups/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", userId }),
      });
      if (res.ok) {
        toast.success("Member removed");
        fetchGroups();
      } else {
        toast.error("Failed to remove member");
      }
    } catch {
      toast.error("Error removing member");
    }
  }

  async function runAutoAssign() {
    try {
      const res = await fetch(`/api/courses/${courseId}/groups/auto-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(autoAssign),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Created ${data.groupsCreated} groups with ${data.studentsAssigned} students`);
        setShowAutoAssign(false);
        fetchGroups();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to auto-assign");
      }
    } catch {
      toast.error("Error auto-assigning groups");
    }
  }

  // Get students not in any group
  const assignedUserIds = new Set(groups.flatMap((g) => g.members.map((m) => m.userId)));
  const unassignedStudents = enrolledStudents.filter((s) => !assignedUserIds.has(s.userId));

  if (loading) return <div className="p-6">Loading groups...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Course Groups</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAutoAssign(true)}>
            <Shuffle className="w-4 h-4 mr-1" />
            Auto-Assign
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Auto-Assign Modal */}
      {showAutoAssign && (
        <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
          <h3 className="font-medium">Auto-Assign Students to Groups</h3>
          <p className="text-sm text-muted-foreground">
            {unassignedStudents.length} unassigned students will be distributed into new groups.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium">Strategy</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={autoAssign.strategy}
                onChange={(e) => setAutoAssign({ ...autoAssign, strategy: e.target.value as "RANDOM" | "BALANCED" })}
              >
                <option value="RANDOM">Random</option>
                <option value="BALANCED">Balanced (by progress)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Group Size</label>
              <input
                type="number"
                min={2}
                max={50}
                className="w-full border rounded px-2 py-1 text-sm"
                value={autoAssign.groupSize}
                onChange={(e) => setAutoAssign({ ...autoAssign, groupSize: parseInt(e.target.value) || 4 })}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Name Prefix</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={autoAssign.groupNamePrefix}
                onChange={(e) => setAutoAssign({ ...autoAssign, groupNamePrefix: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={runAutoAssign}>Assign</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAutoAssign(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
          <h3 className="font-medium">Create Group</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Group Name</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="e.g., Team Alpha"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Max Members</label>
              <input
                type="number"
                min={2}
                max={50}
                className="w-full border rounded px-2 py-1 text-sm"
                value={newGroup.maxMembers}
                onChange={(e) => setNewGroup({ ...newGroup, maxMembers: parseInt(e.target.value) || 5 })}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={createGroup}>Create</Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No groups created yet</p>
          <p className="text-sm mt-1">Create groups manually or use auto-assign</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{group.name}</h3>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {group._count.members}/{group.maxMembers}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => deleteGroup(group.id)}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Members */}
              <div className="space-y-1">
                {group.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      {member.role === "LEADER" && <Crown className="w-3 h-3 text-amber-500" />}
                      <span className="truncate">{member.user.name || member.user.email}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={() => removeMember(group.id, member.userId)}
                    >
                      <UserMinus className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Member */}
              {group._count.members < group.maxMembers && (
                <>
                  {addingTo === group.id ? (
                    <div className="space-y-1">
                      <select
                        className="w-full border rounded px-2 py-1 text-xs"
                        onChange={(e) => {
                          if (e.target.value) addMember(group.id, e.target.value);
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Select student...</option>
                        {unassignedStudents.map((s) => (
                          <option key={s.userId} value={s.userId}>
                            {s.user.name || s.user.email}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => setAddingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => setAddingTo(group.id)}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Add Member
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
