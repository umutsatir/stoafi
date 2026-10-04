"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Layers, Plus, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { notifyUndo, useUndoLabel } from "@/components/ui/toaster";
import { holdingForTick } from "@/lib/basket-tick";
import { useMoney } from "@/lib/use-money";
import { stagger } from "@/lib/utils";
import { MoneyInput } from "./money-input";

export interface BasketPanelProps {
  basket: BasketEntry[];
  holdings: Holding[];
  currency: string;
  /** What the plan sets aside for investing this month; offered as the amount to split. */
  suggestedMonthly: number;
  /** The amount the user set to split each month, if they ever changed it. */
  savedMonthly?: number | null;
  /** The emergency fund is short, so the plan invests nothing this month; the hint says why. */
  emergencyFirst?: boolean;
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
  emergencyFirst = false,
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

  return (
    <section
      aria-label={t("title")}
      data-testid="basket"
      className="rise-in flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("title")}
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">{t("intro")}</p>
        </div>
        {basket.length > 0 && !choosing && (
          <Button type="button" variant="outline" size="sm" onClick={() => setChoosing(true)}>
            {t("startFromExample")}
          </Button>
        )}
      </div>

      {choosing && (
        <div className="flex flex-col gap-3" data-testid="basket-templates">
          <ul className="grid gap-3 md:grid-cols-3">
            {BASKET_TEMPLATES.map((template, i) => (
              <li
                key={template.id}
                style={stagger(i)}
                className="rise-in flex flex-col gap-2 rounded-xl border border-border p-3"
              >
                <p className="font-semibold">{t(`template.${template.id}.name`)}</p>
                <p className="text-xs text-muted-foreground">{t(`template.${template.id}.text`)}</p>
                <ul className="flex flex-col gap-0.5 text-sm">
                  {template.entries.map((e) => (
                    <li key={e.key} className="flex justify-between gap-2">
                      <span>{t(`slice.${e.key}`)}</span>
                      <span className="font-medium">{e.percent}%</span>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  size="sm"
                  className="mt-auto"
                  onClick={() => apply(template)}
                  aria-label={t("useTemplate", { name: t(`template.${template.id}.name`) })}
                >
                  {t("use")}
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground" data-testid="basket-source">
            {t("sources", { asOf: BASKET_TEMPLATES_AS_OF })}
          </p>
          <div className="flex gap-2">
            {basket.length === 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange([{ id: createId(), label: "", percent: 100 }]);
                  setChoosing(false);
                }}
              >
                {t("startEmpty")}
              </Button>
            )}
            {basket.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setChoosing(false)}>
                {t("keepMine")}
              </Button>
            )}
          </div>
        </div>
      )}

      {basket.length > 0 && (
        <>
          <ul className="flex flex-col gap-2" data-testid="basket-entries">
            {basket.map((entry, index) => {
              const n = index + 1;
              return (
                <li key={entry.id} className="flex flex-wrap items-center gap-2">
                  <Input
                    className="w-full sm:w-56"
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
                      className="w-20"
                      aria-label={t("slicePercent", { n })}
                      value={entry.percent}
                      onChange={(e) => {
                        const next = Math.round(Number(e.target.value));
                        patch(entry.id, {
                          percent: Number.isFinite(next) ? Math.min(100, Math.max(0, next)) : 0,
                        });
                      }}
                    />
                    <span aria-hidden="true">%</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("removeSlice", { n })}
                    onClick={() => onChange(basket.filter((e) => e.id !== entry.id))}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange([...basket, { id: createId(), label: "", percent: 0 }])}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("addSlice")}
            </Button>
            <p
              role="status"
              data-testid="basket-total"
              className={
                complete ? "text-sm font-medium text-success" : "text-sm font-medium text-warning"
              }
            >
              {complete
                ? t("totalOk")
                : total < 100
                  ? t("totalLow", { total, missing: 100 - total })
                  : t("totalHigh", { total, extra: total - 100 })}
            </p>
          </div>

          {hasValue && (
            <div className="flex flex-col gap-2" data-testid="basket-drift">
              <h3 className="text-sm font-semibold">{t("whereYouAre")}</h3>
              <ul className="flex flex-col gap-2">
                {basket.map((entry) => {
                  const d = drift.find((x) => x.id === entry.id);
                  if (!d) return null;
                  const sign = d.difference > 0 ? "+" : "";
                  return (
                    <li
                      key={entry.id}
                      className="flex flex-col gap-1"
                      data-testid={`drift-${entry.id}`}
                    >
                      <div className="flex justify-between gap-2 text-sm">
                        <span>{entry.label || t("unnamed")}</span>
                        <span className="text-muted-foreground">
                          {t("driftLine", {
                            current: format.number(d.currentPercent, { maximumFractionDigits: 1 }),
                            target: format.number(d.targetPercent, { maximumFractionDigits: 1 }),
                            diff: `${sign}${format.number(d.difference, { maximumFractionDigits: 1 })}`,
                          })}
                        </span>
                      </div>
                      <ProgressBar
                        value={d.currentPercent}
                        max={Math.max(100, d.currentPercent)}
                        label={t("driftBar", { name: entry.label || t("unnamed") })}
                        tone={Math.abs(d.difference) >= 10 ? "warning" : "primary"}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {unassigned.length > 0 && (
            <div className="flex flex-col gap-2" data-testid="basket-unassigned">
              <h3 className="text-sm font-semibold">{t("unassignedTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("unassignedHint")}</p>
              <ul className="flex flex-col gap-2">
                {unassigned.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{h.label}</span>
                    <select
                      aria-label={t("assignTo", { name: h.label })}
                      value=""
                      onChange={(e) => e.target.value && onAssign(h.id, e.target.value)}
                      className="h-9 rounded-md border border-input bg-card px-2 text-sm"
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
            </div>
          )}

          <div
            className="flex flex-col gap-3 border-t border-border pt-4"
            data-testid="basket-split"
          >
            <h3 className="text-sm font-semibold">{t("splitTitle")}</h3>
            <Field
              label={t("monthlyAmount")}
              htmlFor="basket-monthly"
              hint={
                suggestedMonthly > 0 || savedMonthly
                  ? t("monthlyHint")
                  : emergencyFirst
                    ? t("monthlyHintEmergency")
                    : t("monthlyHintNone")
              }
            >
              <MoneyInput
                id="basket-monthly"
                currency={currency}
                value={monthly}
                onChange={setMonthly}
              />
            </Field>
            {hasValue && (
              <div className="flex flex-col gap-1">
                <SegmentedControl
                  label={t("mode.label")}
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "catchUp", label: t("mode.catchUp") },
                    { value: "percent", label: t("mode.percent") },
                  ]}
                />
                <p className="text-xs text-muted-foreground">{t(`mode.${mode}Hint`)}</p>
              </div>
            )}
            {complete ? (
              <>
                {month && onToggle && (
                  <div className="flex flex-col gap-1" data-testid="basket-progress">
                    <p className="text-sm">
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
                <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
                  {basket.map((entry) => {
                    const share = shares.find((s) => s.id === entry.id);
                    const planned = share?.amount ?? 0;
                    const done = month ? basketDone(log, month, entry.id) : undefined;
                    const target = holdingForTick(holdings, basket, entry.id);
                    return (
                      <li
                        key={entry.id}
                        data-testid={`split-${entry.id}`}
                        className="flex flex-col gap-1 p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{entry.label || t("unnamed")}</span>
                          <span className="font-semibold">
                            {money(done ? done.amount : planned)}
                          </span>
                          {onToggle && (
                            <Button
                              type="button"
                              size="sm"
                              variant={done ? "outline" : "default"}
                              aria-pressed={done !== undefined}
                              aria-label={
                                done
                                  ? t("undoDone", { name: entry.label || t("unnamed") })
                                  : t("markDone", { name: entry.label || t("unnamed") })
                              }
                              disabled={!done && planned <= 0}
                              onClick={() => onToggle(entry, planned, !done)}
                            >
                              {done ? t("doneUndo") : t("markDoneShort")}
                            </Button>
                          )}
                        </div>
                        {onToggle && (
                          <p className="text-xs text-muted-foreground">
                            {done
                              ? t("recorded")
                              : target
                                ? t("willRecord", { name: target.label })
                                : t("willLog")}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("finishFirst")}</p>
            )}
            <p className="text-xs text-muted-foreground">{t("notAdvice")}</p>
          </div>
        </>
      )}
    </section>
  );
}
