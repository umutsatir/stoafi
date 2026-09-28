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
  type Card as PaymentCard,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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
  card?: PaymentCard;
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
    <Card>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {selectedOffer && (
          <div
            data-testid="installment-draft-state"
            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-secondary p-3 text-sm"
          >
            <span>{t("installmentDraft", { months: selectedOffer.months })}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedOffer(null)}
            >
              {t("payCashInstead")}
            </Button>
          </div>
        )}

        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-muted-foreground">{t("wantsBeforeAfter")}</TableCell>
              <TableCell data-testid="wants-before" className="text-right">
                {money(before.byBucket.wants.committed)}
              </TableCell>
              <TableCell data-testid="wants-after" className="text-right font-medium">
                {money(after.byBucket.wants.committed)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">
                {t("installmentLoadBeforeAfter")}
              </TableCell>
              <TableCell data-testid="installment-load-before" className="text-right">
                {money(before.installmentLoad)}
              </TableCell>
              <TableCell data-testid="installment-load-after" className="text-right font-medium">
                {money(after.installmentLoad)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">{t("freeCashBeforeAfter")}</TableCell>
              <TableCell data-testid="freecash-before" className="text-right">
                {money(before.freeCash)}
              </TableCell>
              <TableCell data-testid="freecash-after" className="text-right font-medium">
                {money(after.freeCash)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {tip && !shiftedMonth && (
          <div
            data-testid="card-timing-tip"
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
          >
            <span>{t("cardTimingTip", { days: tip.extraFloatDays, month: tip.newDueMonth })}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShiftedMonth(tip.newDueMonth)}
            >
              {t("accept")}
            </Button>
          </div>
        )}

        {hasBreach && (
          <div
            data-testid="guard-breach-dialog"
            className="flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3"
          >
            <ul data-testid="guard-breaches" className="flex flex-col gap-1">
              {breaches.map((b) => (
                <li key={b.ruleId} className="text-sm font-medium text-destructive">
                  {b.ruleId}
                </li>
              ))}
            </ul>
            {!acknowledged && (
              <div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setAcknowledged(true)}
                >
                  {t("iKnow")}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
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
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowInstallments(true)}>
            {t("calculateWithInstallments")}
          </Button>
        </div>

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
      </CardContent>
    </Card>
  );
}
