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
import { Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { InstallmentCalculator } from "./installment-calculator";

/** How the user chose to pay; the page turns this into a decision plus (for installments) a saved purchase. */
export type PurchaseChoice =
  | { method: "cash" }
  | { method: "installment"; offer: InstallmentOfferInput; firstMonth: Month; cardId?: string };

export interface QueuePreviewProps {
  item: QueueItem;
  profile: Profile;
  planState: PlanStateInput;
  commitments: Commitment[];
  month: Month;
  income: number;
  monthlyNeeds: number;
  installmentCapPct: number;
  /** Cards to pay with; choosing one checks the purchase date against its statement day for a timing tip. */
  cards?: PaymentCard[];
  purchaseDate?: string;
  /**
   * The first month the scheduler finds room for this item: a month, `null` when it fits in none
   * of the horizon, or undefined when the caller has no suggestion.
   */
  suggestedMonth?: Month | null;
  /** Skip or postpone the purchase instead of buying; the caller records the decision. */
  onDecide?: (outcome: "skipped" | "postponed") => void;
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
  cards = [],
  purchaseDate,
  suggestedMonth,
  onDecide,
  onConfirm,
}: QueuePreviewProps) {
  const bucketLimits = currentAllocation(profile, planState, strategyRegistry);
  const [shiftedMonth, setShiftedMonth] = useState<Month | null>(null);
  const [previewMonth, setPreviewMonth] = useState<Month>(month);
  const [cardId, setCardId] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<OfferResult | null>(null);
  const firstMonth = shiftedMonth ?? previewMonth;
  const card = cards.find((c) => c.id === cardId);
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

  const before = project({ income }, commitments, firstMonth, { bucketLimits });
  const after = project({ income }, [...commitments, draft], firstMonth, {
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

        {suggestedMonth !== undefined && (
          <div
            data-testid="suggested-month"
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
          >
            <span>
              {suggestedMonth ? t("suggestedMonth", { month: suggestedMonth }) : t("suggestedNone")}
            </span>
            {suggestedMonth && suggestedMonth !== firstMonth && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewMonth(suggestedMonth);
                  setShiftedMonth(null);
                }}
              >
                {t("previewIn", { month: suggestedMonth })}
              </Button>
            )}
          </div>
        )}

        {cards.length > 0 && (
          <Field label={t("payWithCard")} htmlFor="preview-card">
            <NativeSelect
              id="preview-card"
              value={cardId}
              onChange={(e) => {
                setCardId(e.target.value);
                setShiftedMonth(null);
              }}
            >
              <option value="">{t("noCard")}</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.kind === "supplementary"
                    ? `${cards.find((m) => m.id === c.parentId)?.label ?? ""} · ${c.label}`
                    : c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
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
                  {t.has(`guard.${b.ruleId}`) ? t(`guard.${b.ruleId}`) : t("guard.unknown")}
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
                offer
                  ? { method: "installment", offer, firstMonth, ...(cardId ? { cardId } : {}) }
                  : { method: "cash" },
              )
            }
          >
            {t("confirm")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowInstallments(true)}>
            {t("calculateWithInstallments")}
          </Button>
          {onDecide && (
            <>
              <Button type="button" variant="ghost" onClick={() => onDecide("postponed")}>
                {t("postpone")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => onDecide("skipped")}>
                {t("skip")}
              </Button>
            </>
          )}
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
