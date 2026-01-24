"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { NotificationForm } from "./notification-form";
import { PrivacyForm } from "./privacy-form";
import { PlatformForm } from "./platform-form";
import { MFAForm } from "./mfa-form";
import { ConsentForm } from "./consent-form";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
  name: string | null;
  email: string;
  bio: string | null;
  image: string | null;
  role: string;
  profileVisibility: boolean;
}

interface NotificationPreferences {
  emailEnrollment: boolean;
  emailCourseUpdates: boolean;
  emailCertificates: boolean;
  emailQuizResults: boolean;
  emailForumReplies: boolean;
  emailAnnouncements: boolean;
  emailChatMentions: boolean;
}

interface PlatformSettings {
  registrationOpen: boolean;
  defaultRole: "STUDENT" | "INSTRUCTOR";
  maintenanceMode: boolean;
  platformName: string;
  platformDescription: string | null;
  maxFileUploadSize: number;
  allowedFileTypes: string;
}

export function SettingsPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [hasPassword, setHasPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const userRole = session?.user?.role;

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      try {
        // Fetch profile data
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // Fetch notification preferences
        const notifRes = await fetch("/api/settings/notifications");
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData);
        }

        // Student-specific: privacy settings already in profile response

        // Admin-specific: fetch platform settings
        if (userRole === "ADMIN") {
          const platformRes = await fetch("/api/admin/settings/platform");
          if (platformRes.ok) {
            const platformData = await platformRes.json();
            setPlatformSettings(platformData);
          }
        }

        // Check if user has a password (non-OAuth)
        // We infer this: if the user logged in via credentials, they have a password
        // OAuth-only users won't have one. We check by attempting the profile endpoint.
        // For simplicity, we assume password exists unless the account was created via OAuth only.
        // The password form component handles the "no password" case via the API response.
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchSettings();
    }
  }, [session, userRole]);

  if (isLoading || !profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[250px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile - All roles */}
        <ProfileForm
          user={{
            name: profile.name,
            email: profile.email,
            bio: profile.bio,
            image: profile.image,
          }}
          onUpdate={(updated) => {
            setProfile((prev) => prev ? { ...prev, ...updated } : prev);
          }}
        />

        {/* Password - All roles */}
        <PasswordForm hasPassword={hasPassword} />

        {/* MFA - All roles */}
        <MFAForm />

        {/* Notifications - All roles */}
        {notifications && <NotificationForm initialPreferences={notifications} />}

        {/* Privacy & Consent - All roles */}
        <ConsentForm />

        {/* Privacy - Student only */}
        {userRole === "STUDENT" && (
          <PrivacyForm profileVisibility={profile.profileVisibility} />
        )}

        {/* Platform Settings - Admin only */}
        {userRole === "ADMIN" && platformSettings && (
          <PlatformForm initialSettings={platformSettings} />
        )}
      </div>
    </div>
  );
}
