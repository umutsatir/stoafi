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

const CARD = "pop-in min-w-0 rounded-card bg-card px-5 py-4 sm:px-[26px] sm:py-5";
const LABEL = "text-[13px] font-bold text-muted-foreground";

export function QueueSummary({ total, fitsCount, nearest }: QueueSummaryProps) {
  const t = useTranslations("queue");
  const locale = useLocale();
  return (
    <div className="grid gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-4">
      <div className={`${CARD} min-[360px]:col-span-2 sm:col-span-1`} data-testid="summary-total">
        <p className={LABEL}>{t("summary.total")}</p>
        <p className="mt-0.5 text-[30px] font-extrabold tracking-[-0.05em]">
          <Money value={total} animated />
        </p>
      </div>
      <div className={CARD} style={stagger(1)} data-testid="summary-fits">
        <p className={LABEL}>{t("summary.fits")}</p>
        <p className="mt-0.5 text-[24px] font-extrabold tracking-[-0.05em] sm:text-[30px]">
          {t("summary.fitsCount", { count: fitsCount })}
        </p>
      </div>
      <div className={CARD} style={stagger(2)} data-testid="summary-nearest">
        <p className={LABEL}>{t("summary.nearest")}</p>
        <p className="mt-1 text-[18px] font-extrabold leading-tight tracking-[-0.04em] break-words sm:mt-2 sm:text-[22px]">
          {nearest
            ? `${nearest.name} · ${formatMonth(nearest.month, locale).slice(0, 3)}`
            : t("summary.none")}
        </p>
      </div>
    </div>
  );
}
