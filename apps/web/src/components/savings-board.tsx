"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PiggyBank, Plus } from "lucide-react";
import {
  depositedInMonth,
  emergencyGap,
  monthlySavingsAdvice,
  requiredThisMonth,
  sinkingFundStatus,
  type Deposit,
  type Month,
  type Profile,
  type SinkingFund,
} from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DepositForm } from "./deposit-form";
import { PotCard, type PotView } from "./pot-card";
import { PotHistory } from "./pot-history";
import { SavingsSummary } from "./savings-summary";
import { SinkingFundForm } from "./sinking-fund-form";

export interface SavingsBoardProps {
  funds: SinkingFund[];
  profile: Profile;
  month: Month;
  today: string;
  currency: string;
  /** Money left this month before any saving, and what the plan suggests setting aside. */
  freeBeforeSaving: number;
  planSavings: number;
  monthlyNeeds: number;
  createId: () => string;
  onDeposit: (potId: string, deposit: Deposit) => boolean;
  onDeleteDeposit: (potId: string, depositId: string) => void;
  onSaveFund: (fund: SinkingFund) => void;
  onDeleteFund: (fund: SinkingFund) => void;
}

const QUICK = [10_000, 50_000, 100_000, 500_000];

export function SavingsBoard(props: SavingsBoardProps) {
  const { funds, profile, month, today, currency, createId } = props;
  const t = useTranslations("savings");
  const [depositTo, setDepositTo] = useState<string | null>(null);
  const [historyOf, setHistoryOf] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [drops, setDrops] = useState<Record<string, number>>({});

  const gap = emergencyGap(profile.savings, props.monthlyNeeds, profile.emergencyFundTargetMonths);
  const emergencyDeposited = depositedInMonth(profile.deposits, month);
  const advice = monthlySavingsAdvice({
    freeBeforeSaving: props.freeBeforeSaving,
    planSavings: props.planSavings,
    funds,
    emergency: { gap, depositedThisMonth: emergencyDeposited },
    month,
  });

  const emergencyTarget = Math.round(props.monthlyNeeds * profile.emergencyFundTargetMonths);
  const pots: PotView[] = [
    {
      id: "emergency",
      kind: "emergency",
      label: t("emergency"),
      balance: profile.savings,
      target: emergencyTarget,
      deposits: profile.deposits ?? [],
      neededThisMonth: 0,
      depositedThisMonth: emergencyDeposited,
      state: profile.savings >= emergencyTarget && emergencyTarget > 0 ? "funded" : "open",
    },
    ...funds.map((fund): PotView => {
      const status = sinkingFundStatus(fund, month);
      return {
        id: fund.id,
        kind: "goal",
        label: fund.label,
        balance: fund.currentBalance,
        target: fund.target,
        dueMonth: fund.dueMonth,
        ...(fund.icon ? { icon: fund.icon } : {}),
        deposits: fund.deposits ?? [],
        neededThisMonth: requiredThisMonth(fund, month),
        depositedThisMonth: depositedInMonth(fund.deposits, month),
        state: status.state,
      };
    }),
  ];
  const depositPot = pots.find((p) => p.id === depositTo);
  const historyPot = pots.find((p) => p.id === historyOf);
  const editingFund = funds.find((f) => f.id === editing);
  const potNames = Object.fromEntries(pots.map((p) => [p.id, p.label]));

  return (
    <div className="flex flex-col gap-8">
      <SavingsSummary
        advice={advice}
        freeBeforeSaving={props.freeBeforeSaving}
        potNames={potNames}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("potsTitle")}</h2>
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("addPot")}
        </Button>
      </div>

      <ul className="grid gap-4 lg:grid-cols-2">
        {pots.map((pot, index) => (
          <PotCard
            key={pot.id}
            pot={pot}
            index={index}
            dropKey={drops[pot.id] ?? 0}
            onDeposit={(p) => setDepositTo(p.id)}
            onHistory={(p) => setHistoryOf(p.id)}
          />
        ))}
      </ul>
      {funds.length === 0 && (
        <EmptyState
          icon={<PiggyBank className="h-8 w-8" />}
          title={t("noGoals.title")}
          description={t("noGoals.text")}
          action={
            <Button type="button" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("addPot")}
            </Button>
          }
        />
      )}

      <Sheet open={depositPot !== undefined} onOpenChange={(open) => !open && setDepositTo(null)}>
        {depositPot && (
          <SheetContent title={t("deposit.title", { name: depositPot.label })}>
            <DepositForm
              today={today}
              currency={currency}
              quickAmounts={
                depositPot.neededThisMonth > depositPot.depositedThisMonth
                  ? [depositPot.neededThisMonth - depositPot.depositedThisMonth, ...QUICK]
                  : QUICK
              }
              balance={depositPot.balance}
              createId={createId}
              onCancel={() => setDepositTo(null)}
              onSubmit={(deposit) => {
                if (props.onDeposit(depositPot.id, deposit)) {
                  if (deposit.amount > 0) {
                    setDrops((d) => ({ ...d, [depositPot.id]: (d[depositPot.id] ?? 0) + 1 }));
                  }
                  setDepositTo(null);
                }
              }}
            />
          </SheetContent>
        )}
      </Sheet>

      <Sheet open={historyPot !== undefined} onOpenChange={(open) => !open && setHistoryOf(null)}>
        {historyPot && (
          <SheetContent title={t("history.title", { name: historyPot.label })}>
            <PotHistory
              pot={historyPot}
              onDelete={(id) => props.onDeleteDeposit(historyPot.id, id)}
            />
            {historyPot.kind === "goal" && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(historyPot.id);
                    setHistoryOf(null);
                  }}
                >
                  {t("editPot")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={t("deletePot", { name: historyPot.label })}
                  onClick={() => {
                    const fund = funds.find((f) => f.id === historyPot.id);
                    if (fund) props.onDeleteFund(fund);
                    setHistoryOf(null);
                  }}
                >
                  {t("deletePotShort")}
                </Button>
              </div>
            )}
          </SheetContent>
        )}
      </Sheet>

      <Sheet
        open={adding || editingFund !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setAdding(false);
            setEditing(null);
          }
        }}
      >
        {(adding || editingFund) && (
          <SheetContent title={editingFund ? t("editPot") : t("addPot")}>
            <SinkingFundForm
              bare
              key={editingFund?.id ?? "new"}
              {...(editingFund ? { initial: editingFund } : {})}
              currency={currency}
              currentMonth={month}
              createId={createId}
              onSubmit={(fund) => {
                props.onSaveFund(fund);
                setAdding(false);
                setEditing(null);
              }}
              onCancel={() => {
                setAdding(false);
                setEditing(null);
              }}
            />
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
