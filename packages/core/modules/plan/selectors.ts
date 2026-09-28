import type { Bucket } from "../../kernel/bucket";
import type { Minor } from "../../kernel/money";
import type { Strategy } from "../../strategies/types";
import type { Profile } from "../profile/schema";
import { strategies as defaultStrategies } from "./strategies-registry";

export interface PlanState {
  strategyId: string;
  params: unknown;
}

export function currentAllocation(
  profile: Profile,
  planState: PlanState,
  registry: Record<string, Strategy> = defaultStrategies,
): Record<Bucket, Minor> {
  const strategy = registry[planState.strategyId];
  if (!strategy) {
    throw new Error(`Unknown strategy id: ${planState.strategyId}`);
  }
  const params = strategy.params.parse(planState.params);
  return strategy.allocate(profile, params);
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
