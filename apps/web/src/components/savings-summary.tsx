"use client";

import { useTranslations } from "next-intl";
import type { SavingsAdvice } from "@stoafi/core";
import { Money } from "@/components/ui/money";
import { StatCard } from "@/components/ui/stat-card";
import { useMoney } from "@/lib/use-money";
import { cn, stagger } from "@/lib/utils";

export interface SavingsSummaryProps {
  advice: SavingsAdvice;
  /** Money left this month before any saving. */
  freeBeforeSaving: number;
  /** Pot names by id, for the suggested split. */
  potNames: Record<string, string>;
}

/** This month's saving picture: what is left, what to set aside, what went in, what stays free. */
export function SavingsSummary({ advice, freeBeforeSaving, potNames }: SavingsSummaryProps) {
  const t = useTranslations("savings.summary");
  const money = useMoney();
  const total = Math.max(freeBeforeSaving, advice.required, advice.deposited, 1);
  const deposited = Math.min(advice.deposited, total);
  const still = Math.min(advice.stillToSet, total - deposited);
  const free = Math.max(0, total - deposited - still);
  const part = (value: number) => ({ width: `${(value / total) * 100}%` });

  return (
    <section aria-label={t("title")} className="flex flex-col gap-4" data-testid="savings-summary">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { key: "left", value: freeBeforeSaving },
          { key: "toSet", value: advice.required },
          { key: "added", value: advice.deposited },
          { key: "free", value: advice.freeAfter },
        ].map((item, i) => (
          <StatCard
            key={item.key}
            className="rise-in"
            style={stagger(i)}
            label={t(item.key)}
            value={<Money value={item.value} animated />}
            testId={`summary-${item.key}`}
          />
        ))}
      </div>
      <div
        role="img"
        aria-label={t("barLabel", {
          added: money(advice.deposited),
          still: money(advice.stillToSet),
          free: money(advice.freeAfter),
        })}
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className="bg-success transition-[width] duration-700" style={part(deposited)} />
        <div className="bg-primary/60 transition-[width] duration-700" style={part(still)} />
        <div className={cn("transition-[width] duration-700")} style={part(free)} />
      </div>
      <p className="text-sm" data-testid="savings-sentence">
        {advice.stillToSet > 0
          ? t("sentenceMore", { more: money(advice.stillToSet), free: money(advice.freeAfter) })
          : t("sentenceDone", { free: money(advice.freeAfter) })}
      </p>
      {advice.suggestedSplit.length > 0 && advice.stillToSet > 0 && (
        <ul className="flex flex-wrap gap-2 text-sm text-muted-foreground" data-testid="split">
          {advice.suggestedSplit.map((part) => (
            <li
              key={part.id}
              className="rounded-full bg-muted px-3 py-1"
              data-testid={`split-${part.id}`}
            >
              {t(`split.${part.id === "emergency" || part.id === "unassigned" ? part.id : "pot"}`, {
                amount: money(part.amount),
                name: potNames[part.id] ?? part.id,
              })}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
