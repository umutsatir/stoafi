"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  limitAdvice,
  type FreeSpending,
  limitStatuses,
  type CategoryAmount,
  type LimitAdvice,
  type MonthProjection,
} from "@stoafi/core";
import { ProgressBar, type Tone } from "@/components/ui/progress-bar";
import { StatusChip } from "@/components/ui/status-chip";
import { useMoney } from "@/lib/use-money";
import { CategoryLines } from "./category-lines";
import { stagger } from "@/lib/utils";

const TONE: Record<"ok" | "tight" | "over", Tone> = {
  ok: "primary",
  tight: "warning",
  over: "danger",
};
const CHIP = { ok: "success", tight: "warning", over: "danger" } as const;

/** Where each kind of advice sends the user to act on it. */
const HREF: Record<Exclude<LimitAdvice["id"], "allGood">, string> = {
  needsOver: "/income-expenses",
  wantsOver: "/income-expenses",
  wantsRoom: "/queue",
  wantsSpare: "/queue",
  savingsToSet: "/sinking-funds",
  investingToSet: "/sinking-funds",
};

export interface LimitsPanelProps {
  projection: MonthProjection;
  /** How many waiting wants the queue already places in this month. */
  queueFits: number;
  /** What each bucket's committed money is for; shown as one short line under the bar. */
  categories?: CategoryAmount[];
  /** Money for everyday fun, shown between the bars and the advice. */
  spending?: FreeSpending;
  names?: Record<string, string>;
}

/** Each bucket's plan limit against what is already committed this month, and what to do about it. */
export function LimitsPanel({
  projection,
  queueFits,
  categories = [],
  spending,
  names,
}: LimitsPanelProps) {
  const t = useTranslations("home.limits");
  const money = useMoney();
  const statuses = limitStatuses(projection);
  const advice = limitAdvice(projection, queueFits);

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-4 sm:grid-cols-2">
        {statuses.map((s, i) => (
          <li
            key={s.bucket}
            data-testid={`limit-${s.bucket}`}
            style={stagger(i)}
            className="rise-in flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{t(`bucket.${s.bucket}`)}</span>
              <StatusChip tone={CHIP[s.state]}>
                <span data-testid={`limit-state-${s.bucket}`}>{t(`state.${s.state}`)}</span>
              </StatusChip>
            </div>
            <ProgressBar
              value={s.committed}
              max={s.limit}
              label={t("barLabel", { bucket: t(`bucket.${s.bucket}`) })}
              tone={TONE[s.state]}
            />
            <CategoryLines rows={categories} bucket={s.bucket} {...(names ? { names } : {})} />
            <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
              <span
                data-testid={`left-${s.bucket}`}
                className={s.state === "over" ? "font-semibold text-destructive" : "font-semibold"}
              >
                {s.state === "over"
                  ? t("overBy", { amount: money(s.overBy) })
                  : t("left", { amount: money(s.remaining) })}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("ofLimit")} <span data-testid={`plan-${s.bucket}`}>{money(s.limit)}</span>
              </span>
            </p>
          </li>
        ))}
      </ul>

      {spending && (
        <div className="flex flex-col gap-1 rounded-xl bg-muted/60 p-4" data-testid="free-spending">
          <h3 className="text-sm font-semibold">{t("spending.title")}</h3>
          <p className="text-2xl font-semibold" data-testid="free-spending-monthly">
            {money(spending.monthly)}
          </p>
          <p className="text-sm text-muted-foreground" data-testid="free-spending-spread">
            {t("spending.spread", { weekly: money(spending.weekly), daily: money(spending.daily) })}
          </p>
          <p className="text-xs text-muted-foreground">
            {spending.fixed ? t("spending.fixed") : t("spending.auto")}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3" data-testid="limit-advice">
        <h3 className="text-sm font-semibold">{t("whatToDo")}</h3>
        <ul className="flex flex-col gap-1.5 text-sm">
          {advice.map((a) => (
            <li key={a.id} data-testid={`advice-${a.id}`} className="flex flex-wrap gap-x-2">
              <AdviceText advice={a} />
              {a.id !== "allGood" && (
                <Link href={HREF[a.id]} className="font-medium text-primary hover:underline">
                  {t(`action.${a.id}`)}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AdviceText({ advice }: { advice: LimitAdvice }) {
  const t = useTranslations("home.limits.advice");
  const money = useMoney();
  if (advice.id === "allGood") return <span>{t("allGood")}</span>;
  const count = advice.id === "wantsRoom" ? advice.count : 0;
  return <span>{t(advice.id, { amount: money(advice.amount), count })}</span>;
}
