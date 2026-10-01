import {
  buildSnapshot,
  currentAllocation,
  depositedInMonth,
  healthSummary,
  monthlyNeeds,
  netMonthlyIncome,
  portfolioTotals,
  project,
  strategyRegistry,
  type Holding,
  type PlanStateInput,
  type Profile,
  type QueueItem,
  type SinkingFund,
  type Snapshot,
} from "@stoafi/core";
import { buildLedger } from "@/store/ledger";
import { monthOf } from "./clock";

export interface SnapshotState {
  profile: Profile;
  planState: PlanStateInput | null;
  queueItems: QueueItem[];
  sinkingFunds: SinkingFund[];
  holdings: Holding[];
  installmentCapPct: number;
  today: string;
}

/** How this month looks right now, in the shape that is stored once a month. */
export function snapshotFromState(state: SnapshotState): Snapshot {
  const { profile } = state;
  const month = monthOf(state.today);
  const strategy = state.planState ? strategyRegistry[state.planState.strategyId] : undefined;
  const limits =
    state.planState && strategy
      ? currentAllocation(profile, state.planState, strategyRegistry)
      : undefined;
  const income = netMonthlyIncome(profile);
  const ledger = buildLedger(profile, state.queueItems, month, state.sinkingFunds);
  const projection = project({ income }, ledger, month, limits ? { bucketLimits: limits } : {});
  const deposited =
    depositedInMonth(profile.deposits, month) +
    state.sinkingFunds.reduce((sum, f) => sum + depositedInMonth(f.deposits, month), 0);
  const health = healthSummary({
    projection,
    savingsBalance: profile.savings,
    monthlyNeeds: monthlyNeeds(profile, month),
    depositedThisMonth: deposited,
    emergencyFundTargetMonths: profile.emergencyFundTargetMonths,
    installmentCapPct: state.installmentCapPct,
  });
  return buildSnapshot({
    month,
    income,
    left: projection.freeCash,
    savingsRate: health.metrics.savingsRate.value,
    installmentRatio: health.metrics.installmentRatio.value,
    emergencyMonths: health.metrics.emergencyFundMonths.value,
    runwayMonths: health.metrics.runway.value,
    savings: profile.savings,
    potsTotal: state.sinkingFunds.reduce((sum, f) => sum + f.currentBalance, 0),
    portfolioValue: portfolioTotals(state.holdings).value,
  });
}
