"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Month } from "@stoafi/core";
import { Money } from "@/components/ui/money";
import { formatMonth } from "@/lib/format-month";
import { stagger } from "@/lib/utils";

export interface QueueSummaryProps {
  /** Cash price of everything waiting. */
  total: number;
  /** How many items fit in the current month. */
  fitsCount: number;
  /** The earliest-fitting item and the month it fits in, or null when nothing fits. */
  nearest: { name: string; month: Month } | null;
}

const CARD = "pop-in rounded-card bg-card px-[26px] py-5";
const LABEL = "text-[13px] font-bold text-muted-foreground";

export function QueueSummary({ total, fitsCount, nearest }: QueueSummaryProps) {
  const t = useTranslations("queue");
  const locale = useLocale();
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className={CARD} data-testid="summary-total">
        <p className={LABEL}>{t("summary.total")}</p>
        <p className="mt-0.5 text-[30px] font-extrabold tracking-[-0.05em]">
          <Money value={total} animated />
        </p>
      </div>
      <div className={CARD} style={stagger(1)} data-testid="summary-fits">
        <p className={LABEL}>{t("summary.fits")}</p>
        <p className="mt-0.5 text-[30px] font-extrabold tracking-[-0.05em]">
          {t("summary.fitsCount", { count: fitsCount })}
        </p>
      </div>
      <div className={CARD} style={stagger(2)} data-testid="summary-nearest">
        <p className={LABEL}>{t("summary.nearest")}</p>
        <p className="mt-2 text-[22px] font-extrabold tracking-[-0.04em]">
          {nearest
            ? `${nearest.name} · ${formatMonth(nearest.month, locale).slice(0, 3)}`
            : t("summary.none")}
        </p>
      </div>
    </div>
  );
}
