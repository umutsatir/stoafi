"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  currentAllocation,
  defaultGuardRules,
  evaluateGuards,
  project,
  strategyRegistry,
  timingTip,
  toDraftCommitment,
  toInstallmentCommitment,
  type Card,
  type Commitment,
  type GuardBreach,
  type InstallmentOfferInput,
  type Month,
  type OfferResult,
  type PlanStateInput,
  type Profile,
  type QueueItem,
} from "@stoafi/core";
import { useMoney } from "@/lib/use-money";
import { InstallmentCalculator } from "./installment-calculator";

/** How the user chose to pay; the page turns this into a decision plus (for installments) a saved purchase. */
export type PurchaseChoice =
  { method: "cash" } | { method: "installment"; offer: InstallmentOfferInput; firstMonth: Month };

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
    purchase: PurchaseChoice,
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
  const [selectedOffer, setSelectedOffer] = useState<OfferResult | null>(null);
  const firstMonth = shiftedMonth ?? month;
  const cashPrice = item.discountedCashPrice ?? item.price;
  const offer: InstallmentOfferInput | null = selectedOffer
    ? {
        months: selectedOffer.months,
        payments: Array.from({ length: selectedOffer.months }, () => selectedOffer.monthlyPayment),
      }
    : null;
  const draft = offer
    ? toInstallmentCommitment(item, offer, firstMonth, "draft")
    : toDraftCommitment(item, firstMonth);
  const tip = card && purchaseDate ? timingTip(card, purchaseDate) : null;

  const before = project({ income }, commitments, month, { bucketLimits });
  const after = project({ income }, [...commitments, draft], month, {
    includeDrafts: true,
    bucketLimits,
  });

  // Paying cash takes the price out of savings now; installments leave savings
  // untouched and show up as monthly load instead.
  const savingsBalanceAfterDraft = offer ? profile.savings : profile.savings - cashPrice;

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
  const [acknowledged, setAcknowledged] = useState(false);
  const hasBreach = breaches.length > 0;
  const canConfirm = !hasBreach || acknowledged;
  const t = useTranslations("queuePreview");
  const money = useMoney();

  return (
    <div>
      <h2>{item.name}</h2>
      {selectedOffer && (
        <p data-testid="installment-draft-state">
          {t("installmentDraft", { months: selectedOffer.months })}
          <button type="button" onClick={() => setSelectedOffer(null)}>
            {t("payCashInstead")}
          </button>
        </p>
      )}
      <table>
        <tbody>
          <tr>
            <td>{t("wantsBeforeAfter")}</td>
            <td data-testid="wants-before">{money(before.byBucket.wants.committed)}</td>
            <td data-testid="wants-after">{money(after.byBucket.wants.committed)}</td>
          </tr>
          <tr>
            <td>{t("installmentLoadBeforeAfter")}</td>
            <td data-testid="installment-load-before">{money(before.installmentLoad)}</td>
            <td data-testid="installment-load-after">{money(after.installmentLoad)}</td>
          </tr>
          <tr>
            <td>{t("freeCashBeforeAfter")}</td>
            <td data-testid="freecash-before">{money(before.freeCash)}</td>
            <td data-testid="freecash-after">{money(after.freeCash)}</td>
          </tr>
        </tbody>
      </table>

      {tip && !shiftedMonth && (
        <p data-testid="card-timing-tip">
          {t("cardTimingTip", { days: tip.extraFloatDays, month: tip.newDueMonth })}
          <button type="button" onClick={() => setShiftedMonth(tip.newDueMonth)}>
            {t("accept")}
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
              {t("iKnow")}
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!canConfirm}
        onClick={() =>
          onConfirm(
            { ...draft, status: "active" },
            breaches,
            hasBreach,
            offer ? { method: "installment", offer, firstMonth } : { method: "cash" },
          )
        }
      >
        {t("confirm")}
      </button>

      <button type="button" onClick={() => setShowInstallments(true)}>
        {t("calculateWithInstallments")}
      </button>

      {showInstallments && (
        <InstallmentCalculator
          cashPrice={cashPrice}
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
