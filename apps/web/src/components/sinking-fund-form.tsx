"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { MonthSchema, type Month, type SinkingFund } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MoneyInput } from "./money-input";

export interface SinkingFundFormProps {
  /** Present when editing; absent when adding. */
  initial?: SinkingFund;
  createId: () => string;
  currency?: string;
  /** Pre-fills nothing; only used so the month picker opens near today. */
  currentMonth?: Month;
  onSubmit: (fund: SinkingFund) => void;
  onCancel?: () => void;
  /** Only the form, without its own card and title (for use inside a panel that has them). */
  bare?: boolean;
}

type FieldError = "name" | "target" | "due" | null;

export function SinkingFundForm({
  initial,
  createId,
  currency = "TRY",
  currentMonth,
  onSubmit,
  onCancel,
  bare = false,
}: SinkingFundFormProps) {
  const t = useTranslations("sinkingFunds");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [target, setTarget] = useState(initial?.target ?? 0);
  // A pot is either aimed at an amount by a month, or open: it just keeps growing.
  const [mode, setMode] = useState<"goal" | "open">(initial && !initial.dueMonth ? "open" : "goal");
  const [dueMonth, setDueMonth] = useState<string>(initial?.dueMonth ?? "");
  const [saved, setSaved] = useState(initial?.currentBalance ?? 0);
  const [error, setError] = useState<FieldError>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = label.trim();
    if (trimmed === "") return setError("name");
    const open = mode === "open";
    if (!open && target <= 0) return setError("target");
    const due = MonthSchema.safeParse(dueMonth);
    if (!open && !due.success) return setError("due");
    setError(null);

    // Keep what the form does not edit: the deposit log, icon and colour. An open pot has no date.
    const kept: Partial<SinkingFund> = { ...initial };
    delete kept.dueMonth;
    onSubmit({
      ...kept,
      id: initial?.id ?? createId(),
      label: trimmed,
      target: open ? 0 : target,
      ...(!open && due.success ? { dueMonth: due.data } : {}),
      currentBalance: saved,
    });
    if (!initial) {
      setLabel("");
      setTarget(0);
      setDueMonth("");
      setSaved(0);
    }
  }

  const title = initial ? t("editTitle") : t("addTitle");

  const formElement = (
    <form onSubmit={handleSubmit} aria-label={title} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <SegmentedControl
          label={t("modeLabel")}
          value={mode}
          onChange={setMode}
          options={[
            { value: "goal", label: t("modeGoal") },
            { value: "open", label: t("modeOpen") },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          {mode === "goal" ? t("modeGoalHint") : t("modeOpenHint")}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("name")}
          htmlFor="fund-name"
          hint={t("nameHint")}
          error={error === "name" ? t("nameRequired") : undefined}
        >
          <Input
            id="fund-name"
            type="text"
            value={label}
            aria-invalid={error === "name" ? "true" : undefined}
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>
        {mode === "goal" && (
          <Field
            label={t("dueMonth")}
            htmlFor="fund-due"
            error={error === "due" ? t("dueRequired") : undefined}
          >
            <Input
              id="fund-due"
              type="month"
              min={currentMonth}
              value={dueMonth}
              aria-invalid={error === "due" ? "true" : undefined}
              onChange={(e) => setDueMonth(e.target.value)}
            />
          </Field>
        )}
        {mode === "goal" && (
          <Field
            label={t("target")}
            htmlFor="fund-target"
            error={error === "target" ? t("targetRequired") : undefined}
          >
            <MoneyInput id="fund-target" currency={currency} value={target} onChange={setTarget} />
          </Field>
        )}
        {!initial?.deposits?.length && (
          <Field label={t("saved")} htmlFor="fund-saved" hint={t("savedHint")}>
            <MoneyInput id="fund-saved" currency={currency} value={saved} onChange={setSaved} />
          </Field>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit">{initial ? t("saveChanges") : t("add")}</Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
      </div>
    </form>
  );

  if (bare) return formElement;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{formElement}</CardContent>
    </Card>
  );
}
