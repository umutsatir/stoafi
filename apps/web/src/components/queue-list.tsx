"use client";

import { useMemo, useState } from "react";
import {
  costInWorkHours,
  costPerUse,
  eisenhowerQuadrant,
  scheduleQueue,
  type Month,
  type PlanStateInput,
  type Profile,
  type QueueItem,
} from "@stoafi/core";

export interface QueueListProps {
  items: QueueItem[];
  profile: Profile;
  planState: PlanStateInput;
  today: string;
  startMonth: Month;
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
  items: initialItems,
  profile,
  planState,
  today,
  startMonth,
  hourlyNetIncome,
}: QueueListProps) {
  const [items, setItems] = useState(initialItems);

  const schedule = useMemo(
    () => scheduleQueue(items, profile, planState, [], today, startMonth),
    [items, profile, planState, today, startMonth],
  );
  const scheduleByItemId = new Map(schedule.map((s) => [s.itemId, s.month]));

  return (
    <ul>
      {items.map((item, index) => {
        const quadrant = eisenhowerQuadrant(item);
        return (
          <li key={item.id} data-testid={`queue-item-${item.id}`}>
            <span>{item.name}</span>
            <span data-testid={`month-${item.id}`}>
              {scheduleByItemId.get(item.id) ?? "not affordable yet"}
            </span>
            <span>{quadrant.urgent ? "urgent" : "not urgent"}</span>
            <span>{quadrant.important ? "important" : "not important"}</span>
            <span>{costInWorkHours(item.price, hourlyNetIncome).toFixed(1)}h</span>
            <span>{costPerUse(item.price, item.expectedUses).toFixed(2)}/use</span>
            <button
              type="button"
              aria-label={`Move ${item.name} up`}
              onClick={() => setItems((prev) => reorder(prev, index, -1))}
            >
              Move up
            </button>
            <button
              type="button"
              aria-label={`Move ${item.name} down`}
              onClick={() => setItems((prev) => reorder(prev, index, 1))}
            >
              Move down
            </button>
          </li>
        );
      })}
    </ul>
  );
}
