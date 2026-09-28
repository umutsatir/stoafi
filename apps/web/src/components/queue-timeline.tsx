"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardContent className="pt-6">
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => {
            const cooldown = item.isNeed ? null : cooldownStatus(item, today);
            const month = scheduleByItemId.get(item.id);

            return (
              <li
                key={item.id}
                data-testid={`timeline-${item.id}`}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="font-medium">{item.name}</span>
                {cooldown?.active ? (
                  <Badge variant="outline" data-testid={`cooldown-${item.id}`}>
                    {t("coolingDownUntil", { date: cooldown.endsOn })}
                  </Badge>
                ) : month ? (
                  <Badge variant="secondary" data-testid={`scheduled-month-${item.id}`}>
                    {month}
                  </Badge>
                ) : (
                  <Badge variant="destructive" data-testid={`not-affordable-${item.id}`}>
                    {t("notAffordableYet")}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
