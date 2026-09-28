"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  costInWorkHours,
  costPerUse,
  eisenhowerQuadrant,
  scheduleQueue,
  type Commitment,
  type Month,
  type PlanStateInput,
  type Profile,
  type QueueItem,
} from "@stoafi/core";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { useMoney } from "@/lib/use-money";

const NO_COMMITMENTS: Commitment[] = [];

export interface QueueListProps {
  /** Controlled: the parent owns the items and persists changes. */
  items: QueueItem[];
  onItemsChange: (items: QueueItem[]) => void;
  onSelect?: (item: QueueItem) => void;
  onEdit?: (item: QueueItem) => void;
  onDelete?: (item: QueueItem) => void;
  profile: Profile;
  planState: PlanStateInput;
  today: string;
  startMonth: Month;
  /** Existing commitments (e.g. installments already taken); they use up bucket room. */
  commitments?: Commitment[];
  hourlyNetIncome: number;
}

/** Moves the item at `index` one slot earlier/later and renumbers `order`. */
function reorder(items: QueueItem[], index: number, direction: -1 | 1): QueueItem[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;

  const next = [...items];
  const [moved] = next.splice(index, 1);
  if (!moved) return items;
  next.splice(target, 0, moved);

  return next.map((item, i) => ({ ...item, order: i }));
}

export function QueueList({
  items,
  onItemsChange,
  onSelect,
  onEdit,
  onDelete,
  profile,
  planState,
  today,
  startMonth,
  commitments = NO_COMMITMENTS,
  hourlyNetIncome,
}: QueueListProps) {
  const t = useTranslations("queue");
  const tTimeline = useTranslations("timeline");
  const locale = useLocale() as Locale;
  const money = useMoney();
  const costInLifeEnergyLesson = getLessonCard("cost-in-life-energy", locale);
  const eisenhowerLesson = getLessonCard("eisenhower-matrix", locale);

  const schedule = useMemo(
    () => scheduleQueue(items, profile, planState, commitments, today, startMonth),
    [items, profile, planState, commitments, today, startMonth],
  );
  const scheduleByItemId = new Map(schedule.map((s) => [s.itemId, s.month]));

  return (
    <div>
      {costInLifeEnergyLesson && (
        <a
          href={`#lesson-${costInLifeEnergyLesson.id}`}
          aria-label={`${costInLifeEnergyLesson.id} lesson`}
          data-testid="lesson-link-cost-in-life-energy"
        >
          {costInLifeEnergyLesson.title}
        </a>
      )}
      {eisenhowerLesson && (
        <a
          href={`#lesson-${eisenhowerLesson.id}`}
          aria-label={`${eisenhowerLesson.id} lesson`}
          data-testid="lesson-link-eisenhower-matrix"
        >
          {eisenhowerLesson.title}
        </a>
      )}
      {items.length === 0 && <p>{t("empty")}</p>}
      <ul>
        {items.map((item, index) => {
          const quadrant = eisenhowerQuadrant(item);
          return (
            <li key={item.id} data-testid={`queue-item-${item.id}`}>
              {onSelect ? (
                <button type="button" onClick={() => onSelect(item)}>
                  {item.name}
                </button>
              ) : (
                <span>{item.name}</span>
              )}
              <span data-testid={`month-${item.id}`}>
                {scheduleByItemId.get(item.id) ?? tTimeline("notAffordableYet")}
              </span>
              <span>{quadrant.urgent ? t("urgent") : t("notUrgent")}</span>
              <span>{quadrant.important ? t("important") : t("notImportant")}</span>
              <span>
                {t("hoursSuffix", {
                  hours: costInWorkHours(item.price, hourlyNetIncome).toFixed(1),
                })}
              </span>
              <span>
                {t("perUseSuffix", {
                  amount: money(costPerUse(item.price, item.expectedUses)),
                })}
              </span>
              <button
                type="button"
                aria-label={t("moveUp", { name: item.name })}
                onClick={() => onItemsChange(reorder(items, index, -1))}
              >
                {t("moveUpLabel")}
              </button>
              <button
                type="button"
                aria-label={t("moveDown", { name: item.name })}
                onClick={() => onItemsChange(reorder(items, index, 1))}
              >
                {t("moveDownLabel")}
              </button>
              {onEdit && (
                <button type="button" onClick={() => onEdit(item)}>
                  {t("edit", { name: item.name })}
                </button>
              )}
              {onDelete && (
                <button type="button" onClick={() => onDelete(item)}>
                  {t("delete", { name: item.name })}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
