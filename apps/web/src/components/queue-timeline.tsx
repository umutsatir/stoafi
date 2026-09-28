"use client";

import { useTranslations } from "next-intl";
import {
  cooldownStatus,
  scheduleQueue,
  type Commitment,
  type Month,
  type PlanStateInput,
  type Profile,
  type QueueItem,
} from "@stoafi/core";

const NO_COMMITMENTS: Commitment[] = [];

export interface QueueTimelineProps {
  items: QueueItem[];
  profile: Profile;
  planState: PlanStateInput;
  today: string;
  startMonth: Month;
  /** Existing commitments (e.g. installments already taken); they use up bucket room. */
  commitments?: Commitment[];
}

export function QueueTimeline({
  items,
  profile,
  planState,
  today,
  startMonth,
  commitments = NO_COMMITMENTS,
}: QueueTimelineProps) {
  const schedule = scheduleQueue(items, profile, planState, commitments, today, startMonth);
  const scheduleByItemId = new Map(schedule.map((s) => [s.itemId, s.month]));
  const t = useTranslations("timeline");

  return (
    <ul>
      {items.map((item) => {
        const cooldown = item.isNeed ? null : cooldownStatus(item, today);
        const month = scheduleByItemId.get(item.id);

        return (
          <li key={item.id} data-testid={`timeline-${item.id}`}>
            <span>{item.name}</span>
            {cooldown?.active ? (
              <span data-testid={`cooldown-${item.id}`}>
                {t("coolingDownUntil", { date: cooldown.endsOn })}
              </span>
            ) : month ? (
              <span data-testid={`scheduled-month-${item.id}`}>{month}</span>
            ) : (
              <span data-testid={`not-affordable-${item.id}`}>{t("notAffordableYet")}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
