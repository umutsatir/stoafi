"use client";

import { useTranslations } from "next-intl";
import {
  committedByCategory,
  currentAllocation,
  netMonthlyIncome,
  project,
  strategyRegistry,
  type Bucket,
  type Commitment,
  type Month,
  type PlanStateInput,
  type Profile,
  type QueueItem,
  type SinkingFund,
} from "@stoafi/core";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { useLocale } from "next-intl";
import { InfoPopover } from "@/components/ui/info-popover";
import { Money } from "@/components/ui/money";
import { ProgressBar, type Tone } from "@/components/ui/progress-bar";
import { stagger } from "@/lib/utils";
import { CategoryLines } from "./category-lines";
import { InstallmentRoom } from "./installment-room";
import { LessonPanelLink } from "./lesson-panel";

export interface PlanUsageProps {
  profile: Profile;
  planState: PlanStateInput;
  ledger: Commitment[];
  month: Month;
  /** Names for queue purchases and pots, so their lines in the breakdown read as names. */
  queueItems?: QueueItem[];
  sinkingFunds?: SinkingFund[];
  /** When given, the page also shows how much installment room is left under this cap. */
  installmentCapPct?: number;
}

const BUCKET_LIST: Bucket[] = ["needs", "wants", "savings", "investing"];

function tone(committed: number, limit: number): Tone {
  if (limit <= 0) return committed > 0 ? "danger" : "primary";
  if (committed > limit) return "danger";
  return committed / limit > 0.85 ? "warning" : "primary";
}

/** The active plan and how much of each bucket this month's commitments already use. */
export function PlanUsage({
  profile,
  planState,
  ledger,
  month,
  queueItems = [],
  sinkingFunds = [],
  installmentCapPct,
}: PlanUsageProps) {
  const t = useTranslations("plan.usage");
  const locale = useLocale() as Locale;
  const strategy = strategyRegistry[planState.strategyId];
  const limits = currentAllocation(profile, planState, strategyRegistry, month);
  const projection = project({ income: netMonthlyIncome(profile) }, ledger, month, {
    bucketLimits: limits,
  });
  const categories = committedByCategory(profile, ledger, month);
  const names = {
    ...Object.fromEntries(queueItems.map((i) => [i.id, i.name])),
    ...Object.fromEntries(sinkingFunds.map((f) => [f.id, f.label])),
  };
  const title = strategy ? getLessonCard(strategy.lessonId, locale)?.title : undefined;

  return (
    <section
      aria-label={t("title")}
      data-testid="plan-usage"
      className="rise-in flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div>
        <p className="text-sm text-muted-foreground">{t("title")}</p>
        <p className="text-title font-semibold" data-testid="active-plan-name">
          {title ?? planState.strategyId}
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {BUCKET_LIST.map((bucket, i) => {
          const { committed, limit } = projection.byBucket[bucket];
          return (
            <li key={bucket} style={stagger(i)} className="rise-in flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-1 font-medium">
                  {t(`bucket.${bucket}`)}
                  <InfoPopover label={t("infoLabel", { bucket: t(`bucket.${bucket}`) })}>
                    {t(`info.${bucket}`)}
                  </InfoPopover>
                </span>
                <span className="text-muted-foreground" data-testid={`usage-${bucket}`}>
                  <Money value={committed} /> / <Money value={limit} />
                </span>
              </div>
              <ProgressBar
                value={committed}
                max={limit}
                label={t("barLabel", { bucket: t(`bucket.${bucket}`) })}
                tone={tone(committed, limit)}
              />
              <CategoryLines rows={categories} bucket={bucket} names={names} detailed />
              {bucket === "investing" && limit > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("investingWhere")}{" "}
                  <LessonPanelLink
                    lessonId="index-funds"
                    testId="lesson-link-investing-bucket"
                    className="text-xs"
                  >
                    {t("learnInvesting")}
                  </LessonPanelLink>
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {installmentCapPct !== undefined && (
        <div
          className="flex flex-col gap-2 border-t border-border pt-4"
          data-testid="plan-installment-room"
        >
          <h3 className="text-sm font-semibold">{t("installmentRoomTitle")}</h3>
          <InstallmentRoom
            income={netMonthlyIncome(profile)}
            capPct={installmentCapPct}
            used={projection.installmentLoad}
          />
        </div>
      )}
    </section>
  );
}
