export const CORE_VERSION = 1;

export { LessonCardSchema, type LessonCard } from "../kernel/lesson";
export { createRegistry, type Registry } from "../kernel/registry";
export type { Module } from "../kernel/module";
export {
  project,
  projectSeries,
  type ProjectOptions,
  type ProjectionInput,
} from "../kernel/project";
export type { Commitment, CommitmentStatus } from "../kernel/commitment";
export type { Minor, Money, Currency } from "../kernel/money";
export type { Month } from "../kernel/month";
export type { MonthProjection } from "../kernel/projection";
export type { Bucket } from "../kernel/bucket";

export { profileModule } from "../modules/profile/module";
export { planModule } from "../modules/plan/module";
export { guardsModule } from "../modules/guards/module";
export { queueModule } from "../modules/queue/module";
export { sinkingFundsModule } from "../modules/sinking-funds/module";
export { cardsModule } from "../modules/cards/module";
export { decisionsModule } from "../modules/decisions/module";
export { backupModule } from "../modules/backup/module";
export { exportAll, BackupSchema, type Backup } from "../modules/backup/schema";
export { importAll, type ImportResult } from "../modules/backup/import";

export { ProfileSchema, type Profile } from "../modules/profile/schema";
export { PlanStateSchema, type PlanStateInput } from "../modules/plan/schema";
export { strategies as strategyRegistry } from "../modules/plan/strategies-registry";
export {
  compareStrategies,
  currentAllocation,
  type StrategyComparison,
} from "../modules/plan/selectors";
export type { Strategy, Insight } from "../strategies/types";
export { GuardThresholdsSchema } from "../modules/guards/schema";
export { QueueItemSchema, type QueueItem } from "../modules/queue/schema";
export { SinkingFundSchema, type SinkingFund } from "../modules/sinking-funds/schema";
export { CardSchema, type Card } from "../modules/cards/schema";
export { DecisionSchema, type Decision } from "../modules/decisions/schema";
