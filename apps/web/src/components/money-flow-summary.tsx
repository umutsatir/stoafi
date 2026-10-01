"use client";

import { useTranslations } from "next-intl";
import { activeFixedExpenses, netMonthlyIncome, type Month, type Profile } from "@stoafi/core";
import { Money } from "@/components/ui/money";
import { StatCard } from "@/components/ui/stat-card";
import { stagger } from "@/lib/utils";

export interface MoneyFlowSummaryProps {
  profile: Profile;
  month: Month;
  /** What installment purchases cost this month. */
  installmentsThisMonth: number;
}

/** Money in, money out every month, and what is left: the three numbers the form below adds up to. */
export function MoneyFlowSummary({ profile, month, installmentsThisMonth }: MoneyFlowSummaryProps) {
  const t = useTranslations("incomeExpenses.summary");
  const income = netMonthlyIncome(profile);
  const fixed = activeFixedExpenses(profile, month).reduce((sum, e) => sum + e.monthly, 0);
  const out = fixed + profile.livingExpenses + installmentsThisMonth;
  const left = income - out;
  const items = [
    { key: "in", value: income, hint: t("inHint") },
    { key: "out", value: out, hint: t("outHint") },
    { key: "left", value: Math.abs(left), hint: left < 0 ? t("leftNegative") : t("leftHint") },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3" data-testid="money-flow-summary">
      {items.map((item, i) => (
        <StatCard
          key={item.key}
          className="rise-in"
          style={stagger(i)}
          label={t(item.key)}
          value={
            <span className={item.key === "left" && left < 0 ? "text-destructive" : undefined}>
              {item.key === "left" && left < 0 ? "−" : ""}
              <Money value={item.value} animated />
            </span>
          }
          hint={item.hint}
          testId={`flow-${item.key}`}
        />
      ))}
    </div>
  );
}
