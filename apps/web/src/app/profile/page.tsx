"use client";

import { ProfileSchema, project } from "@stoafi/core";
import { useTranslations } from "next-intl";
import { ProfileOverview } from "@/components/profile-overview";
import { ProfileForm } from "@/components/profile-form";
import { Page } from "@/components/ui/page";
import { notify } from "@/components/ui/toaster";
import { monthOf } from "@/lib/clock";
import { mergeProfile } from "@/lib/profile-merge";
import { db } from "@/storage/instance";
import { putSingleton } from "@/storage/repo";
import { useAppStore, useInstallmentCommitments } from "@/store";

export default function ProfilePage() {
  const setProfile = useAppStore((s) => s.setProfile);
  const profile = useAppStore((s) => s.profile);
  const currency = useAppStore((s) => s.currency);
  const today = useAppStore((s) => s.today);
  const commitments = useInstallmentCommitments();
  const t = useTranslations("profile");
  const tc = useTranslations("common");

  return (
    <Page title={t("title")}>
      {profile && <ProfileOverview profile={profile} month={monthOf(today)} />}
      <ProfileForm
        initial={profile ?? undefined}
        currency={currency}
        currentMonth={monthOf(today)}
        installmentLoad={project({ income: 0 }, commitments, monthOf(today)).installmentLoad}
        onSave={async (settings) => {
          const saved = await putSingleton(
            db,
            "profile",
            ProfileSchema,
            mergeProfile(profile, settings),
          );
          setProfile(saved);
          notify(tc("saved"));
        }}
      />
    </Page>
  );
}
