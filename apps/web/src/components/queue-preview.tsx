"use client";

import { useMemo, useState } from "react";
import {
  currentAllocation,
  defaultGuardRules,
  evaluateGuards,
  project,
  strategyRegistry,
  timingTip,
  toDraftCommitment,
  type Card,
  type Commitment,
  type GuardBreach,
  type Month,
  type OfferResult,
  type PlanStateInput,
  type Profile,
  type QueueItem,
} from "@stoafi/core";
import { InstallmentCalculator } from "./installment-calculator";

export interface QueuePreviewProps {
  item: QueueItem;
  profile: Profile;
  planState: PlanStateInput;
  commitments: Commitment[];
  month: Month;
  income: number;
  monthlyNeeds: number;
  installmentCapPct: number;
  /** When paying by card: checks today against the statement day for a timing tip. */
  card?: Card;
  purchaseDate?: string;
  onConfirm: (
    activeCommitment: Commitment,
    breaches: GuardBreach[],
    guardBreachConfirmed: boolean,
  ) => void;
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
  card,
  purchaseDate,
  onConfirm,
}: QueuePreviewProps) {
  const bucketLimits = currentAllocation(profile, planState, strategyRegistry);
  const [shiftedMonth, setShiftedMonth] = useState<Month | null>(null);
  const draft = toDraftCommitment(item, shiftedMonth ?? month);
  const tip = card && purchaseDate ? timingTip(card, purchaseDate) : null;

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

  const [showInstallments, setShowInstallments] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferResult | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const hasBreach = breaches.length > 0;
  const canConfirm = !hasBreach || acknowledged;

  return (
    <div>
      <h2>{item.name}</h2>
      {selectedOffer && (
        <p data-testid="installment-draft-state">
          Installment draft: {selectedOffer.months} months
        </p>
      )}
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

      {tip && !shiftedMonth && (
        <p data-testid="card-timing-tip">
          Buying after the statement day adds {tip.extraFloatDays} extra float days; due{" "}
          {tip.newDueMonth}.
          <button type="button" onClick={() => setShiftedMonth(tip.newDueMonth)}>
            Accept
          </button>
        </p>
      )}

      {hasBreach && (
        <div data-testid="guard-breach-dialog">
          <ul data-testid="guard-breaches" style={{ color: "red" }}>
            {breaches.map((b) => (
              <li key={b.ruleId}>{b.ruleId}</li>
            ))}
          </ul>
          {!acknowledged && (
            <button type="button" onClick={() => setAcknowledged(true)}>
              I know
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!canConfirm}
        onClick={() => onConfirm({ ...draft, status: "active" }, breaches, hasBreach)}
      >
        Confirm
      </button>

      <button type="button" onClick={() => setShowInstallments(true)}>
        Calculate with installments
      </button>

      {showInstallments && (
        <InstallmentCalculator
          cashPrice={item.price}
          annualInflation={profile.annualInflationExpectation}
          onSelect={(offer) => {
            setSelectedOffer(offer);
            setShowInstallments(false);
          }}
        />
      )}
    </div>
  );
}
