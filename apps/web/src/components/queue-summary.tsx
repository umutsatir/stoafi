"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Month } from "@stoafi/core";
import { Money } from "@/components/ui/money";
import { StatCard } from "@/components/ui/stat-card";
import { formatMonth } from "@/lib/format-month";
import { stagger } from "@/lib/utils";

export interface QueueSummaryProps {
  /** Cash price of everything waiting. */
  total: number;
  /** Cash price of what fits in the current month. */
  fitsThisMonth: number;
  /** The earliest month something fits, or null when nothing does. */
  nearestMonth: Month | null;
}

export function QueueSummary({ total, fitsThisMonth, nearestMonth }: QueueSummaryProps) {
  const t = useTranslations("queue");
  const locale = useLocale();
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label={t("summary.total")}
        value={<Money value={total} animated />}
        testId="summary-total"
      />
      <StatCard
        className="rise-in"
        style={stagger(1)}
        label={t("summary.fits")}
        value={<Money value={fitsThisMonth} animated />}
        testId="summary-fits"
      />
      <StatCard
        className="rise-in"
        style={stagger(2)}
        label={t("summary.nearest")}
        value={nearestMonth ? formatMonth(nearestMonth, locale) : t("summary.none")}
        testId="summary-nearest"
      />
    </div>
  );
}
