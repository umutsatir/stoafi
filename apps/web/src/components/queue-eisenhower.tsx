"use client";

import { useTranslations } from "next-intl";
import { eisenhowerQuadrant, type QueueItem } from "@stoafi/core";
import { cn, stagger } from "@/lib/utils";
import { Money } from "@/components/ui/money";

const QUADRANTS = [
  { key: "doNow", urgent: true, important: true, tone: "border-destructive/40" },
  { key: "plan", urgent: false, important: true, tone: "border-info/40" },
  { key: "quick", urgent: true, important: false, tone: "border-warning/40" },
  { key: "maybe", urgent: false, important: false, tone: "border-border" },
] as const;

export interface QueueEisenhowerProps {
  items: QueueItem[];
  onSelect: (item: QueueItem) => void;
}

/** The queue as the 2 by 2 urgent/important grid. Change an item's priority with Edit. */
export function QueueEisenhower({ items, onSelect }: QueueEisenhowerProps) {
  const t = useTranslations("queue");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {QUADRANTS.map((q, quadrantIndex) => {
        const inQuadrant = items.filter((item) => {
          const position = eisenhowerQuadrant(item);
          return position.urgent === q.urgent && position.important === q.important;
        });
        return (
          <section
            key={q.key}
            aria-label={t(`eisenhower.${q.key}.title`)}
            data-testid={`quadrant-${q.key}`}
            style={stagger(quadrantIndex)}
            className={cn(
              "rise-in flex min-h-32 flex-col gap-2 rounded-xl border-2 bg-card p-4",
              q.tone,
            )}
          >
            <header>
              <h3 className="font-semibold">{t(`eisenhower.${q.key}.title`)}</h3>
              <p className="text-xs text-muted-foreground">{t(`eisenhower.${q.key}.hint`)}</p>
            </header>
            {inQuadrant.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("eisenhower.none")}</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {inQuadrant.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="truncate font-medium">{item.name}</span>
                      <Money value={item.price} className="shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
