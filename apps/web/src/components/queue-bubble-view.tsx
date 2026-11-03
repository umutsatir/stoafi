"use client";

import { useLocale } from "next-intl";
import type { Month, QueueItem } from "@stoafi/core";
import { formatMonth } from "@/lib/format-month";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface QueueBubbleViewProps {
  items: QueueItem[];
  /** Twelve months starting now, with what is left free in each. */
  months: { month: Month; left: number }[];
  /** The month each item first fits in; null when it fits in none of the horizon. */
  monthByItemId: Map<string, Month | null>;
  selectedId: string | null;
  onSelect: (item: QueueItem) => void;
}

const COLUMN = 93;
const BAR_AREA = 170;

/** The 12-month timeline: a bar per month for what is free, and a bubble per item sitting on its month. */
export function QueueBubbleView({
  items,
  months,
  monthByItemId,
  selectedId,
  onSelect,
}: QueueBubbleViewProps) {
  const locale = useLocale();
  const t = useTranslations("queue.bubbles");
  const max = Math.max(1, ...months.map((m) => m.left));
  const monthIndex = new Map(months.map((m, i) => [m.month, i]));
  const stacked: Record<number, number> = {};
  const placements = items.map((item, rank) => {
    const month = monthByItemId.get(item.id);
    const col = month ? (monthIndex.get(month) ?? months.length - 1) : months.length - 1;
    const size = Math.min(106, 52 + (item.price / 42_000_00) * 54);
    const barHeight = (Math.max(0, months[col]?.left ?? 0) / max) * BAR_AREA;
    const offset = stacked[col] ?? 0;
    stacked[col] = offset + size + 30;
    return { item, rank, col, size, bottom: barHeight + 22 + offset };
  });
  // Taller than 340px only when bubbles pile up on one month, so nothing is cut off at the top.
  const height = Math.max(340, ...placements.map((p) => p.bottom + p.size * 1.2 + 44));
  const selectedMonth = (() => {
    const sel = items.find((i) => i.id === selectedId);
    const m = sel ? monthByItemId.get(sel.id) : null;
    return m ? (monthIndex.get(m) ?? -1) : -1;
  })();

  return (
    <div className="pop-in overflow-x-auto rounded-card bg-card px-7 pb-3.5 pt-[26px]">
      <h3 className="mb-0.5 text-lg font-extrabold tracking-[-0.03em]">{t("title")}</h3>
      <p className="mb-1.5 text-[12.5px] text-muted-foreground">{t("hint")}</p>
      <div className="relative" style={{ width: COLUMN * months.length, height }}>
        <div className="absolute inset-x-0 bottom-0 flex h-[200px] items-end">
          {months.map((m, i) => (
            <div
              key={m.month}
              className="flex h-[200px] items-end justify-center"
              style={{ width: COLUMN }}
            >
              <div
                aria-hidden="true"
                className={cn(
                  "w-[54px] rounded-t-[18px] rounded-b-lg transition-[background-color,box-shadow] duration-[250ms]",
                  selectedMonth === i ? "bg-c1 shadow-[0_0_0_3px_var(--foreground)]" : "bg-muted",
                )}
                style={{ height: Math.max(4, (Math.max(0, m.left) / max) * BAR_AREA) }}
              />
            </div>
          ))}
        </div>
        {placements.map(({ item, rank, col, size, bottom }) => {
          const on = item.id === selectedId;
          return (
            <div key={item.id}>
              <div
                className="absolute z-[1] [animation:float_4.2s_ease-in-out_infinite]"
                style={{
                  left: col * COLUMN + COLUMN / 2 - size / 2,
                  bottom,
                  width: size,
                  height: size,
                  animationDelay: `${rank * 0.6}s`,
                  zIndex: on ? 3 : 1,
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  aria-label={item.name}
                  aria-pressed={on}
                  className={cn(
                    "flex h-full w-full items-center justify-center rounded-full text-[19px] font-extrabold text-on transition-[transform,translate,scale,box-shadow] duration-[400ms] [transition-timing-function:cubic-bezier(.3,1.7,.5,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    item.isNeed ? "bg-c4" : item.installmentPurchase ? "bg-c3" : "bg-c2",
                    on
                      ? "scale-[1.18] shadow-[0_0_0_5px_var(--card),0_0_0_8px_var(--foreground)]"
                      : "shadow-[0_6px_16px_rgb(0_0_0/0.12)]",
                  )}
                >
                  {rank + 1}
                </button>
              </div>
              <div
                className="pointer-events-none absolute z-[1] w-[90px] text-center text-[11.5px] font-bold leading-tight"
                style={{
                  left: col * COLUMN + 1,
                  bottom: bottom + size * (on ? 1.09 : 1) + 10,
                  zIndex: on ? 3 : 1,
                }}
              >
                {item.name}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex" style={{ width: COLUMN * months.length }}>
        {months.map((m) => (
          <div
            key={m.month}
            className="text-center text-xs font-bold text-muted-foreground"
            style={{ width: COLUMN }}
          >
            {formatMonth(m.month, locale).slice(0, 3)}
          </div>
        ))}
      </div>
    </div>
  );
}
