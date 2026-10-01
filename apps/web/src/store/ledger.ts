import {
  installmentCommitments,
  recurringCommitments,
  sinkingFundCommitments,
  type Commitment,
  type Month,
  type Profile,
  type QueueItem,
  type SinkingFund,
} from "@stoafi/core";

/**
 * Everything planned to leave the account, derived from state on every call and
 * never stored: the profile's recurring costs plus installment purchases.
 * Cash purchases are decisions only and never appear here.
 */
export function buildLedger(
  profile: Profile | null,
  queueItems: QueueItem[],
  fromMonth: Month,
  sinkingFunds: SinkingFund[] = [],
): Commitment[] {
  return [
    ...(profile ? recurringCommitments(profile, fromMonth) : []),
    ...installmentCommitments(queueItems),
    ...sinkingFundCommitments(sinkingFunds, fromMonth),
  ];
}
