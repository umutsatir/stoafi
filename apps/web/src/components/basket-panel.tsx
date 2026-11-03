"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import {
  BASKET_TEMPLATES,
  BASKET_TEMPLATES_AS_OF,
  basketDone,
  basketDrift,
  basketInvestedIn,
  basketTotal,
  basketValues,
  catchUpSplit,
  isBasketComplete,
  splitByBasket,
  type BasketEntry,
  type BasketLogEntry,
  type BasketTemplate,
  type Holding,
  type Month,
} from "@stoafi/core";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { notifyUndo, useUndoLabel } from "@/components/ui/toaster";
import { holdingForTick } from "@/lib/basket-tick";
import { useMoney } from "@/lib/use-money";
import { cn, stagger } from "@/lib/utils";
import { MoneyInput } from "./money-input";

/** Slice colours in the design's order. */
const SLICE_COLORS = ["var(--c1)", "var(--c2)", "var(--c4)", "var(--c3)"];

export interface BasketPanelProps {
  basket: BasketEntry[];
  holdings: Holding[];
  currency: string;
  /** What the plan sets aside for investing this month; offered as the amount to split. */
  suggestedMonthly: number;
  /** The amount the user set to split each month, if they ever changed it. */
  savedMonthly?: number | null;
  onMonthlyChange?: (amount: number) => void;
  /** What was ticked off in each slice, and the month it counts for. */
  log?: BasketLogEntry[];
  month?: Month;
  /** Ticks a slice off (or takes the tick back) for this month, with the amount the split gave it. */
  onToggle?: (entry: BasketEntry, amount: number, done: boolean) => void;
  createId: () => string;
  onChange: (basket: BasketEntry[]) => void;
  /** Puts a holding into a basket slice (or takes it out with undefined). */
  onAssign: (holdingId: string, basketId: string | undefined) => void;
}

/** Decide how new investing money is shared across kinds of investment, and see how you stand against it. */
export function BasketPanel({
  basket,
  holdings,
  currency,
  suggestedMonthly,
  savedMonthly = null,
  onMonthlyChange,
  log = [],
  month,
  onToggle,
  createId,
  onChange,
  onAssign,
}: BasketPanelProps) {
  const t = useTranslations("investments.basket");
  const money = useMoney();
  const format = useFormatter();
  const undoLabel = useUndoLabel();
  const [choosing, setChoosing] = useState(basket.length === 0);
  const [monthly, setMonthlyState] = useState(savedMonthly ?? suggestedMonthly);
  const setMonthly = (amount: number) => {
    setMonthlyState(amount);
    onMonthlyChange?.(amount);
  };
  const [mode, setMode] = useState<"percent" | "catchUp">("catchUp");

  const total = basketTotal(basket);
  const complete = isBasketComplete(basket);
  const { values, unassigned } = basketValues(holdings, basket);
  const drift = basketDrift(basket, values);
  const hasValue = Object.values(values).some((v) => v > 0);
  const shares = complete
    ? mode === "catchUp" && hasValue
      ? catchUpSplit(monthly, basket, values)
      : splitByBasket(monthly, basket)
    : [];

  function patch(id: string, change: Partial<BasketEntry>) {
    onChange(basket.map((e) => (e.id === id ? { ...e, ...change } : e)));
  }

  function apply(template: BasketTemplate) {
    const previous = basket;
    onChange(
      template.entries.map((e) => ({
        id: createId(),
        label: t(`slice.${e.key}`),
        typeId: e.typeId,
        percent: e.percent,
      })),
    );
    setChoosing(false);
    if (previous.length > 0) {
      notifyUndo(t("replaced"), undoLabel, () => onChange(previous));
    }
  }

  const sliceColor = (i: number) => SLICE_COLORS[i % SLICE_COLORS.length];
  const CARD = "rounded-card bg-card px-8 py-7";
  const PILL =
    "press whitespace-nowrap rounded-full bg-muted px-4 py-[9px] text-[12.5px] font-extrabold";

  return (
    <section aria-label={t("title")} data-testid="basket" className="flex flex-col gap-4">
      <div className={`${CARD} pop-in px-[34px] py-[30px]`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{t("title")}</h2>
            <p className="mt-1 max-w-[640px] text-[13.5px] leading-[1.55] text-muted-foreground">
              {t("intro")}
            </p>
          </div>
          {basket.length > 0 && !choosing && (
            <button type="button" className={PILL} onClick={() => setChoosing(true)}>
              {t("startFromExample")}
            </button>
          )}
        </div>

        {choosing && (
          <div className="mt-[22px] flex flex-col gap-4" data-testid="basket-templates">
            <ul className="grid gap-3.5 md:grid-cols-3">
              {BASKET_TEMPLATES.map((template, i) => (
                <li
                  key={template.id}
                  style={stagger(i)}
                  className="pop-in flex flex-col rounded-[20px] bg-muted px-[22px] py-5 transition-[transform,translate,scale] duration-[350ms] [transition-timing-function:cubic-bezier(.3,1.6,.5,1)] hover:-translate-y-1.5"
                >
                  <p className="text-[19px] font-extrabold tracking-[-0.03em]">
                    {t(`template.${template.id}.name`)}
                  </p>
                  <p className="mt-1 min-h-10 text-[13px] leading-normal text-muted-foreground">
                    {t(`template.${template.id}.text`)}
                  </p>
                  <div
                    className="mt-3.5 flex h-3 gap-[3px] overflow-hidden rounded-xl"
                    aria-hidden="true"
                  >
                    {template.entries.map((e, k) => (
                      <div
                        key={e.key}
                        className="rounded-md"
                        style={{ width: `${e.percent}%`, background: sliceColor(k) }}
                      />
                    ))}
                  </div>
                  <ul className="mt-3 flex flex-col gap-[5px]">
                    {template.entries.map((e, k) => (
                      <li key={e.key} className="flex justify-between gap-2 text-[13px] font-bold">
                        <span className="flex items-center">
                          <span
                            aria-hidden="true"
                            className="mr-[7px] inline-block h-[9px] w-[9px] rounded-full"
                            style={{ background: sliceColor(k) }}
                          />
                          {t(`slice.${e.key}`)}
                        </span>
                        <span>{e.percent}%</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="press mt-[18px] rounded-full bg-primary p-3 text-[13.5px] font-extrabold text-primary-foreground"
                    onClick={() => apply(template)}
                    aria-label={t("useTemplate", { name: t(`template.${template.id}.name`) })}
                  >
                    {t("use")}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3.5">
              {basket.length === 0 && (
                <button
                  type="button"
                  className="press rounded-full bg-foreground px-5 py-[11px] text-[13px] font-extrabold text-background"
                  onClick={() => {
                    onChange([{ id: createId(), label: "", percent: 100 }]);
                    setChoosing(false);
                  }}
                >
                  {t("startEmpty")}
                </button>
              )}
              {basket.length > 0 && (
                <button
                  type="button"
                  className="press rounded-full bg-foreground px-5 py-[11px] text-[13px] font-extrabold text-background"
                  onClick={() => setChoosing(false)}
                >
                  {t("keepMine")}
                </button>
              )}
              <p
                className="text-xs leading-normal text-muted-foreground"
                data-testid="basket-source"
              >
                {t("sources", { asOf: BASKET_TEMPLATES_AS_OF })}
              </p>
            </div>
          </div>
        )}
      </div>

      {basket.length > 0 && (
        <>
          <div className="grid items-stretch gap-4 md:grid-cols-2">
            <div className={`${CARD} pop-in`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[19px] font-extrabold tracking-[-0.03em]">
                  {t("editorTitle")}
                </h3>
                <p
                  role="status"
                  data-testid="basket-total"
                  className={cn(
                    "rounded-full px-3.5 py-[7px] text-[12.5px] font-extrabold transition-all duration-300",
                    complete ? "bg-c4 text-on" : total > 100 ? "bg-c3 text-on" : "bg-c2 text-on",
                  )}
                >
                  {complete
                    ? t("totalOk")
                    : total < 100
                      ? t("totalLow", { total, missing: 100 - total })
                      : t("totalHigh", { total, extra: total - 100 })}
                </p>
              </div>
              <ul data-testid="basket-entries">
                {basket.map((entry, index) => {
                  const n = index + 1;
                  return (
                    <li
                      key={entry.id}
                      className="mt-3 flex items-center gap-2.5 [animation:slide_0.4s_backwards]"
                    >
                      <Input
                        className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-background px-3.5 py-[11px] text-[15px] font-bold"
                        aria-label={t("sliceName", { n })}
                        placeholder={t("slicePlaceholder")}
                        value={entry.label}
                        onChange={(e) => patch(entry.id, { label: e.target.value })}
                      />
                      <span className="flex items-center gap-1">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={100}
                          step={1}
                          className="w-[74px] rounded-2xl border-2 border-border bg-background px-3.5 py-[11px] text-right text-[15px] font-bold"
                          aria-label={t("slicePercent", { n })}
                          value={entry.percent}
                          onChange={(e) => {
                            const next = Math.round(Number(e.target.value));
                            patch(entry.id, {
                              percent: Number.isFinite(next) ? Math.min(100, Math.max(0, next)) : 0,
                            });
                          }}
                        />
                        <span aria-hidden="true" className="font-extrabold text-muted-foreground">
                          %
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={t("removeSlice", { n })}
                        title={t("removeSlice", { n })}
                        className="press flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full text-muted-foreground"
                        onClick={() => onChange(basket.filter((e) => e.id !== entry.id))}
                      >
                        <X className="h-[15px] w-[15px]" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex">
                <button
                  type="button"
                  className={PILL}
                  onClick={() => onChange([...basket, { id: createId(), label: "", percent: 0 }])}
                >
                  <span aria-hidden="true">+ </span>
                  {t("addSlice")}
                </button>
              </div>
              <div
                className="mt-[18px] h-2.5 overflow-hidden rounded-[10px] bg-muted"
                aria-hidden="true"
              >
                <div
                  className={cn(
                    "h-2.5 rounded-[10px] transition-[width,background-color] duration-[400ms]",
                    complete ? "bg-c4" : total > 100 ? "bg-c3" : "bg-c2",
                  )}
                  style={{ width: `${Math.min(100, total)}%` }}
                />
              </div>
            </div>

            {complete && hasValue ? (
              <div className={`${CARD} pop-in`} data-testid="basket-drift">
                <h3 className="text-[19px] font-extrabold tracking-[-0.03em]">
                  {t("whereYouAre")}
                </h3>
                <p className="mt-[3px] text-[12.5px] text-muted-foreground">
                  {t("whereYouAreHint")}
                </p>
                <ul>
                  {basket.map((entry, i) => {
                    const d = drift.find((x) => x.id === entry.id);
                    if (!d) return null;
                    const sign = d.difference > 0 ? "+" : "";
                    const name = entry.label || t("unnamed");
                    return (
                      <li key={entry.id} className="mt-[18px]" data-testid={`drift-${entry.id}`}>
                        <div className="flex justify-between gap-2 text-[14.5px] font-extrabold">
                          <span>{name}</span>
                          <span className="text-muted-foreground">
                            {t("driftLine", {
                              current: format.number(d.currentPercent, {
                                maximumFractionDigits: 1,
                              }),
                              target: format.number(d.targetPercent, { maximumFractionDigits: 1 }),
                              diff: `${sign}${format.number(d.difference, { maximumFractionDigits: 1 })}`,
                            })}
                          </span>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={t("driftBar", { name })}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.min(100, Math.round(d.currentPercent))}
                          className="relative mt-[9px] h-3.5 rounded-[14px] bg-muted"
                        >
                          <div
                            className="h-3.5 rounded-[14px] transition-[width] duration-500"
                            style={{
                              width: `${Math.min(100, d.currentPercent)}%`,
                              background: sliceColor(i),
                            }}
                          />
                          <div
                            aria-hidden="true"
                            className="absolute -bottom-1 -top-1 w-[3px] rounded-[3px] bg-foreground"
                            style={{ left: `${Math.min(100, d.targetPercent)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              !complete && (
                <div className="pop-in flex flex-col justify-center rounded-card bg-c3/20 px-8 py-7">
                  <h3 className="text-[19px] font-extrabold tracking-[-0.03em] text-destructive">
                    {t("invalidTitle")}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed">{t("invalidText")}</p>
                </div>
              )
            )}
          </div>

          <div
            className="grid items-stretch gap-4 md:grid-cols-[1.2fr_1fr]"
            data-testid="basket-split"
          >
            <div className={`${CARD} pop-in`}>
              <h3 className="text-[19px] font-extrabold tracking-[-0.03em]">{t("splitTitle")}</h3>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-[180px] flex-1">
                  <Field
                    label={t("monthlyAmount")}
                    htmlFor="basket-monthly"
                    hint={
                      suggestedMonthly > 0 || savedMonthly ? t("monthlyHint") : t("monthlyHintNone")
                    }
                  >
                    <MoneyInput
                      id="basket-monthly"
                      currency={currency}
                      value={monthly}
                      onChange={setMonthly}
                    />
                  </Field>
                </div>
                {hasValue && (
                  <SegmentedControl
                    label={t("mode.label")}
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: "catchUp", label: t("mode.catchUp") },
                      { value: "percent", label: t("mode.percent") },
                    ]}
                  />
                )}
              </div>
              {hasValue && (
                <p className="mt-2.5 text-[12.5px] leading-normal text-muted-foreground">
                  {t(`mode.${mode}Hint`)}
                </p>
              )}
              {complete ? (
                <>
                  {month && onToggle && (
                    <div className="mt-3 flex flex-col gap-1.5" data-testid="basket-progress">
                      <p className="text-[13px] font-bold">
                        {t("investedThisMonth", {
                          done: money(basketInvestedIn(log, month)),
                          total: money(monthly),
                        })}
                      </p>
                      <ProgressBar
                        value={basketInvestedIn(log, month)}
                        max={monthly}
                        label={t("investedBar")}
                        tone="success"
                      />
                    </div>
                  )}
                  <ul>
                    {basket.map((entry) => {
                      const share = shares.find((x) => x.id === entry.id);
                      const planned = share?.amount ?? 0;
                      const done = month ? basketDone(log, month, entry.id) : undefined;
                      const target = holdingForTick(holdings, basket, entry.id);
                      const name = entry.label || t("unnamed");
                      return (
                        <li
                          key={entry.id}
                          data-testid={`split-${entry.id}`}
                          className={cn(
                            "mt-2.5 flex items-center gap-3.5 rounded-[20px] px-4 py-3.5 transition-all duration-[350ms] [animation:slide_0.4s_backwards]",
                            done ? "bg-c4/25" : "bg-muted",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[15px] font-extrabold">{name}</div>
                            {onToggle && (
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {done
                                  ? t("recorded")
                                  : target
                                    ? t("willRecord", { name: target.label })
                                    : t("willLog")}
                              </div>
                            )}
                          </div>
                          <div className="text-[19px] font-extrabold tracking-[-0.03em]">
                            {money(done ? done.amount : planned)}
                          </div>
                          {onToggle && (
                            <button
                              type="button"
                              aria-pressed={done !== undefined}
                              aria-label={done ? t("undoDone", { name }) : t("markDone", { name })}
                              disabled={!done && planned <= 0}
                              onClick={() => onToggle(entry, planned, !done)}
                              className={cn(
                                "press flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-[9px] text-[12.5px] font-extrabold transition-all duration-300 disabled:opacity-50",
                                done ? "bg-c4 text-on" : "bg-primary text-primary-foreground",
                              )}
                            >
                              {done && (
                                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                              )}
                              {done ? t("doneUndo") : t("markDoneShort")}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">{t("finishFirst")}</p>
              )}
              <p className="mt-3 text-xs font-semibold text-muted-foreground">{t("notAdvice")}</p>
            </div>

            <div className={`${CARD} pop-in`} data-testid="basket-unassigned-card">
              <h3 className="text-[19px] font-extrabold tracking-[-0.03em]">
                {t("unassignedTitle")}
              </h3>
              <p className="mt-[3px] text-[12.5px] leading-normal text-muted-foreground">
                {t("unassignedHint")}
              </p>
              {unassigned.length > 0 ? (
                <ul data-testid="basket-unassigned">
                  {unassigned.map((h) => (
                    <li
                      key={h.id}
                      className="mt-3.5 flex items-center gap-3 border-t border-border pt-3.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold">
                        {h.label}
                      </span>
                      <select
                        aria-label={t("assignTo", { name: h.label })}
                        value=""
                        onChange={(e) => e.target.value && onAssign(h.id, e.target.value)}
                        className="h-9 rounded-full border-0 bg-muted px-3.5 text-[12.5px] font-extrabold"
                      >
                        <option value="">{t("choose")}</option>
                        {basket.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.label || t("unnamed")}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[13px] text-muted-foreground">{t("allAssigned")}</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
