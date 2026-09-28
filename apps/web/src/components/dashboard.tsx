"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  activeQueueItems,
  currentAllocation,
  emergencyFundMonths,
  installmentCommitments,
  monthlyNeeds,
  netMonthlyIncome,
  project,
  scheduleQueue,
  strategyRegistry,
  type PlanStateInput,
  type Profile,
  type QueueItem,
} from "@stoafi/core";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { monthOf } from "@/lib/clock";
import { useMoney } from "@/lib/use-money";

export interface DashboardProps {
  profile: Profile | null;
  planState: PlanStateInput | null;
  queueItems: QueueItem[];
  /** Local date (YYYY-MM-DD) from the app boundary. */
  today: string;
  /** How many upcoming queue items to list. */
  nextCount?: number;
}

export function Dashboard({
  profile,
  planState,
  queueItems,
  today,
  nextCount = 3,
}: DashboardProps) {
  const t = useTranslations("home");
  const tTimeline = useTranslations("timeline");
  const locale = useLocale() as Locale;
  const money = useMoney();

  if (!profile) {
    return (
      <main>
        <h1>{t("title")}</h1>
        <p>{t("welcome")}</p>
        <Link href="/profile">{t("setUpProfile")}</Link>
      </main>
    );
  }

  const month = monthOf(today);
  const income = netMonthlyIncome(profile);
  const obligations = profile.fixedExpenses.reduce((sum, e) => sum + e.monthly, 0);
  const commitments = installmentCommitments(queueItems);
  const installments = project({ income }, commitments, month).installmentLoad;
  const left = income - obligations - profile.livingExpenses - installments;

  const needs = monthlyNeeds(profile);
  const savedMonths = emergencyFundMonths(profile.savings, needs);
  const fundLow = savedMonths < profile.emergencyFundTargetMonths;
  const overspent = left < 0;

  const strategy = planState ? strategyRegistry[planState.strategyId] : undefined;
  const waiting = activeQueueItems(queueItems);
  // Without a known plan there are no bucket limits to schedule against.
  const schedule =
    planState && strategy
      ? scheduleQueue(waiting, profile, planState, commitments, today, month)
      : [];
  const monthByItem = new Map(schedule.map((s) => [s.itemId, s.month]));
  const next = waiting.slice(0, nextCount);

  const allocation =
    planState && strategy ? currentAllocation(profile, planState, strategyRegistry) : null;
  const planTitle = strategy
    ? (getLessonCard(strategy.lessonId, locale)?.title ?? strategy.id)
    : null;

  return (
    <main>
      <h1>{t("title")}</h1>

      {(overspent || fundLow) && (
        <div role="alert">
          {overspent && <p>{t("overspent")}</p>}
          {fundLow && <p>{t("fundLow")}</p>}
        </div>
      )}

      <section aria-label={t("thisMonth")} data-testid="this-month">
        <h2>{t("thisMonth")}</h2>
        <dl>
          <dt>{t("income")}</dt>
          <dd data-testid="income">{money(income)}</dd>
          <dt>{t("obligations")}</dt>
          <dd data-testid="obligations">{money(obligations)}</dd>
          <dt>{t("living")}</dt>
          <dd data-testid="living">{money(profile.livingExpenses)}</dd>
          <dt>{t("installments")}</dt>
          <dd data-testid="installments">{money(installments)}</dd>
          <dt>{t("left")}</dt>
          <dd data-testid="left">{money(left)}</dd>
        </dl>
      </section>

      <section aria-label={t("emergencyFund")}>
        <h2>{t("emergencyFund")}</h2>
        <p data-testid="emergency-fund">
          {t("emergencyFundLine", {
            saved: savedMonths.toFixed(1),
            target: profile.emergencyFundTargetMonths,
          })}
        </p>
      </section>

      {planTitle && allocation && (
        <section aria-label={t("activePlan")} data-testid="active-plan">
          <h2>{t("activePlan")}</h2>
          <p>{planTitle}</p>
          <dl>
            <dt>{t("needs")}</dt>
            <dd data-testid="plan-needs">{money(allocation.needs)}</dd>
            <dt>{t("wants")}</dt>
            <dd data-testid="plan-wants">{money(allocation.wants)}</dd>
            <dt>{t("savings")}</dt>
            <dd data-testid="plan-savings">{money(allocation.savings)}</dd>
            <dt>{t("investing")}</dt>
            <dd data-testid="plan-investing">{money(allocation.investing)}</dd>
          </dl>
          <Link href="/plan">{t("changePlan")}</Link>
        </section>
      )}

      <section aria-label={t("nextInQueue")}>
        <h2>{t("nextInQueue")}</h2>
        {next.length === 0 ? (
          <Link href="/queue">{t("addToQueue")}</Link>
        ) : (
          <>
            <ul data-testid="next-items">
              {next.map((item) => {
                const scheduled = monthByItem.get(item.id);
                return (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <span data-testid={`next-month-${item.id}`}>
                      {scheduled ?? tTimeline("notAffordableYet")}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Link href="/queue">{t("openQueue")}</Link>
          </>
        )}
      </section>
    </main>
  );
}
