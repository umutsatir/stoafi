"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  HeartPulse,
  ListChecks,
  PiggyBank,
} from "lucide-react";
import {
  activeFixedExpenses,
  activeQueueItems,
  addMonths,
  cashFlowSeries,
  currentAllocation,
  depositedInMonth,
  emergencyFundMonths,
  emergencyGap,
  healthSummary,
  installmentCommitments,
  monthlyNeeds,
  monthlySavingsAdvice,
  netMonthlyIncome,
  project,
  scheduleQueue,
  sinkingFundCommitments,
  strategyRegistry,
  upcomingEvents,
  type Card as PaymentCard,
  type PlanStateInput,
  type Profile,
  type QueueItem,
  type SinkingFund,
} from "@stoafi/core";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { monthOf } from "@/lib/clock";
import { dayRulesFor } from "@/lib/day-rules";
import { formatMonth } from "@/lib/format-month";
import { buildLedger } from "@/store/ledger";
import { useMoney } from "@/lib/use-money";
import { cn, stagger } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { Page } from "@/components/ui/page";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusChip } from "@/components/ui/status-chip";
import { CashFlowChart } from "./cash-flow-chart";

export interface DashboardProps {
  profile: Profile | null;
  planState: PlanStateInput | null;
  queueItems: QueueItem[];
  sinkingFunds?: SinkingFund[];
  cards?: PaymentCard[];
  /** The installment cap as a share of income (a setting); used for the health summary. */
  installmentCapPct?: number;
  /** Local date (YYYY-MM-DD) from the app boundary. */
  today: string;
  /** How many upcoming queue items to list. */
  nextCount?: number;
  /** Shown instead of the empty welcome when nothing is set up yet (the first-run wizard). */
  onboarding?: React.ReactNode;
  /** Shown above everything, e.g. the sample-data banner. */
  banner?: React.ReactNode;
}

const EVENT_ICON = { income: ArrowDownLeft, expense: ArrowUpRight, card: CreditCard } as const;

function Panel({
  title,
  icon: Icon,
  href,
  hrefLabel,
  index,
  testId,
  children,
}: {
  title: string;
  icon: typeof PiggyBank;
  href?: string;
  hrefLabel?: string;
  index: number;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      aria-label={title}
      data-testid={testId}
      className="rise-in flex flex-col"
      style={stagger(index)}
    >
      <CardContent className="flex h-full flex-col gap-3 pt-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          {title}
        </h2>
        {children}
        {href && hrefLabel && (
          <Link href={href} className="mt-auto text-sm font-medium text-primary hover:underline">
            {hrefLabel}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function Dashboard({
  profile,
  planState,
  queueItems,
  sinkingFunds = [],
  cards = [],
  installmentCapPct = 0.2,
  today,
  nextCount = 3,
  onboarding,
  banner,
}: DashboardProps) {
  const t = useTranslations("home");
  const tTimeline = useTranslations("timeline");
  const locale = useLocale() as Locale;
  const money = useMoney();

  if (!profile) {
    return (
      <Page title={t("title")}>
        {onboarding}
        <Card>
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <p className="text-sm text-muted-foreground">{t("welcome")}</p>
            <Button asChild variant={onboarding ? "outline" : "default"}>
              <Link href="/income-expenses">{t("setUpProfile")}</Link>
            </Button>
          </CardContent>
        </Card>
      </Page>
    );
  }

  const month = monthOf(today);
  const income = netMonthlyIncome(profile);
  const obligations = activeFixedExpenses(profile, month).reduce((sum, e) => sum + e.monthly, 0);
  const installmentLedger = installmentCommitments(queueItems);
  const ledger = buildLedger(profile, queueItems, month, sinkingFunds);
  const strategy = planState ? strategyRegistry[planState.strategyId] : undefined;
  const allocation =
    planState && strategy ? currentAllocation(profile, planState, strategyRegistry) : null;
  const thisMonth = project(
    { income },
    ledger,
    month,
    allocation ? { bucketLimits: allocation } : {},
  );
  const installments = thisMonth.installmentLoad;
  const left = thisMonth.freeCash;

  const cashFlow = cashFlowSeries(
    profile,
    [...installmentLedger, ...sinkingFundCommitments(sinkingFunds, month)],
    Array.from({ length: 12 }, (_, i) => addMonths(month, i)),
  );
  const needs = monthlyNeeds(profile, month);
  const savedMonths = emergencyFundMonths(profile.savings, needs);
  const fundLow = savedMonths < profile.emergencyFundTargetMonths;
  const overspent = left < 0;

  const waiting = activeQueueItems(queueItems);
  // Without a known plan there are no bucket limits to schedule against.
  const schedule =
    planState && strategy ? scheduleQueue(waiting, profile, planState, ledger, today, month) : [];
  const monthByItem = new Map(schedule.map((s) => [s.itemId, s.month]));
  const next = waiting.slice(0, nextCount);
  const planTitle = strategy
    ? (getLessonCard(strategy.lessonId, locale)?.title ?? strategy.id)
    : null;

  // How far into the month we are, for the ring in the hero card.
  const dayOfMonth = Number(today.slice(8, 10));
  const daysInMonth = new Date(
    Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0),
  ).getUTCDate();

  const rules = dayRulesFor(profile, cards);
  const events = upcomingEvents(rules, today, 14).slice(0, 6);
  const dayFormat = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  const depositedThisMonth =
    depositedInMonth(profile.deposits, month) +
    sinkingFunds.reduce((sum, f) => sum + depositedInMonth(f.deposits, month), 0);
  const freeBeforeSaving = Math.max(
    0,
    income - thisMonth.byBucket.needs.committed - thisMonth.byBucket.wants.committed,
  );
  const advice = monthlySavingsAdvice({
    freeBeforeSaving,
    planSavings: allocation ? allocation.savings + allocation.investing : 0,
    funds: sinkingFunds,
    emergency: {
      gap: emergencyGap(profile.savings, needs, profile.emergencyFundTargetMonths),
      depositedThisMonth: depositedInMonth(profile.deposits, month),
    },
    month,
  });
  const health = healthSummary({
    projection: thisMonth,
    savingsBalance: profile.savings,
    monthlyNeeds: needs,
    depositedThisMonth,
    emergencyFundTargetMonths: profile.emergencyFundTargetMonths,
    installmentCapPct,
  });

  return (
    <Page title={t("title")}>
      {banner}
      <p className="-mt-3 text-sm text-muted-foreground">
        {t("greeting", { month: formatMonth(month, locale) })}
      </p>

      {(overspent || fundLow) && (
        <div
          role="alert"
          className="rise-in flex flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm font-medium text-destructive"
        >
          {overspent && (
            <p className="flex flex-wrap items-center gap-3">
              {t("overspent")}
              <Link href="/income-expenses" className="underline">
                {t("overspentAction")}
              </Link>
            </p>
          )}
          {fundLow && (
            <p className="flex flex-wrap items-center gap-3">
              {t("fundLow")}
              <Link href="/sinking-funds" className="underline">
                {t("fundLowAction")}
              </Link>
            </p>
          )}
        </div>
      )}

      <section
        aria-label={t("thisMonth")}
        data-testid="this-month"
        className="rise-in flex flex-wrap items-center gap-6 rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-6 shadow-sm"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{t("left")}</p>
          <p
            data-testid="left"
            className={cn(
              "text-hero font-semibold tracking-tight",
              overspent && "text-destructive",
            )}
          >
            <Money value={left} animated />
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <div className="flex gap-1.5">
              <dt>{t("income")}</dt>
              <dd data-testid="income" className="font-medium text-foreground">
                {money(income)}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt>{t("obligations")}</dt>
              <dd data-testid="obligations" className="font-medium text-foreground">
                {money(obligations)}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt>{t("living")}</dt>
              <dd data-testid="living" className="font-medium text-foreground">
                {money(profile.livingExpenses)}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt>{t("installments")}</dt>
              <dd data-testid="installments" className="font-medium text-foreground">
                {money(installments)}
              </dd>
            </div>
          </dl>
        </div>
        <ProgressRing value={dayOfMonth} max={daysInMonth} label={t("monthProgress")} size={88}>
          {dayOfMonth}/{daysInMonth}
        </ProgressRing>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          title={t("upcoming")}
          icon={CalendarClock}
          index={1}
          testId="upcoming"
          href="/calendar"
          hrefLabel={t("openCalendar")}
        >
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("upcomingNone")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {events.map((event) => {
                const Icon = EVENT_ICON[event.kind];
                return (
                  <li
                    key={`${event.id}-${event.date}`}
                    data-testid={`event-${event.id}`}
                    className="flex items-center gap-3 py-2 text-sm"
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        event.kind === "income" ? "text-success" : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{event.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {event.daysAway === 0
                        ? t("today")
                        : event.daysAway === 1
                          ? t("tomorrow")
                          : dayFormat.format(new Date(`${event.date}T00:00:00Z`))}
                    </span>
                    {event.amount !== undefined && (
                      <span
                        className={cn("w-24 text-right", event.kind === "income" && "text-success")}
                      >
                        {event.kind === "income" ? "+" : "−"}
                        {money(event.amount)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title={t("savingTitle")}
          icon={PiggyBank}
          index={2}
          testId="saving-widget"
          href="/sinking-funds"
          hrefLabel={t("openSavings")}
        >
          <ProgressBar
            value={advice.deposited}
            max={Math.max(advice.required, 1)}
            label={t("savingBar")}
            tone={advice.stillToSet === 0 ? "success" : "primary"}
          />
          <p className="text-sm" data-testid="saving-sentence">
            {advice.stillToSet > 0
              ? t("savingMore", { more: money(advice.stillToSet), added: money(advice.deposited) })
              : t("savingDone", { added: money(advice.deposited) })}
          </p>
        </Panel>

        <Panel
          title={t("emergencyFund")}
          icon={HeartPulse}
          index={3}
          href="/profile"
          hrefLabel={t("editTarget")}
        >
          <div className="flex items-center gap-4">
            <ProgressRing
              value={savedMonths}
              max={Math.max(profile.emergencyFundTargetMonths, 0.01)}
              label={t("fundRing")}
              tone={fundLow ? "warning" : "success"}
              size={72}
            >
              {Math.min(
                100,
                Math.round((savedMonths / Math.max(profile.emergencyFundTargetMonths, 0.01)) * 100),
              )}
              %
            </ProgressRing>
            <p data-testid="emergency-fund" className="text-sm">
              {t("emergencyFundLine", {
                saved: savedMonths.toFixed(1),
                target: profile.emergencyFundTargetMonths,
              })}
            </p>
          </div>
        </Panel>

        <Panel
          title={t("healthTitle")}
          icon={HeartPulse}
          index={4}
          href="/health"
          hrefLabel={t("openHealth")}
        >
          <p>
            <StatusChip
              tone={
                health.overall === "good"
                  ? "success"
                  : health.overall === "watch"
                    ? "warning"
                    : "danger"
              }
            >
              <span data-testid="home-health">{t(`health.${health.overall}`)}</span>
            </StatusChip>
          </p>
          <p className="text-sm text-muted-foreground">
            {health.steps[0] ? t(`healthWhy.${health.steps[0].id}`) : t("healthAllGood")}
          </p>
        </Panel>

        {planTitle && allocation && (
          <Panel
            title={t("activePlan")}
            icon={ListChecks}
            index={5}
            testId="active-plan"
            href="/plan"
            hrefLabel={t("changePlan")}
          >
            <p className="text-sm text-muted-foreground">{planTitle}</p>
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
          </Panel>
        )}

        <Panel title={t("nextInQueue")} icon={ListChecks} index={6}>
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
                      <StatusChip tone={scheduled ? "success" : "warning"}>
                        <span data-testid={`next-month-${item.id}`}>
                          {scheduled ?? tTimeline("notAffordableYet")}
                        </span>
                      </StatusChip>
                    </li>
                  );
                })}
              </ul>
              <Link
                href="/queue"
                className="mt-auto text-sm font-medium text-primary hover:underline"
              >
                {t("openQueue")}
              </Link>
            </>
          )}
        </Panel>
      </div>
      <CashFlowChart series={cashFlow} />
    </Page>
  );
}
