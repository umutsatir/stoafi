"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  emergencyFundMonths,
  hourlyNetIncome,
  monthlyNeeds,
  netMonthlyIncome,
  type Month,
  type Profile,
} from "@stoafi/core";
import { Money } from "@/components/ui/money";
import { Card } from "@/components/ui/card";
import { stagger } from "@/lib/utils";

export interface ProfileOverviewProps {
  profile: Profile;
  month: Month;
}

/** Who you are, in money: what comes in, what an hour of your life is worth, how safe you are. */
export function ProfileOverview({ profile, month }: ProfileOverviewProps) {
  const t = useTranslations("profile.overview");
  const income = netMonthlyIncome(profile);
  const hour = hourlyNetIncome(profile);
  const needs = monthlyNeeds(profile, month);
  const months = emergencyFundMonths(profile.savings, needs);
  const target = Math.max(profile.emergencyFundTargetMonths, 0.01);

  const fundPct = Math.min(1, months / target);
  const circumference = 2 * Math.PI * 42;
  const tile = "pop-in px-[26px] py-[22px]";
  return (
    <section
      aria-label={t("title")}
      data-testid="profile-overview"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Card className={tile} style={stagger(1)}>
        <p className="text-[13px] font-bold text-muted-foreground">{t("income")}</p>
        <p
          className="mt-1 text-[30px] font-extrabold tracking-[-0.05em]"
          data-testid="overview-income"
        >
          <Money value={income} animated />
        </p>
      </Card>
      <Card className={tile} style={stagger(2)}>
        <p className="text-[13px] font-bold text-muted-foreground">{t("needsTitle")}</p>
        <p className="mt-1 text-[30px] font-extrabold tracking-[-0.05em]">
          <Money value={needs} />
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t("needsHint")}</p>
      </Card>
      <Card className={tile} style={stagger(3)}>
        <p className="text-[13px] font-bold text-muted-foreground">{t("hour")}</p>
        <p
          className="mt-1 text-[30px] font-extrabold tracking-[-0.05em]"
          data-testid="overview-hour"
        >
          <Money value={hour} />
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t("hourHint")}</p>
      </Card>
      <Card
        className={`${tile} flex items-center gap-4 text-on ${
          fundPct >= 1 ? "bg-c4" : fundPct >= 0.5 ? "bg-c2" : "bg-c3"
        }`}
        style={stagger(4)}
      >
        <div
          role="progressbar"
          aria-label={t("fundRing")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fundPct * 100)}
          className="relative h-[74px] w-[74px] flex-none"
        >
          <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              className="opacity-20"
              strokeWidth="12"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--on)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - fundPct)}
              className="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold">
            {Math.round(fundPct * 100)}%
          </span>
        </div>
        <div>
          <p className="text-[13px] font-bold">{t("fund")}</p>
          <p className="text-[22px] font-extrabold tracking-[-0.04em]" data-testid="overview-fund">
            {t("fundMonths", {
              months: months.toFixed(1),
              target: profile.emergencyFundTargetMonths,
            })}
          </p>
          <Link href="/sinking-funds" className="text-xs font-extrabold underline">
            {t("addMoney")}
          </Link>
        </div>
      </Card>
    </section>
  );
}
