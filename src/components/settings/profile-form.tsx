"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadButton } from "@/lib/uploadthing";
import { getInitials } from "@/lib/utils";

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string;
    bio: string | null;
    image: string | null;
  };
  onUpdate?: (user: { name: string; bio: string | null; image: string | null }) => void;
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [image, setImage] = useState(user.image || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio: bio || undefined, image: image || "" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update profile");
      }

      const updated = await res.json();
      onUpdate?.({ name: updated.name, bio: updated.bio, image: updated.image });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal details and profile picture</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback className="text-lg">{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label className="text-sm font-medium">Profile Picture</Label>
              <UploadButton
                endpoint="userAvatar"
                onClientUploadComplete={(res) => {
                  if (res?.[0]) {
                    setImage(res[0].ufsUrl);
                    toast.success("Avatar uploaded");
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error(`Upload failed: ${error.message}`);
                }}
                appearance={{
                  button: "bg-primary text-primary-foreground text-xs px-3 py-1 h-8 mt-1",
                  allowedContent: "text-xs text-muted-foreground",
                }}
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              minLength={2}
              required
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{bio.length}/500 characters</p>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
