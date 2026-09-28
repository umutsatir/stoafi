"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { hourlyNetIncome, monthlyNeeds } from "@stoafi/core";
import { QueueList } from "@/components/queue-list";
import { QueuePreview } from "@/components/queue-preview";
import { QueueTimeline } from "@/components/queue-timeline";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { monthOf } from "@/lib/clock";
import { useAppStore } from "@/store";

export default function QueuePage() {
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const queueItems = useAppStore((s) => s.queueItems);
  const commitments = useAppStore((s) => s.commitments);
  const setCommitments = useAppStore((s) => s.setCommitments);
  const today = useAppStore((s) => s.today);
  const decisions = useAppStore((s) => s.decisions);
  const setDecisions = useAppStore((s) => s.setDecisions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const t = useTranslations("queue");
  const locale = useLocale() as Locale;
  // No dedicated sinking-funds screen exists yet; queue (dated purchase
  // planning) is the closest fit among Phase 7's screens for this lesson.
  const sinkingFundsLesson = getLessonCard("sinking-funds", locale);

  if (!profile || !planState) {
    return (
      <main>
        <h1>{t("title")}</h1>
        <p>{t("fillProfileAndPlanFirst")}</p>
      </main>
    );
  }

  const selectedItem = queueItems.find((i) => i.id === selectedId) ?? null;
  const needs = monthlyNeeds(profile);
  const income = profile.incomes.reduce((sum, i) => sum + i.monthly, 0);

  return (
    <main>
      <h1>{t("title")}</h1>
      <ul>
        {queueItems.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => setSelectedId(item.id)}>
              {item.name}
            </button>
          </li>
        ))}
      </ul>
      <QueueList
        items={queueItems}
        profile={profile}
        planState={planState}
        today={today}
        startMonth={monthOf(today)}
        hourlyNetIncome={hourlyNetIncome(profile)}
      />
      {sinkingFundsLesson && (
        <a
          href={`#lesson-${sinkingFundsLesson.id}`}
          aria-label={`${sinkingFundsLesson.id} lesson`}
          data-testid="lesson-link-sinking-funds"
        >
          {sinkingFundsLesson.title}
        </a>
      )}
      <h2>{t("timelineTitle")}</h2>
      <QueueTimeline
        items={queueItems}
        profile={profile}
        planState={planState}
        today={today}
        startMonth={monthOf(today)}
      />
      {selectedItem && (
        <QueuePreview
          item={selectedItem}
          profile={profile}
          planState={planState}
          commitments={commitments}
          month={monthOf(today)}
          income={income}
          monthlyNeeds={needs}
          installmentCapPct={0.2}
          onConfirm={(activeCommitment, breaches, guardBreachConfirmed) => {
            setCommitments([...commitments, activeCommitment]);
            setDecisions([
              ...decisions,
              {
                id: activeCommitment.id,
                queueItemRef: activeCommitment.source.refId,
                outcome: "bought",
                timestamp: new Date().toISOString(),
                amount: activeCommitment.payments[0]?.amount ?? 0,
                breachedRuleIds: breaches.map((b) => b.ruleId),
                guardBreachConfirmed,
              },
            ]);
            setSelectedId(null);
          }}
        />
      )}
    </main>
  );
}
