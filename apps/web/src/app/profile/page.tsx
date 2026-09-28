"use client";

import { ProfileSchema } from "@stoafi/core";
import { useTranslations } from "next-intl";
import { InstallmentExpenses } from "@/components/installment-expenses";
import { ProfileForm } from "@/components/profile-form";
import { monthOf } from "@/lib/clock";
import { db } from "@/storage/instance";
import { removeQueueItem } from "@/storage/queue-repo";
import { putSingleton } from "@/storage/repo";
import { useAppStore } from "@/store";
import { Page } from "@/components/ui/page";

export default function ProfilePage() {
  const setProfile = useAppStore((s) => s.setProfile);
  const profile = useAppStore((s) => s.profile);
  const currency = useAppStore((s) => s.currency);
  const queueItems = useAppStore((s) => s.queueItems);
  const setQueueItems = useAppStore((s) => s.setQueueItems);
  const today = useAppStore((s) => s.today);
  const t = useTranslations("profile");

  return (
    <Page title={t("title")}>
      <ProfileForm
        initial={profile ?? undefined}
        currency={currency}
        onSave={async (value) => {
          const saved = await putSingleton(db, "profile", ProfileSchema, value);
          setProfile(saved);
        }}
      />
      <InstallmentExpenses
        items={queueItems}
        month={monthOf(today)}
        onRemove={(item) => {
          setQueueItems(queueItems.filter((i) => i.id !== item.id));
          void removeQueueItem(db, item.id).catch((error: unknown) =>
            console.error("Could not remove the installment purchase", error),
          );
        }}
      />
    </Page>
  );
}
