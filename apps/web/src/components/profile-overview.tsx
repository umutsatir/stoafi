"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Clock, PiggyBank, Wallet } from "lucide-react";
import {
  emergencyFundMonths,
  hourlyNetIncome,
  monthlyNeeds,
  netMonthlyIncome,
  type Month,
  type Profile,
} from "@stoafi/core";
import { Money } from "@/components/ui/money";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useMoney } from "@/lib/use-money";
import { stagger } from "@/lib/utils";

export interface ProfileOverviewProps {
  profile: Profile;
  month: Month;
}

/** Who you are, in money: what comes in, what an hour of your life is worth, how safe you are. */
export function ProfileOverview({ profile, month }: ProfileOverviewProps) {
  const t = useTranslations("profile.overview");
  const money = useMoney();
  const income = netMonthlyIncome(profile);
  const hour = hourlyNetIncome(profile);
  const needs = monthlyNeeds(profile, month);
  const months = emergencyFundMonths(profile.savings, needs);
  const target = Math.max(profile.emergencyFundTargetMonths, 0.01);

  return (
    <section
      aria-label={t("title")}
      data-testid="profile-overview"
      className="rise-in relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-6 shadow-sm"
    >
      <p className="text-sm text-muted-foreground">{t("title")}</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        <div className="rise-in flex items-start gap-3" style={stagger(1)}>
          <Wallet className="mt-1 h-6 w-6 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">{t("income")}</p>
            <p className="text-2xl font-semibold" data-testid="overview-income">
              <Money value={income} animated />
            </p>
            <p className="text-xs text-muted-foreground">{t("needs", { amount: money(needs) })}</p>
          </div>
        </div>
        <div className="rise-in flex items-start gap-3" style={stagger(2)}>
          <Clock className="mt-1 h-6 w-6 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">{t("hour")}</p>
            <p className="text-2xl font-semibold" data-testid="overview-hour">
              <Money value={hour} />
            </p>
            <p className="text-xs text-muted-foreground">{t("hourHint")}</p>
          </div>
        </div>
        <div className="rise-in flex items-center gap-3" style={stagger(3)}>
          <ProgressRing
            value={months}
            max={target}
            label={t("fundRing")}
            tone={months >= target ? "success" : months >= 3 ? "warning" : "danger"}
            size={72}
          >
            {Math.min(100, Math.round((months / target) * 100))}%
          </ProgressRing>
          <div>
            <p className="text-sm text-muted-foreground">{t("fund")}</p>
            <p className="text-lg font-semibold" data-testid="overview-fund">
              {t("fundMonths", {
                months: months.toFixed(1),
                target: profile.emergencyFundTargetMonths,
              })}
            </p>
            <Link
              href="/sinking-funds"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <PiggyBank className="h-3.5 w-3.5" aria-hidden="true" />
              {t("addMoney")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
