"use client";

import { ProfileSchema } from "@stoafi/core";
import { ProfileForm } from "@/components/profile-form";
import { StoafiDb } from "@/storage/db";
import { putSingleton } from "@/storage/repo";
import { useAppStore } from "@/store";

const db = new StoafiDb();

export default function ProfilePage() {
  const setProfile = useAppStore((s) => s.setProfile);
  const profile = useAppStore((s) => s.profile);

  return (
    <main>
      <h1>Profile</h1>
      <ProfileForm
        initial={profile ?? undefined}
        onSave={async (value) => {
          const saved = await putSingleton(db, "profile", ProfileSchema, value);
          setProfile(saved);
        }}
      />
    </main>
  );
}
