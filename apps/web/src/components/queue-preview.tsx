"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  cooldownPhase,
  costInWorkHours,
  currentAllocation,
  defaultGuardRules,
  evaluateGuards,
  hourlyNetIncome,
  limitUsage,
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
import { Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { formatMonth } from "@/lib/format-month";
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
  /** What is still to be paid on installment purchases, per card id, for the shared-limit check. */
  remainingInstallments?: Record<string, number>;
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
  remainingInstallments = {},
  suggestedMonth,
  onDecide,
  onConfirm,
}: QueuePreviewProps) {
  const bucketLimits = currentAllocation(profile, planState, strategyRegistry, month);
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

  // An installment bought on a card uses that card's shared limit (with its supplementary cards).
  const mainCardId = card ? (card.kind === "supplementary" ? card.parentId : card.id) : undefined;
  const usage = mainCardId ? limitUsage(cards, mainCardId, remainingInstallments) : null;
  const draftOnCard = offer ? offer.payments.reduce((sum, p) => sum + p, 0) : 0;
  const cardLimitOverBy = usage ? Math.max(0, usage.used + draftOnCard - usage.limit) : 0;

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
        cardLimitOverBy,
      }),
    [
      after,
      savingsBalanceAfterDraft,
      monthlyNeeds,
      profile.emergencyFundTargetMonths,
      income,
      installmentCapPct,
      cardLimitOverBy,
    ],
  );

  const [showInstallments, setShowInstallments] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const hasBreach = breaches.length > 0;
  const t = useTranslations("queuePreview");
  const tq = useTranslations("queue");
  const tCommon = useTranslations("common");
  const money = useMoney();
  const locale = useLocale();

  const monthName = formatMonth(firstMonth, locale);
  const hours = costInWorkHours(cashPrice, hourlyNetIncome(profile));
  const phase = purchaseDate ? cooldownPhase(item, purchaseDate) : ({ phase: "none" } as const);
  const ringFraction =
    phase.phase === "counting" ? (30 - phase.daysLeft) / 30 : phase.phase === "none" ? 0 : 1;
  const ruleText =
    phase.phase === "none"
      ? t("ruleNone")
      : phase.phase === "counting"
        ? t("ruleDays", { days: 30 - phase.daysLeft })
        : t("ruleDone");
  const guardLine = item.isNeed
    ? t("needNoWait")
    : offer
      ? t("perMonth", { amount: money(offer.payments[0] ?? 0) })
      : t("cashPay", { amount: money(cashPrice) });
  const room =
    suggestedMonth === null
      ? "none"
      : after.freeCash < 0
        ? "short"
        : after.freeCash < 600_000
          ? "tight"
          : "roomy";
  const roomChip = {
    none: "bg-destructive text-primary-foreground",
    short: "bg-destructive text-primary-foreground",
    tight: "bg-c2 text-on",
    roomy: "bg-c4 text-on",
  }[room];
  const scale = Math.max(1, before.freeCash, after.freeCash);
  const CARD = "pop-in flex flex-col rounded-card bg-card px-[30px] py-[26px]";
  const SOFT_BTN =
    "rounded-full bg-muted font-bold text-[13px] transition-transform duration-[250ms] [transition-timing-function:cubic-bezier(.3,1.7,.5,1)] hover:scale-[1.04]";
  const buy = () =>
    onConfirm(
      { ...draft, status: "active" },
      breaches,
      hasBreach,
      offer
        ? { method: "installment", offer, firstMonth, ...(cardId ? { cardId } : {}) }
        : { method: "cash" },
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
        <section className={`${CARD} min-h-[280px]`} aria-label={item.name}>
          <p className="text-[12.5px] font-bold text-muted-foreground">
            {item.isNeed ? tq("kindNeed") : tq("kindWant")} ·{" "}
            {offer ? t("installmentMode", { months: offer.months }) : tq("cash")} · {monthName}
          </p>
          {phase.phase === "counting" && (
            <span className="mt-2 self-start rounded-full bg-c2 px-3 py-[5px] text-xs font-extrabold text-on">
              {tq("cooldown.days", { count: phase.daysLeft })}
            </span>
          )}
          {phase.phase === "ask" && (
            <span className="mt-2 self-start rounded-full bg-c3 px-3 py-[5px] text-xs font-extrabold text-on">
              {tq("cooldown.askBadge")}
            </span>
          )}
          <h2 className="mt-1.5 text-[26px] font-extrabold tracking-[-0.04em]">{item.name}</h2>
          <div className="mt-auto">
            <p className="text-[13px] font-semibold text-muted-foreground">
              {t("workEquivalent", { cost: money(cashPrice) })}
            </p>
            <p className="text-[80px] font-extrabold leading-[1.05] tracking-[-0.06em] text-primary-ink">
              {Math.round(hours)}
              <span className="text-[22px] tracking-normal text-foreground"> {t("hoursUnit")}</span>
            </p>
          </div>
        </section>

        <section className={CARD}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-extrabold">
              {t("freeCashTitle", { month: monthName })}
            </h3>
            <span className={`rounded-full px-3 py-[5px] text-xs font-extrabold ${roomChip}`}>
              {t(`room.${room}`)}
            </span>
          </div>
          <div className="mt-3.5 flex min-h-[150px] flex-1 gap-[26px]">
            {[
              {
                label: t("before"),
                value: before.freeCash,
                color: "bg-c1",
                testId: "freecash-before",
              },
              {
                label: t("after"),
                value: after.freeCash,
                color: after.freeCash < 0 ? "bg-destructive" : "bg-c4",
                testId: "freecash-after",
              },
            ].map((bar) => (
              <div key={bar.testId} className="flex flex-1 flex-col items-center">
                <div className="relative w-full flex-1 overflow-hidden rounded-[20px] bg-muted">
                  <div
                    className={`absolute inset-x-0 bottom-0 rounded-[20px] transition-[height] duration-500 ${bar.color}`}
                    style={{ height: `${(Math.max(0, bar.value) / scale) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-bold text-muted-foreground">{bar.label}</p>
                <p data-testid={bar.testId} className="text-sm font-extrabold">
                  {money(bar.value)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className={CARD}>
          <h3 className="text-[15px] font-extrabold">{t("thirtyDayRule")}</h3>
          <div className="mt-2.5 flex items-center gap-4">
            <div className="relative h-24 w-24 flex-none">
              <svg
                width="96"
                height="96"
                viewBox="0 0 100 100"
                className="-rotate-90"
                aria-hidden="true"
              >
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--muted)" strokeWidth="11" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 * (1 - ringFraction)}
                  className="transition-[stroke-dashoffset] duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[19px] font-extrabold">
                {phase.phase === "none" ? "∞" : `${Math.round(ringFraction * 100)}%`}
              </div>
            </div>
            <p className="text-[12.5px] font-semibold leading-normal text-muted-foreground">
              <b className="text-foreground">{ruleText}</b>
              <br />
              {guardLine}
            </p>
          </div>
          {hasBreach && (
            <div data-testid="guard-breach-dialog" className="mt-3.5">
              <ul data-testid="guard-breaches" className="flex flex-col gap-1">
                {breaches.map((b) => (
                  <li
                    key={b.ruleId}
                    className="text-[12.5px] font-bold leading-normal text-destructive"
                  >
                    {t.has(`guard.${b.ruleId}`) ? t(`guard.${b.ruleId}`) : t("guard.unknown")}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-auto flex flex-col gap-2 pt-3.5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="press flex-[1_1_8rem] rounded-full bg-primary px-4 py-[13px] text-[13.5px] font-extrabold text-primary-foreground"
              >
                {hasBreach ? t("buyAnyway") : t("confirm")}
              </button>
              <button
                type="button"
                onClick={() => setShowInstallments((open) => !open)}
                className={`${SOFT_BTN} flex-[1_1_auto] px-4 py-[13px]`}
              >
                {t("calculateWithInstallments")}
              </button>
            </div>
            {onDecide && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onDecide("postponed")}
                  className={`${SOFT_BTN} flex-1 p-[11px]`}
                >
                  {t("postpone")}
                </button>
                <button
                  type="button"
                  onClick={() => onDecide("skipped")}
                  className={`${SOFT_BTN} flex-1 p-[11px] text-muted-foreground`}
                >
                  {t("skip")}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <Sheet open={confirming} onOpenChange={setConfirming}>
        {confirming && (
          <SheetContent
            title={t("sureTitle")}
            description={t("sureText", { name: item.name, amount: money(cashPrice) })}
          >
            {selectedOffer && (
              <div
                data-testid="installment-draft-state"
                className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] bg-muted px-4 py-3 text-[13px] font-bold"
              >
                <span>{t("installmentDraft", { months: selectedOffer.months })}</span>
                <button
                  type="button"
                  className={`${SOFT_BTN} bg-card px-4 py-[9px]`}
                  onClick={() => setSelectedOffer(null)}
                >
                  {t("payCashInstead")}
                </button>
              </div>
            )}
            {hasBreach && (
              <ul className="flex flex-col gap-1 rounded-[18px] bg-destructive/10 px-4 py-3">
                {breaches.map((b) => (
                  <li key={b.ruleId} className="text-[13px] font-bold text-destructive">
                    {t.has(`guard.${b.ruleId}`) ? t(`guard.${b.ruleId}`) : t("guard.unknown")}
                  </li>
                ))}
              </ul>
            )}
            {suggestedMonth !== undefined && (
              <div
                data-testid="suggested-month"
                className="flex flex-wrap items-center justify-between gap-2 text-[13px] font-bold"
              >
                <span>
                  {suggestedMonth
                    ? t("suggestedMonth", { month: formatMonth(suggestedMonth, locale) })
                    : t("suggestedNone")}
                </span>
                {suggestedMonth && suggestedMonth !== firstMonth && (
                  <button
                    type="button"
                    className={`${SOFT_BTN} px-4 py-[9px]`}
                    onClick={() => {
                      setPreviewMonth(suggestedMonth);
                      setShiftedMonth(null);
                    }}
                  >
                    {t("previewIn", { month: formatMonth(suggestedMonth, locale) })}
                  </button>
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
            {tip && !shiftedMonth && (
              <div
                data-testid="card-timing-tip"
                className="flex flex-wrap items-center justify-between gap-2 text-[13px] font-bold"
              >
                <span>
                  {t("cardTimingTip", {
                    days: tip.extraFloatDays,
                    month: formatMonth(tip.newDueMonth, locale),
                  })}
                </span>
                <button
                  type="button"
                  className={`${SOFT_BTN} px-4 py-[9px]`}
                  onClick={() => setShiftedMonth(tip.newDueMonth)}
                >
                  {t("accept")}
                </button>
              </div>
            )}
            <dl className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-1 text-[12.5px]">
              <dt className="text-muted-foreground">{t("wantsBeforeAfter")}</dt>
              <dd data-testid="wants-before" className="text-right">
                {money(before.byBucket.wants.committed)}
              </dd>
              <dd data-testid="wants-after" className="text-right font-extrabold">
                {money(after.byBucket.wants.committed)}
              </dd>
              <dt className="text-muted-foreground">{t("installmentLoadBeforeAfter")}</dt>
              <dd data-testid="installment-load-before" className="text-right">
                {money(before.installmentLoad)}
              </dd>
              <dd data-testid="installment-load-after" className="text-right font-extrabold">
                {money(after.installmentLoad)}
              </dd>
            </dl>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="press flex-1 rounded-full bg-muted p-[14px] text-[15px] font-bold"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  buy();
                }}
                className="press flex-1 rounded-full bg-primary p-[14px] text-[15px] font-extrabold text-primary-foreground"
              >
                {t("sureOk")}
              </button>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <Sheet open={showInstallments} onOpenChange={setShowInstallments}>
        {showInstallments && (
          <SheetContent title={item.name} className="md:max-w-3xl">
            <InstallmentCalculator
              cashPrice={cashPrice}
              annualInflation={profile.annualInflationExpectation}
              onSelect={(offer) => {
                setSelectedOffer(offer);
                setShowInstallments(false);
              }}
            />
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
