"use client";

import { useMemo } from "react";
import {
  currentAllocation,
  defaultGuardRules,
  evaluateGuards,
  project,
  strategyRegistry,
  toDraftCommitment,
  type Commitment,
  type GuardBreach,
  type Month,
  type PlanStateInput,
  type Profile,
  type QueueItem,
} from "@stoafi/core";

export interface QueuePreviewProps {
  item: QueueItem;
  profile: Profile;
  planState: PlanStateInput;
  commitments: Commitment[];
  month: Month;
  income: number;
  monthlyNeeds: number;
  installmentCapPct: number;
  onConfirm: (activeCommitment: Commitment, breaches: GuardBreach[]) => void;
}

export function QueuePreview({
  item,
  profile,
  planState,
  commitments,
  month,
  income,
  monthlyNeeds,
  installmentCapPct,
  onConfirm,
}: QueuePreviewProps) {
  const bucketLimits = currentAllocation(profile, planState, strategyRegistry);
  const draft = toDraftCommitment(item, month);

  const before = project({ income }, commitments, month, { bucketLimits });
  const after = project({ income }, [...commitments, draft], month, {
    includeDrafts: true,
    bucketLimits,
  });

  const draftAmount = draft.payments[0]?.amount ?? 0;
  const savingsBalanceAfterDraft = profile.savings - draftAmount;

  const breaches = useMemo(
    () =>
      evaluateGuards(defaultGuardRules, {
        after,
        savingsBalanceAfterDraft,
        monthlyNeeds,
        emergencyFundTargetMonths: profile.emergencyFundTargetMonths,
        projectedInstallmentLoad: after.installmentLoad,
        netIncome: income,
        installmentCapPct,
      }),
    [
      after,
      savingsBalanceAfterDraft,
      monthlyNeeds,
      profile.emergencyFundTargetMonths,
      income,
      installmentCapPct,
    ],
  );

  const blocked = breaches.some((b) => b.severity === "block");

  return (
    <div>
      <h2>{item.name}</h2>
      <table>
        <tbody>
          <tr>
            <td>Wants before / after</td>
            <td data-testid="wants-before">{before.byBucket.wants.committed}</td>
            <td data-testid="wants-after">{after.byBucket.wants.committed}</td>
          </tr>
          <tr>
            <td>Free cash before / after</td>
            <td data-testid="freecash-before">{before.freeCash}</td>
            <td data-testid="freecash-after">{after.freeCash}</td>
          </tr>
        </tbody>
      </table>

      {breaches.length > 0 && (
        <ul data-testid="guard-breaches" style={{ color: "red" }}>
          {breaches.map((b) => (
            <li key={b.ruleId}>{b.ruleId}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={blocked}
        onClick={() => onConfirm({ ...draft, status: "active" }, breaches)}
      >
        Confirm
      </button>
    </div>
  );
}
