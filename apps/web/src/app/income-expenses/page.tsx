"use client";

import { ProfileSchema, installmentCommitments } from "@stoafi/core";
import { useTranslations } from "next-intl";
import { MoneyFlowSummary } from "@/components/money-flow-summary";
import { IncomeExpensesForm } from "@/components/income-expenses-form";
import { InstallmentExpenses } from "@/components/installment-expenses";
import { Page } from "@/components/ui/page";
import { notify, notifyUndo } from "@/components/ui/toaster";
import { monthOf } from "@/lib/clock";
import { mergeProfile } from "@/lib/profile-merge";
import { db } from "@/storage/instance";
import { removeQueueItem, saveQueueItem } from "@/storage/queue-repo";
import { putSingleton } from "@/storage/repo";
import { useAppStore } from "@/store";

export default function IncomeExpensesPage() {
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const currency = useAppStore((s) => s.currency);
  const queueItems = useAppStore((s) => s.queueItems);
  const setQueueItems = useAppStore((s) => s.setQueueItems);
  const today = useAppStore((s) => s.today);
  const t = useTranslations("incomeExpenses");
  const tc = useTranslations("common");

  const installmentsThisMonth = installmentCommitments(queueItems)
    .flatMap((c) => c.payments)
    .filter((p) => p.month === monthOf(today))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <Page title={t("title")}>
      {profile && (
        <MoneyFlowSummary
          profile={profile}
          month={monthOf(today)}
          installmentsThisMonth={installmentsThisMonth}
        />
      )}
      <IncomeExpensesForm
        initial={profile ?? undefined}
        currency={currency}
        currentMonth={monthOf(today)}
        onSave={async (value) => {
          const saved = await putSingleton(
            db,
            "profile",
            ProfileSchema,
            mergeProfile(profile, value),
          );
          setProfile(saved);
          notify(tc("saved"));
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
          notifyUndo(tc("deletedItem", { name: item.name }), tc("undo"), () => {
            const current = useAppStore.getState();
            current.setQueueItems([...current.queueItems, item]);
            void saveQueueItem(db, item).catch((error: unknown) =>
              console.error("Could not restore the installment purchase", error),
            );
          });
        }}
      />
    </Page>
  );
}
