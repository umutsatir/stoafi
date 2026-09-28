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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Page } from "@/components/ui/page";

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
      <Page title={t("title")}>
        <Card>
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <p className="text-sm text-muted-foreground">{t("welcome")}</p>
            <Button asChild>
              <Link href="/profile">{t("setUpProfile")}</Link>
            </Button>
          </CardContent>
        </Card>
      </Page>
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
    <Page title={t("title")}>
      {(overspent || fundLow) && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm font-medium text-destructive"
        >
          {overspent && <p>{t("overspent")}</p>}
          {fundLow && <p>{t("fundLow")}</p>}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card aria-label={t("thisMonth")} data-testid="this-month">
          <CardHeader>
            <CardTitle className="text-base">{t("thisMonth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">{t("income")}</dt>
              <dd data-testid="income" className="text-right font-medium">
                {money(income)}
              </dd>
              <dt className="text-muted-foreground">{t("obligations")}</dt>
              <dd data-testid="obligations" className="text-right font-medium">
                {money(obligations)}
              </dd>
              <dt className="text-muted-foreground">{t("living")}</dt>
              <dd data-testid="living" className="text-right font-medium">
                {money(profile.livingExpenses)}
              </dd>
              <dt className="text-muted-foreground">{t("installments")}</dt>
              <dd data-testid="installments" className="text-right font-medium">
                {money(installments)}
              </dd>
              <dt className="border-t border-border pt-2 font-medium">{t("left")}</dt>
              <dd
                data-testid="left"
                className={cn(
                  "border-t border-border pt-2 text-right text-lg font-semibold",
                  overspent && "text-destructive",
                )}
              >
                {money(left)}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card aria-label={t("emergencyFund")}>
          <CardHeader>
            <CardTitle className="text-base">{t("emergencyFund")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p data-testid="emergency-fund" className="text-sm">
              {t("emergencyFundLine", {
                saved: savedMonths.toFixed(1),
                target: profile.emergencyFundTargetMonths,
              })}
            </p>
          </CardContent>
        </Card>

        {planTitle && allocation && (
          <Card aria-label={t("activePlan")} data-testid="active-plan">
            <CardHeader>
              <CardTitle className="text-base">{t("activePlan")}</CardTitle>
              <CardDescription>{planTitle}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">{t("needs")}</dt>
                <dd data-testid="plan-needs" className="text-right font-medium">
                  {money(allocation.needs)}
                </dd>
                <dt className="text-muted-foreground">{t("wants")}</dt>
                <dd data-testid="plan-wants" className="text-right font-medium">
                  {money(allocation.wants)}
                </dd>
                <dt className="text-muted-foreground">{t("savings")}</dt>
                <dd data-testid="plan-savings" className="text-right font-medium">
                  {money(allocation.savings)}
                </dd>
                <dt className="text-muted-foreground">{t("investing")}</dt>
                <dd data-testid="plan-investing" className="text-right font-medium">
                  {money(allocation.investing)}
                </dd>
              </dl>
              <Link href="/plan" className="text-sm font-medium text-primary hover:underline">
                {t("changePlan")}
              </Link>
            </CardContent>
          </Card>
        )}

        <Card aria-label={t("nextInQueue")}>
          <CardHeader>
            <CardTitle className="text-base">{t("nextInQueue")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {next.length === 0 ? (
              <Link href="/queue" className="text-sm font-medium text-primary hover:underline">
                {t("addToQueue")}
              </Link>
            ) : (
              <>
                <ul data-testid="next-items" className="flex flex-col divide-y divide-border">
                  {next.map((item) => {
                    const scheduled = monthByItem.get(item.id);
                    return (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 py-2 text-sm"
                      >
                        <span className="font-medium">{item.name}</span>
                        <Badge
                          variant={scheduled ? "secondary" : "destructive"}
                          data-testid={`next-month-${item.id}`}
                        >
                          {scheduled ?? tTimeline("notAffordableYet")}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
                <Link href="/queue" className="text-sm font-medium text-primary hover:underline">
                  {t("openQueue")}
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
