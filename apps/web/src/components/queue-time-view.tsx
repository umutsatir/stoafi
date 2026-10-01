"use client";

import { useLocale, useTranslations } from "next-intl";
import { cooldownStatus, type Month, type QueueItem } from "@stoafi/core";
import { Money } from "@/components/ui/money";
import { StatusChip } from "@/components/ui/status-chip";
import { formatMonth } from "@/lib/format-month";
import { stagger } from "@/lib/utils";

export interface QueueTimeViewProps {
  items: QueueItem[];
  /** The month each item first fits in; null when it fits in none of the horizon. */
  monthByItemId: Map<string, Month | null>;
  today: string;
  onSelect: (item: QueueItem) => void;
}

function ItemButton({ item, onSelect }: { item: QueueItem; onSelect: (item: QueueItem) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="truncate font-medium">{item.name}</span>
      <Money value={item.price} className="shrink-0 text-muted-foreground" />
    </button>
  );
}

/** Items grouped under the month they fit in, then those still cooling down or not affordable. */
export function QueueTimeView({ items, monthByItemId, today, onSelect }: QueueTimeViewProps) {
  const t = useTranslations("queue");
  const locale = useLocale();

  const cooling: { item: QueueItem; endsOn: string }[] = [];
  const unaffordable: QueueItem[] = [];
  const byMonth = new Map<Month, QueueItem[]>();
  for (const item of items) {
    const cooldown = item.isNeed ? null : cooldownStatus(item, today);
    const month = monthByItemId.get(item.id) ?? null;
    if (cooldown?.active) cooling.push({ item, endsOn: cooldown.endsOn });
    else if (month) byMonth.set(month, [...(byMonth.get(month) ?? []), item]);
    else unaffordable.push(item);
  }
  const months = [...byMonth.keys()].sort();

  return (
    <div className="flex flex-col gap-4" data-testid="time-view">
      {months.map((month, monthIndex) => {
        const group = byMonth.get(month) ?? [];
        return (
          <section
            key={month}
            data-testid={`time-month-${month}`}
            style={stagger(monthIndex)}
            className="rise-in flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
          >
            <h3 className="flex items-center gap-2 font-semibold">
              {formatMonth(month, locale)}
              <StatusChip tone="success">{t("time.items", { count: group.length })}</StatusChip>
            </h3>
            <ul className="flex flex-col gap-1.5">
              {group.map((item) => (
                <li key={item.id}>
                  <ItemButton item={item} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {cooling.length > 0 && (
        <section
          data-testid="time-cooling"
          className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-4"
        >
          <h3 className="font-semibold">{t("time.cooling")}</h3>
          <ul className="flex flex-col gap-1.5">
            {cooling.map(({ item, endsOn }) => (
              <li key={item.id} className="flex flex-col gap-1">
                <ItemButton item={item} onSelect={onSelect} />
                <span
                  data-testid={`cooldown-${item.id}`}
                  className="px-1 text-xs text-muted-foreground"
                >
                  {t("time.coolingUntil", { date: endsOn })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {unaffordable.length > 0 && (
        <section
          data-testid="time-unaffordable"
          className="flex flex-col gap-2 rounded-xl border border-dashed border-warning/50 p-4"
        >
          <h3 className="font-semibold">{t("time.unaffordable")}</h3>
          <p className="text-xs text-muted-foreground">{t("time.unaffordableHint")}</p>
          <ul className="flex flex-col gap-1.5">
            {unaffordable.map((item) => (
              <li key={item.id}>
                <ItemButton item={item} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
