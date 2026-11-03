"use client";

import { useTranslations } from "next-intl";
import { eisenhowerQuadrant, type QueueItem } from "@stoafi/core";
import { cn, stagger } from "@/lib/utils";
import { Money } from "@/components/ui/money";

const QUADRANTS = [
  { key: "doNow", urgent: true, important: true, tone: "bg-c3" },
  { key: "plan", urgent: false, important: true, tone: "bg-c4" },
  { key: "quick", urgent: true, important: false, tone: "bg-c2" },
  { key: "maybe", urgent: false, important: false, tone: "bg-c1" },
] as const;

export interface QueueEisenhowerProps {
  items: QueueItem[];
  selectedId?: string | null;
  onSelect: (item: QueueItem) => void;
}

/** The queue as the 2 by 2 urgent/important grid. Change an item's priority with Edit. */
export function QueueEisenhower({ items, selectedId = null, onSelect }: QueueEisenhowerProps) {
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
              "pop-in flex min-h-[200px] flex-col rounded-card px-7 py-6 text-on",
              q.tone,
            )}
          >
            <header>
              <h3 className="text-xl font-extrabold tracking-[-0.03em]">
                {t(`eisenhower.${q.key}.title`)}
              </h3>
              <p className="mb-2.5 text-[12.5px] font-semibold opacity-75">
                {t(`eisenhower.${q.key}.hint`)}
              </p>
            </header>
            {inQuadrant.length === 0 ? (
              <p className="mt-2 text-[13px] opacity-70">{t("eisenhower.none")}</p>
            ) : (
              <ul className="flex flex-col">
                {inQuadrant.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className={cn(
                        "mt-2 flex w-full items-center justify-between gap-2 rounded-[14px] px-3.5 py-2.5 text-left text-sm font-bold transition-[transform,translate,scale] duration-200 hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        item.id === selectedId ? "bg-white/55" : "bg-white/30",
                      )}
                    >
                      <span className="truncate">{item.name}</span>
                      <Money value={item.price} className="shrink-0" />
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
