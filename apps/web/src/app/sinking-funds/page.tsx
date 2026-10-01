"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ProfileSchema,
  addDeposit,
  addEmergencyDeposit,
  currentAllocation,
  monthlyNeeds,
  project,
  removeDeposit,
  removeEmergencyDeposit,
  strategyRegistry,
  type Deposit,
  type SinkingFund,
} from "@stoafi/core";
import { LessonLink } from "@/components/lesson-link";
import { SavingsBoard } from "@/components/savings-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/ui/page";
import { notify, notifyError, notifyUndo } from "@/components/ui/toaster";
import { monthOf } from "@/lib/clock";
import { db } from "@/storage/instance";
import { putSingleton } from "@/storage/repo";
import { removeSinkingFund, saveSinkingFund } from "@/storage/sinking-repo";
import { useAppStore, useLedger } from "@/store";

function logFailure(what: string) {
  return (error: unknown) => console.error(`Could not ${what}`, error);
}

export default function SavingsPage() {
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const planState = useAppStore((s) => s.planState);
  const funds = useAppStore((s) => s.sinkingFunds);
  const setFunds = useAppStore((s) => s.setSinkingFunds);
  const currency = useAppStore((s) => s.currency);
  const today = useAppStore((s) => s.today);
  const ledger = useLedger();
  const t = useTranslations("savings");
  const tc = useTranslations("common");

  if (!profile) {
    return (
      <Page title={t("title")}>
        <Card>
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <p className="text-sm text-muted-foreground">{t("needProfile")}</p>
            <Button asChild>
              <Link href="/income-expenses">{t("goToIncome")}</Link>
            </Button>
            <LessonLink lessonId="sinking-funds" testId="lesson-link-sinking-funds" />
          </CardContent>
        </Card>
      </Page>
    );
  }

  const month = monthOf(today);
  const income = profile.incomes.reduce((sum, i) => sum + i.monthly, 0);
  const limits = planState ? currentAllocation(profile, planState, strategyRegistry) : null;
  const projection = project({ income }, ledger, month, limits ? { bucketLimits: limits } : {});
  const freeBeforeSaving = Math.max(
    0,
    income - projection.byBucket.needs.committed - projection.byBucket.wants.committed,
  );
  const planSavings = limits ? limits.savings + limits.investing : 0;

  function replaceFund(next: SinkingFund) {
    setFunds(funds.map((f) => (f.id === next.id ? next : f)));
    void saveSinkingFund(db, next).catch(logFailure("save the savings goal"));
  }

  function persistProfile(next: typeof profile) {
    if (!next) return;
    setProfile(next);
    void putSingleton(db, "profile", ProfileSchema, next).catch(logFailure("save the profile"));
  }

  function handleDeposit(potId: string, deposit: Deposit): boolean {
    if (!profile) return false;
    if (potId === "emergency") {
      const result = addEmergencyDeposit(profile, deposit);
      if (!result.ok) return (notifyError(t("deposit.failed")), false);
      persistProfile(result.profile);
    } else {
      const fund = funds.find((f) => f.id === potId);
      if (!fund) return false;
      const result = addDeposit({ balance: fund.currentBalance, deposits: fund.deposits }, deposit);
      if (!result.ok) return (notifyError(t("deposit.failed")), false);
      replaceFund({ ...fund, currentBalance: result.balance, deposits: result.deposits });
    }
    notify(deposit.amount > 0 ? t("deposit.added") : t("deposit.taken"));
    return true;
  }

  function handleDeleteDeposit(potId: string, depositId: string) {
    if (!profile) return;
    if (potId === "emergency") {
      const deposit = profile.deposits?.find((d) => d.id === depositId);
      const result = removeEmergencyDeposit(profile, depositId);
      if (!result.ok || !deposit) return notifyError(t("deposit.failed"));
      persistProfile(result.profile);
      notifyUndo(t("deposit.removed"), tc("undo"), () => {
        const current = useAppStore.getState().profile;
        if (!current) return;
        const back = addEmergencyDeposit(current, deposit);
        if (back.ok) persistProfile(back.profile);
      });
      return;
    }
    const fund = funds.find((f) => f.id === potId);
    const deposit = fund?.deposits?.find((d) => d.id === depositId);
    if (!fund || !deposit) return;
    const result = removeDeposit(
      { balance: fund.currentBalance, deposits: fund.deposits },
      depositId,
    );
    if (!result.ok) return notifyError(t("deposit.failed"));
    replaceFund({ ...fund, currentBalance: result.balance, deposits: result.deposits });
    notifyUndo(t("deposit.removed"), tc("undo"), () => {
      const latest = useAppStore.getState().sinkingFunds.find((f) => f.id === potId);
      if (!latest) return;
      const back = addDeposit(
        { balance: latest.currentBalance, deposits: latest.deposits },
        deposit,
      );
      if (back.ok)
        replaceFund({ ...latest, currentBalance: back.balance, deposits: back.deposits });
    });
  }

  function handleSaveFund(fund: SinkingFund) {
    const exists = funds.some((f) => f.id === fund.id);
    setFunds(exists ? funds.map((f) => (f.id === fund.id ? fund : f)) : [...funds, fund]);
    void saveSinkingFund(db, fund).catch(logFailure("save the savings goal"));
    notify(tc("saved"));
  }

  function handleDeleteFund(fund: SinkingFund) {
    setFunds(funds.filter((f) => f.id !== fund.id));
    void removeSinkingFund(db, fund.id).catch(logFailure("delete the savings goal"));
    notifyUndo(tc("deletedItem", { name: fund.label }), tc("undo"), () => {
      const current = useAppStore.getState();
      current.setSinkingFunds([...current.sinkingFunds, fund]);
      void saveSinkingFund(db, fund).catch(logFailure("restore the savings goal"));
    });
  }

  return (
    <Page title={t("title")}>
      <p className="max-w-prose text-sm text-muted-foreground">{t("intro")}</p>
      <SavingsBoard
        funds={funds}
        profile={profile}
        month={month}
        today={today}
        currency={currency}
        freeBeforeSaving={freeBeforeSaving}
        planSavings={planSavings}
        monthlyNeeds={monthlyNeeds(profile, month)}
        createId={() => crypto.randomUUID()}
        onDeposit={handleDeposit}
        onDeleteDeposit={handleDeleteDeposit}
        onSaveFund={handleSaveFund}
        onDeleteFund={handleDeleteFund}
      />
      <div>
        <LessonLink lessonId="sinking-funds" testId="lesson-link-sinking-funds" />
      </div>
    </Page>
  );
}
