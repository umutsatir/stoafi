import {
  activeFixedExpenses,
  activeQueueItems,
  addMonths,
  costBasis,
  currentAllocation,
  depositedInMonth,
  healthSummary,
  marketValue,
  monthlyNeeds,
  netMonthlyIncome,
  project,
  scheduleQueue,
  strategyRegistry,
  type AiExportData,
  type Card,
  type Commitment,
  type Decision,
  type Holding,
  type Month,
  type PlanStateInput,
  type Profile,
  type QueueItem,
  type SinkingFund,
} from "@stoafi/core";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";

export interface AiExportState {
  profile: Profile;
  planState: PlanStateInput | null;
  queueItems: QueueItem[];
  sinkingFunds: SinkingFund[];
  holdings: Holding[];
  cards: Card[];
  decisions: Decision[];
  ledger: Commitment[];
  installmentCapPct: number;
  today: string;
  month: Month;
  locale: Locale;
  /** The name to show for an investment's type. */
  typeName: (holding: Holding) => string;
}

/** Collects what the AI export needs from the app's state, in the shape `buildAiExport` takes. */
export function buildAiExportData(state: AiExportState): AiExportData {
  const { profile, month } = state;
  const income = netMonthlyIncome(profile);
  const strategy = state.planState ? strategyRegistry[state.planState.strategyId] : undefined;
  const limits =
    state.planState && strategy
      ? currentAllocation(profile, state.planState, strategyRegistry)
      : undefined;
  const projection = project(
    { income },
    state.ledger,
    month,
    limits ? { bucketLimits: limits } : {},
  );
  const needs = monthlyNeeds(profile, month);
  const lesson = strategy ? getLessonCard(strategy.lessonId, state.locale) : undefined;

  const waiting = activeQueueItems(state.queueItems);
  const schedule =
    state.planState && strategy
      ? scheduleQueue(waiting, profile, state.planState, state.ledger, state.today, month)
      : [];
  const monthByItem = new Map(schedule.map((s) => [s.itemId, s.month]));

  const depositedThisMonth =
    depositedInMonth(profile.deposits, month) +
    state.sinkingFunds.reduce((sum, f) => sum + depositedInMonth(f.deposits, month), 0);
  const health = healthSummary({
    projection,
    savingsBalance: profile.savings,
    monthlyNeeds: needs,
    depositedThisMonth,
    emergencyFundTargetMonths: profile.emergencyFundTargetMonths,
    installmentCapPct: state.installmentCapPct,
  });

  return {
    incomes: profile.incomes.map((i) => ({ label: i.label, monthly: i.monthly })),
    expenses: activeFixedExpenses(profile, month).map((e) => ({
      label: e.label,
      monthly: e.monthly,
      bucket: e.bucket,
    })),
    living: profile.livingExpenses,
    emergency: {
      balance: profile.savings,
      targetMonths: profile.emergencyFundTargetMonths,
      monthsSaved: health.metrics.emergencyFundMonths.value,
    },
    left: projection.freeCash,
    ...(lesson
      ? { plan: { name: lesson.title, source: `${lesson.source.author}, ${lesson.source.work}` } }
      : {}),
    queue: waiting.map((item) => ({
      name: item.name,
      price: item.discountedCashPrice ?? item.price,
      month: monthByItem.get(item.id) ?? null,
    })),
    installments: state.queueItems.flatMap((item) => {
      const purchase = item.installmentPurchase;
      if (!purchase) return [];
      const endsMonth = addMonths(purchase.firstMonth, purchase.offer.months - 1);
      if (endsMonth < month) return [];
      return [{ name: item.name, payment: purchase.offer.payments[0] ?? 0, endsMonth }];
    }),
    pots: state.sinkingFunds.map((f) => ({
      label: f.label,
      balance: f.currentBalance,
      target: f.target,
      dueMonth: f.dueMonth,
    })),
    holdings: state.holdings.map((h) => ({
      label: h.label,
      type: state.typeName(h),
      value: marketValue(h).value,
      cost: costBasis(h),
    })),
    cards: state.cards
      .filter((c) => c.kind !== "supplementary")
      .map((c) => ({
        label: c.label,
        ...(c.limit !== undefined ? { limit: c.limit } : {}),
        dueDay: c.dueDay,
      })),
    decisions: [...state.decisions]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 5)
      .map((d) => ({ name: d.itemName ?? "?", outcome: d.outcome, amount: d.amount })),
    health: {
      savingsRate: health.metrics.savingsRate.value,
      installmentRatio: health.metrics.installmentRatio.value,
      runwayMonths: health.metrics.runway.value,
    },
  };
}
