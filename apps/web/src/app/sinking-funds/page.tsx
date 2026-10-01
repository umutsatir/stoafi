"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ProfileSchema,
  addDeposit,
  addEmergencyDeposit,
  currentAllocation,
  depositedInMonth,
  monthlyNeeds,
  project,
  removeDeposit,
  removeEmergencyDeposit,
  strategyRegistry,
  type Deposit,
  type Holding,
  type SinkingFund,
} from "@stoafi/core";
import { InvestmentsBoard } from "@/components/investments-board";
import { LessonLink } from "@/components/lesson-link";
import { SavingsBoard } from "@/components/savings-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/ui/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notify, notifyError, notifyUndo } from "@/components/ui/toaster";
import { monthOf } from "@/lib/clock";
import { crossedMilestone } from "@/lib/savings-cheer";
import { useMoney } from "@/lib/use-money";
import { db } from "@/storage/instance";
import { putSingleton } from "@/storage/repo";
import { removeHolding, saveHolding } from "@/storage/holding-repo";
import { removeSinkingFund, saveSinkingFund } from "@/storage/sinking-repo";
import { useAppStore, useLedger } from "@/store";

function logFailure(what: string) {
  return (error: unknown) => console.error(`Could not ${what}`, error);
}

export default function SavingsPage() {
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const planState = useAppStore((s) => s.planState);
  const holdings = useAppStore((s) => s.holdings);
  const setHoldings = useAppStore((s) => s.setHoldings);
  const funds = useAppStore((s) => s.sinkingFunds);
  const setFunds = useAppStore((s) => s.setSinkingFunds);
  const currency = useAppStore((s) => s.currency);
  const basket = useAppStore((s) => s.basket);
  const setBasket = useAppStore((s) => s.setBasket);
  const today = useAppStore((s) => s.today);
  const ledger = useLedger();
  const [tab, setTab] = useState("pots");
  const quickAction = useAppStore((s) => s.quickAction);
  // The palette can ask for an action on either tab; show that tab so its board can pick the request up.
  useEffect(() => {
    if (quickAction === "addInvestment") setTab("investments");
    else if (quickAction === "addPot") setTab("pots");
  }, [quickAction]);
  const t = useTranslations("savings");
  const money = useMoney();
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
    let pot: { name: string; before: number; after: number; target: number };
    if (potId === "emergency") {
      const result = addEmergencyDeposit(profile, deposit);
      if (!result.ok) return (notifyError(t("deposit.failed")), false);
      pot = {
        name: t("emergency"),
        before: profile.savings,
        after: result.profile.savings,
        target: Math.round(monthlyNeeds(profile, month) * profile.emergencyFundTargetMonths),
      };
      persistProfile(result.profile);
    } else {
      const fund = funds.find((f) => f.id === potId);
      if (!fund) return false;
      const result = addDeposit({ balance: fund.currentBalance, deposits: fund.deposits }, deposit);
      if (!result.ok) return (notifyError(t("deposit.failed")), false);
      pot = {
        name: fund.label,
        before: fund.currentBalance,
        after: result.balance,
        target: fund.target,
      };
      replaceFund({ ...fund, currentBalance: result.balance, deposits: result.deposits });
    }
    if (deposit.amount <= 0) {
      notify(t("deposit.taken"));
      return true;
    }
    // Put-ins get an encouraging line: a milestone if one was crossed, otherwise what this month adds up to.
    const { name, before, after, target } = pot;
    const milestone = crossedMilestone(before, after, target);
    const totalThisMonth =
      depositedInMonth(profile.deposits, month) +
      funds.reduce((sum, f) => sum + depositedInMonth(f.deposits, month), 0) +
      deposit.amount;
    notify(
      milestone
        ? t(`cheer.m${milestone}`, { name })
        : target > 0
          ? t("cheer.default", {
              amount: money(deposit.amount),
              name,
              total: money(totalThisMonth),
            })
          : t("cheer.open", { amount: money(deposit.amount), name, balance: money(after) }),
    );
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

  function handleSaveHolding(holding: Holding) {
    const exists = holdings.some((h) => h.id === holding.id);
    setHoldings(
      exists ? holdings.map((h) => (h.id === holding.id ? holding : h)) : [...holdings, holding],
    );
    void saveHolding(db, holding).catch(logFailure("save the investment"));
    notify(tc("saved"));
  }

  function handleDeleteHolding(holding: Holding) {
    setHoldings(holdings.filter((h) => h.id !== holding.id));
    void removeHolding(db, holding.id).catch(logFailure("delete the investment"));
    notifyUndo(tc("deletedItem", { name: holding.label }), tc("undo"), () => {
      const current = useAppStore.getState();
      current.setHoldings([...current.holdings, holding]);
      void saveHolding(db, holding).catch(logFailure("restore the investment"));
    });
  }

  function handleAssign(holdingId: string, basketId: string | undefined) {
    const holding = holdings.find((h) => h.id === holdingId);
    if (!holding) return;
    const next: Holding = { ...holding };
    if (basketId) next.basketId = basketId;
    else delete next.basketId;
    handleSaveHolding(next);
  }

  function handleTradeRemoved(before: Holding) {
    notifyUndo(t("deposit.removed"), tc("undo"), () => {
      const current = useAppStore.getState();
      current.setHoldings(current.holdings.map((h) => (h.id === before.id ? before : h)));
      void saveHolding(db, before).catch(logFailure("restore the investment"));
    });
  }

  return (
    <Page title={t("title")}>
      <p className="max-w-prose text-sm text-muted-foreground">{t("intro")}</p>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pots">{t("tabs.pots")}</TabsTrigger>
          <TabsTrigger value="investments">{t("tabs.investments")}</TabsTrigger>
        </TabsList>
        <TabsContent value="pots">
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
        </TabsContent>
        <TabsContent value="investments">
          <InvestmentsBoard
            holdings={holdings}
            today={today}
            currency={currency}
            createId={() => crypto.randomUUID()}
            annualInflation={profile.annualInflationExpectation}
            basket={basket}
            suggestedMonthly={limits ? limits.investing : 0}
            onBasketChange={setBasket}
            onAssign={handleAssign}
            onSave={handleSaveHolding}
            onDelete={handleDeleteHolding}
            onTradeRemoved={handleTradeRemoved}
          />
        </TabsContent>
      </Tabs>
      <div>
        <LessonLink lessonId="sinking-funds" testId="lesson-link-sinking-funds" />
      </div>
    </Page>
  );
}
