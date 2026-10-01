import {
  installmentCommitments,
  recurringCommitments,
  type Commitment,
  type Month,
  type Profile,
  type QueueItem,
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
): Commitment[] {
  return [
    ...(profile ? recurringCommitments(profile, fromMonth) : []),
    ...installmentCommitments(queueItems),
  ];
}
