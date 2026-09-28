"use client";

import { ProfileSchema } from "@stoafi/core";
import { useTranslations } from "next-intl";
import { ProfileForm } from "@/components/profile-form";
import { db } from "@/storage/instance";
import { putSingleton } from "@/storage/repo";
import { useAppStore } from "@/store";

export default function ProfilePage() {
  const setProfile = useAppStore((s) => s.setProfile);
  const profile = useAppStore((s) => s.profile);
  const currency = useAppStore((s) => s.currency);
  const t = useTranslations("profile");

  return (
    <main>
      <h1>{t("title")}</h1>
      <ProfileForm
        initial={profile ?? undefined}
        currency={currency}
        onSave={async (value) => {
          const saved = await putSingleton(db, "profile", ProfileSchema, value);
          setProfile(saved);
        }}
      />
    </main>
  );
}
