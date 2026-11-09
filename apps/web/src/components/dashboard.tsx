"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  activeFixedExpenses,
  expenseKind,
  activeQueueItems,
  addMonths,
  cashFlowSeries,
  currentAllocation,
  depositedInMonth,
  emergencyFundMonths,
  emergencyGap,
  freeSpending,
  healthSummary,
  type HealthStatus,
  installmentCommitments,
  limitAdvice,
  limitStatuses,
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
import { Page } from "@/components/ui/page";
import { StatusChip } from "@/components/ui/status-chip";
import { MonthBars } from "./month-bars";
import { OrbitRing, type OrbitSegment } from "./orbit-ring";
import { InstallmentRoom } from "./installment-room";

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

/** Where each kind of advice sends the user to act on it. */
const ADVICE_HREF = {
  needsOver: "/income-expenses",
  wantsOver: "/income-expenses",
  wantsRoom: "/queue",
  wantsSpare: "/queue",
  savingsToSet: "/sinking-funds",
  investingToSet: "/sinking-funds",
} as const;

function Panel({
  title,
  href,
  hrefLabel,
  index,
  testId,
  className,
  children,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  index: number;
  testId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      aria-label={title}
      data-testid={testId}
      className={cn("pop-in flex flex-col px-7 py-6", className)}
      style={stagger(index)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-extrabold">{title}</h2>
        {href && hrefLabel && (
          <Link
            href={href}
            className="text-[12.5px] font-extrabold text-muted-foreground hover:text-foreground"
          >
            {hrefLabel} →
          </Link>
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-3">{children}</div>
    </Card>
  );
}

const TONE_BG: Record<HealthStatus, string> = {
  good: "bg-c4",
  watch: "bg-c2",
  risk: "bg-c3",
};

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
  const tOrbit = useTranslations("home.orbit");
  const tAdvice = useTranslations("home.limits.advice");
  const tAction = useTranslations("home.limits.action");
  const tLimits = useTranslations("home.limits");
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
    planState && strategy ? currentAllocation(profile, planState, strategyRegistry, month) : null;
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

  const daysInThisMonth = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
  ).getUTCDate();
  const spending = freeSpending({
    wantsLimit: thisMonth.byBucket.wants.limit,
    wantsCommitted: thisMonth.byBucket.wants.committed,
    daysInMonth: daysInThisMonth,
    ...(profile.personalSpending !== undefined ? { personal: profile.personalSpending } : {}),
  });
  const names = {
    ...Object.fromEntries(queueItems.map((i) => [i.id, i.name])),
    ...Object.fromEntries(sinkingFunds.map((f) => [f.id, f.label])),
  };
  const waiting = activeQueueItems(queueItems);
  // Without a known plan there are no bucket limits to schedule against.
  const schedule =
    planState && strategy ? scheduleQueue(waiting, profile, planState, ledger, today, month) : [];
  const monthByItem = new Map(schedule.map((s) => [s.itemId, s.month]));
  // Waiting wants the scheduler already places in this month: what the wants limit can pay for now.
  const queueFitsNow = waiting.filter((i) => !i.isNeed && monthByItem.get(i.id) === month).length;
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
  const todayLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${today}T00:00:00Z`));

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

  const advice0 = limitAdvice(thisMonth, queueFitsNow)[0];
  const adviceLine = advice0
    ? advice0.id === "allGood"
      ? tAdvice("allGood")
      : tAdvice(advice0.id, {
          amount: money(advice0.amount),
          count: advice0.id === "wantsRoom" ? advice0.count : 0,
        })
    : "";

  const share = (amount: number) => (income > 0 ? Math.round((amount / income) * 100) : 0);
  // Recurring instalment and loan lines are keyed "fixed-<index>" into the profile's expenses.
  const installmentLabel = (refId: string): string => {
    if (refId.startsWith("fixed-")) {
      return profile.fixedExpenses[Number(refId.slice("fixed-".length))]?.label ?? refId;
    }
    return names[refId] ?? refId;
  };
  const installmentRows = ledger
    .filter((c) => c.source.module === "installments" && c.status !== "cancelled")
    .map((c) => ({
      label: installmentLabel(c.source.refId),
      amount: c.payments.filter((p) => p.month === month).reduce((sum, p) => sum + p.amount, 0),
    }))
    .filter((row) => row.amount > 0);
  // Instalment and loan lines are already in `installments` (the ledger counts them there), so the
  // fixed part leaves them out and nothing is counted twice.
  const activeExpenses = activeFixedExpenses(profile, month);
  const fixedLines = activeExpenses.filter((e) => expenseKind(e) === "regular");
  const orbitFixed = fixedLines.reduce((sum, e) => sum + e.monthly, 0);
  const needsRoom = allocation
    ? thisMonth.byBucket.needs.limit - thisMonth.byBucket.needs.committed
    : 0;
  const wantsRoom = allocation
    ? thisMonth.byBucket.wants.limit - thisMonth.byBucket.wants.committed
    : 0;
  const rowOf = (label: string, amount: number) => ({ label, amount, amountText: money(amount) });
  const segments: OrbitSegment[] = [
    {
      id: "fixed",
      label: tOrbit("fixed"),
      amount: orbitFixed,
      amountText: money(orbitFixed),
      color: "var(--c1)",
      shareText: tOrbit("ofIncome", { pct: share(orbitFixed) }),
      rows: fixedLines.map((e) => rowOf(e.label, e.monthly)),
      note: tOrbit("fixedNote"),
    },
    {
      id: "living",
      label: tOrbit("living"),
      amount: profile.livingExpenses,
      amountText: money(profile.livingExpenses),
      color: "var(--c2)",
      shareText: tOrbit("ofIncome", { pct: share(profile.livingExpenses) }),
      rows: [rowOf(tOrbit("living"), profile.livingExpenses)],
      note: tOrbit("livingNote"),
    },
    {
      id: "installments",
      label: tOrbit("installments"),
      amount: installments,
      amountText: money(installments),
      color: "var(--c3)",
      shareText: tOrbit("ofIncome", { pct: share(installments) }),
      rows: installmentRows.map((row) => rowOf(row.label, row.amount)),
      note: tOrbit("installmentsNote", {
        pct: share(installments),
        cap: Math.round(installmentCapPct * 100),
        state: installments <= income * installmentCapPct ? "under" : "over",
      }),
    },
    {
      id: "left",
      label: tOrbit("left"),
      amount: Math.max(0, left),
      amountText: money(left),
      color: "var(--c4)",
      shareText: tOrbit("ofIncome", { pct: share(Math.max(0, left)) }),
      rows: allocation
        ? [
            rowOf(tOrbit("freeSpending"), Math.max(0, wantsRoom)),
            rowOf(tOrbit("needsRoom"), Math.max(0, needsRoom)),
            rowOf(tOrbit("savingRoom"), allocation.savings + allocation.investing),
          ]
        : [rowOf(tOrbit("left"), Math.max(0, left))],
      note: tOrbit("leftNote", { daily: money(spending.daily) }),
    },
  ];

  const bars = cashFlow.map((point) => ({
    key: point.month,
    short: formatMonth(point.month, locale).slice(0, 3),
    long: formatMonth(point.month, locale),
    value: point.left,
    valueText: money(point.left),
  }));
  const fundPct = Math.min(1, savedMonths / Math.max(profile.emergencyFundTargetMonths, 0.01));
  // Red under half the target, yellow until it is reached, green once it is.
  const fundTone: HealthStatus = fundPct >= 1 ? "good" : fundPct >= 0.5 ? "watch" : "risk";
  const eventRows = events.slice(0, 4);

  return (
    <Page title={t("title")} hideTitle>
      {banner}

      {(overspent || fundLow) && (
        <div
          role="alert"
          className="rise-in flex flex-col gap-2 rounded-[28px] bg-destructive/10 px-6 py-4 text-sm font-semibold text-destructive"
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

      <div className="flex flex-wrap items-stretch gap-4">
        <Card
          aria-label={t("thisMonth")}
          data-testid="this-month"
          className="pop-in flex min-w-0 flex-[2_1_640px] flex-col px-6 pb-6 pt-7 md:px-[34px]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold tracking-[-0.03em]">
                {tOrbit("title", { month: formatMonth(month, locale) })}
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">{tOrbit("hint")}</p>
            </div>
            <span className="rounded-full bg-muted px-3.5 py-[7px] text-[13px] font-bold text-muted-foreground">
              {todayLabel}
            </span>
          </div>
          <OrbitRing
            segments={segments}
            income={income}
            day={dayOfMonth}
            days={daysInMonth}
            innerLabel={tOrbit("innerRing", { day: dayOfMonth, days: daysInMonth })}
            ariaLabel={t("monthProgress")}
          />
          <p className="mt-auto pt-4 text-center text-[13px] font-semibold text-muted-foreground">
            “{tOrbit(`quote${(dayOfMonth % 3) + 1}.text` as "quote1.text")}” ·{" "}
            {tOrbit(`quote${(dayOfMonth % 3) + 1}.by` as "quote1.by")}
          </p>
          <dl className="sr-only">
            <div>
              <dt>{t("left")}</dt>
              <dd data-testid="left">{money(left)}</dd>
            </div>
            <div>
              <dt>{t("income")}</dt>
              <dd data-testid="income">{money(income)}</dd>
            </div>
            <div>
              <dt>{t("obligations")}</dt>
              <dd data-testid="obligations">{money(obligations)}</dd>
            </div>
            <div>
              <dt>{t("living")}</dt>
              <dd data-testid="living">{money(profile.livingExpenses)}</dd>
            </div>
            <div>
              <dt>{t("installments")}</dt>
              <dd data-testid="installments">{money(installments)}</dd>
            </div>
          </dl>
        </Card>

        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
          <Card
            data-testid="saving-widget"
            className="pop-in bg-inverse px-[26px] py-6 text-inverse-foreground"
            style={stagger(2)}
          >
            <p className="text-[12.5px] font-bold opacity-70">{t("todoTitle")}</p>
            <p
              data-testid="saving-sentence"
              className="mt-2 text-[22px] font-extrabold leading-tight tracking-[-0.03em]"
            >
              {advice.stillToSet > 0
                ? t("savingMore", {
                    more: money(advice.stillToSet),
                    added: money(advice.deposited),
                  })
                : adviceLine}
            </p>
            <Link
              href={
                advice.stillToSet > 0
                  ? "/sinking-funds"
                  : advice0 && advice0.id !== "allGood"
                    ? ADVICE_HREF[advice0.id]
                    : "/queue"
              }
              className="press mt-4 inline-flex rounded-full bg-primary px-[22px] py-3 text-sm font-extrabold text-primary-foreground"
            >
              {advice.stillToSet > 0
                ? t("todoAddMoney")
                : advice0 && advice0.id !== "allGood"
                  ? tAction(advice0.id)
                  : t("todoLookQueue")}
            </Link>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/profile"
              aria-label={t("emergencyFund")}
              className={cn("lift pop-in rounded-card p-5 text-on", TONE_BG[fundTone])}
              style={stagger(3)}
            >
              <div className="text-[13px] font-bold">{t("emergencyFund")}</div>
              <div
                data-testid="emergency-fund"
                className="mt-1.5 text-[34px] font-extrabold leading-[1.1] tracking-[-0.05em]"
              >
                {savedMonths.toFixed(1)}
                <span className="text-sm tracking-normal">
                  {" "}
                  / {t("fundMonths", { target: profile.emergencyFundTargetMonths })}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={t("fundRing")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(fundPct * 100)}
                className="mt-3 h-[7px] rounded-full bg-black/20"
              >
                <div
                  className="h-[7px] rounded-full bg-on"
                  style={{ width: `${fundPct * 100}%` }}
                />
              </div>
            </Link>
            <Link
              href="/health"
              aria-label={t("healthTitle")}
              className={cn("lift pop-in rounded-card p-5 text-on", TONE_BG[health.overall])}
              style={stagger(4)}
            >
              <div className="text-[13px] font-bold">{t("healthTitle")}</div>
              <div className="mt-1.5 text-[34px] font-extrabold leading-[1.1] tracking-[-0.05em]">
                <span data-testid="home-health">{t(`health.${health.overall}`)}</span>
              </div>
              <p className="mt-2.5 text-xs font-semibold leading-snug">
                {health.steps[0] ? t(`healthWhy.${health.steps[0].id}`) : t("healthAllGood")}
              </p>
            </Link>
          </div>

          <Card
            className="pop-in px-6 py-5"
            style={stagger(5)}
            data-testid="cash-flow-chart"
            data-points={bars.length}
          >
            <MonthBars
              bars={bars}
              title={t("cashFlowTitle")}
              monthHeader={t("month")}
              valueHeader={t("left")}
            />
          </Card>

          <Card
            aria-label={t("upcoming")}
            data-testid="upcoming"
            className="pop-in flex-1 px-6 py-[18px]"
            style={stagger(6)}
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <h2 className="text-base font-extrabold">{t("upcoming")}</h2>
              <Link
                href="/calendar"
                className="text-[12.5px] font-extrabold text-muted-foreground hover:text-foreground"
              >
                {t("openCalendar")} →
              </Link>
            </div>
            {eventRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("upcomingNone")}</p>
            ) : (
              <ul>
                {eventRows.map((event) => (
                  <li
                    key={`${event.id}-${event.date}`}
                    data-testid={`event-${event.id}`}
                    className="flex items-center gap-3 border-t border-border py-2"
                  >
                    <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-muted text-[13px] font-extrabold">
                      {Number(event.date.slice(8, 10))}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                      {event.label}
                      {event.daysAway <= 1 && (
                        <span className="sr-only">
                          {" "}
                          {event.daysAway === 0 ? t("today") : t("tomorrow")}
                        </span>
                      )}
                    </span>
                    {event.amount !== undefined && (
                      <span
                        className={cn(
                          "text-[13.5px] font-extrabold",
                          event.kind === "income" && "text-success",
                        )}
                      >
                        {event.kind === "income" ? "+" : "−"}
                        {money(event.amount)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr]">
        {planTitle && allocation ? (
          <Panel
            title={t("activePlanNamed", { name: planTitle })}
            index={7}
            testId="active-plan"
            href="/plan"
            hrefLabel={t("changePlan")}
          >
            <ul className="flex flex-col gap-4">
              {limitStatuses(thisMonth)
                .filter((row) => row.limit > 0 || row.committed > 0)
                .map((row) => (
                  <li key={row.bucket} data-testid={`limit-${row.bucket}`}>
                    <div className="flex items-baseline justify-between gap-2 text-[13.5px] font-semibold">
                      <span>{tLimits(`bucket.${row.bucket}`)}</span>
                      <span>
                        <span className="font-extrabold">{money(row.committed)}</span>{" "}
                        <span className="text-muted-foreground">
                          / <span data-testid={`plan-${row.bucket}`}>{money(row.limit)}</span>
                        </span>
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={tLimits("barLabel", { bucket: tLimits(`bucket.${row.bucket}`) })}
                      aria-valuemin={0}
                      aria-valuemax={row.limit}
                      aria-valuenow={Math.min(row.committed, row.limit)}
                      className="mt-1.5 h-[9px] rounded-full bg-muted"
                    >
                      <div
                        className={cn(
                          "h-[9px] rounded-full transition-[width] duration-500",
                          row.state === "over"
                            ? "bg-destructive"
                            : row.state === "tight"
                              ? "bg-c2"
                              : "bg-c4",
                        )}
                        style={{
                          width: `${row.limit > 0 ? Math.min(100, (row.committed / row.limit) * 100) : 100}%`,
                        }}
                      />
                    </div>
                    <p
                      data-testid={`limit-state-${row.bucket}`}
                      className={cn(
                        "mt-1 text-xs font-bold",
                        row.state === "over" ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      <span data-testid={`left-${row.bucket}`}>
                        {row.state === "over"
                          ? tLimits("overBy", { amount: money(row.overBy) })
                          : tLimits("left", { amount: money(row.remaining) })}
                      </span>
                    </p>
                  </li>
                ))}
            </ul>
            <div
              data-testid="free-spending"
              className="mt-auto rounded-[18px] bg-muted px-4 py-3 text-[12.5px] leading-relaxed"
            >
              <p className="font-bold">
                {tLimits("spending.title")}:{" "}
                <span data-testid="free-spending-monthly" className="font-extrabold">
                  {money(spending.monthly)}
                </span>
              </p>
              <p data-testid="free-spending-spread" className="text-muted-foreground">
                {tLimits("spending.spread", {
                  weekly: money(spending.weekly),
                  daily: money(spending.daily),
                })}
              </p>
            </div>
          </Panel>
        ) : null}

        <Panel
          title={t("nextInQueue")}
          index={8}
          {...(next.length > 0 ? { href: "/queue", hrefLabel: t("openQueue") } : {})}
        >
          {next.length === 0 ? (
            <Link href="/queue" className="text-sm font-extrabold text-primary-ink hover:underline">
              {t("addToQueue")}
            </Link>
          ) : (
            <ul data-testid="next-items">
              {next.map((item) => {
                const scheduled = monthByItem.get(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 border-t border-border py-3"
                  >
                    <span className="text-sm font-bold">{item.name}</span>
                    <StatusChip tone={scheduled ? "success" : "neutral"}>
                      <span data-testid={`next-month-${item.id}`}>
                        {scheduled ? formatMonth(scheduled, locale) : tTimeline("notAffordableYet")}
                      </span>
                    </StatusChip>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title={t("installmentRoom.title")}
          index={9}
          testId="installment-room-panel"
          href="/income-expenses"
          hrefLabel={t("installmentRoom.manage")}
        >
          <InstallmentRoom income={income} capPct={installmentCapPct} used={installments} />
        </Panel>
      </div>
    </Page>
  );
}
