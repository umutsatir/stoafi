import type { Bucket } from "../../kernel/bucket";
import type { Month } from "../../kernel/month";
import type { Minor } from "../../kernel/money";
import { emergencyFirst } from "../../strategies/emergency-first";
import type { Strategy } from "../../strategies/types";
import type { Profile } from "../profile/schema";
import { strategies as defaultStrategies } from "./strategies-registry";

export interface PlanState {
  strategyId: string;
  params: unknown;
}

/**
 * The active plan's limits for each bucket. While the emergency fund is below its target, what the plan
 * would invest is added to savings instead (see `emergencyFirst`). `month` picks the month whose needs
 * set that target.
 */
export function currentAllocation(
  profile: Profile,
  planState: PlanState,
  registry: Record<string, Strategy> = defaultStrategies,
  month?: Month,
): Record<Bucket, Minor> {
  const strategy = registry[planState.strategyId];
  if (!strategy) {
    throw new Error(`Unknown strategy id: ${planState.strategyId}`);
  }
  const params = strategy.params.parse(planState.params);
  return emergencyFirst(strategy.allocate(profile, params), profile, month);
}

export interface StrategyComparison {
  strategyId: string;
  allocation: Record<Bucket, Minor>;
}

/** Allocation for every registered strategy, side by side, using each strategy's default params. */
export function compareStrategies(
  profile: Profile,
  registry: Record<string, Strategy> = defaultStrategies,
): StrategyComparison[] {
  return Object.values(registry).map((strategy) => ({
    strategyId: strategy.id,
    allocation: strategy.allocate(profile, strategy.params.parse({})),
  }));
}

/** The plan used until the user picks one: 50/30/20 with its default params. */
export function defaultPlanState(): PlanState {
  return { strategyId: "fifty-thirty-twenty", params: {} };
}
