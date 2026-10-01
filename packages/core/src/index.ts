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
export {
  MonthSchema,
  addMonths,
  compareMonths,
  monthsBetween,
  parseMonth,
  type Month,
} from "../kernel/month";
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
export {
  dueDayOf,
  hourlyNetIncome,
  monthlyNeeds,
  netMonthlyIncome,
  payDayOf,
} from "../modules/profile/selectors";
export { activeFixedExpenses, isExpenseActiveInMonth } from "../modules/profile/active-expenses";
export { migrateProfileV1ToV2 } from "../modules/profile/migrations";
export { PlanStateSchema, type PlanStateInput } from "../modules/plan/schema";
export { strategies as strategyRegistry } from "../modules/plan/strategies-registry";
export {
  compareStrategies,
  currentAllocation,
  defaultPlanState,
  type StrategyComparison,
} from "../modules/plan/selectors";
export type { Strategy, Insight } from "../strategies/types";
export { GuardThresholdsSchema, type GuardThresholds } from "../modules/guards/schema";
export { QueueItemSchema, type QueueItem } from "../modules/queue/schema";
export { SinkingFundSchema, type SinkingFund } from "../modules/sinking-funds/schema";
export { CARD_NETWORKS, CardSchema, type Card, type CardNetwork } from "../modules/cards/schema";
export {
  limitUsage,
  mainCards,
  removeCardFromSet,
  supplementariesOf,
  validateCardSet,
  type CardSetProblem,
  type LimitUsage,
  type RemoveResult,
  type SupplementaryChoice,
} from "../modules/cards/card-set";
export {
  BANKS,
  BANKS_ARE_APPROXIMATE,
  bankById,
  cardColors,
  type BankPreset,
  type CardColors,
} from "../modules/cards/banks";
export { DecisionSchema, type Decision } from "../modules/decisions/schema";

export { costInWorkHours, costPerUse, eisenhowerQuadrant } from "../modules/queue/selectors";
export { cooldownStatus, type CooldownStatus } from "../modules/queue/cooldown";
export { toDraftCommitment } from "../modules/queue/to-commitment";
export {
  activeQueueItems,
  installmentCommitments,
  remainingInstallmentsByCard,
  toInstallmentCommitment,
} from "../modules/queue/installment-purchase";
export { scheduleQueue, type ScheduleResult } from "../modules/queue/scheduler";

export {
  savingsRate,
  installmentRatio,
  emergencyFundMonths,
  runway,
} from "../modules/health/selectors";
export { savingsSummary, type SavingsSummary } from "../modules/decisions/selectors";
export { timingTip, type TimingTip } from "../modules/cards/timing";
export { minimumPaymentPayoff, type MinPaymentRule } from "../modules/cards/minimum-payment";
export { toCommitment } from "../modules/sinking-funds/schema";
export {
  compareOffers,
  monthlyRate,
  pvOfPlan,
  realSaving,
  type InstallmentOffer,
  type OfferResult,
} from "../modules/installments/selectors";
export { installmentLoadTimeline, capacityRemaining } from "../modules/installments/capacity";
export { InstallmentOfferSchema, type InstallmentOfferInput } from "../modules/installments/schema";
export { defaultGuardRules, type GuardContext, type GuardRule } from "../modules/guards/schema";
export { evaluateGuards, type GuardBreach } from "../modules/guards/selectors";
export { suggestedEmergencyFundMonth } from "../modules/health/suggested-emergency-fund";
export {
  INFLATION_COUNTRY_CODES,
  INFLATION_DATA_AS_OF,
  INFLATION_DATA_SOURCE,
  suggestedAnnualInflation,
} from "../modules/profile/inflation-by-country";
export { cashFlowSeries, type CashFlowPoint } from "../modules/profile/cash-flow";
export { recurringCommitments } from "../modules/profile/recurring-commitments";
export { settingsModule } from "../modules/settings/module";
export {
  LOCALES,
  THEMES,
  SettingsSchema,
  defaultSettings,
  detectLocale,
  resolveTheme,
  type Settings,
  type ThemePreference,
} from "../modules/settings/schema";
export {
  sinkingFundCommitments,
  sinkingFundStatus,
  type SinkingFundStatus,
} from "../modules/sinking-funds/status";
export { monthlySetAside } from "../modules/sinking-funds/selectors";
