"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { QueueList } from "@/components/queue-list";
import { QueuePreview } from "@/components/queue-preview";
import { QueueTimeline } from "@/components/queue-timeline";
import { useAppStore } from "@/store";

export default function QueuePage() {
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const queueItems = useAppStore((s) => s.queueItems);
  const commitments = useAppStore((s) => s.commitments);
  const setCommitments = useAppStore((s) => s.setCommitments);
  const decisions = useAppStore((s) => s.decisions);
  const setDecisions = useAppStore((s) => s.setDecisions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const t = useTranslations("queue");

  if (!profile || !planState) {
    return (
      <main>
        <h1>{t("title")}</h1>
        <p>{t("fillProfileAndPlanFirst")}</p>
      </main>
    );
  }

  const selectedItem = queueItems.find((i) => i.id === selectedId) ?? null;
  const monthlyNeeds = profile.fixedExpenses
    .filter((e) => e.bucket === "needs")
    .reduce((sum, e) => sum + e.monthly, 0);
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
        today="2026-01-01"
        startMonth="2026-01"
        hourlyNetIncome={200}
      />
      <h2>{t("timelineTitle")}</h2>
      <QueueTimeline
        items={queueItems}
        profile={profile}
        planState={planState}
        today="2026-01-01"
        startMonth="2026-01"
      />
      {selectedItem && (
        <QueuePreview
          item={selectedItem}
          profile={profile}
          planState={planState}
          commitments={commitments}
          month="2026-01"
          income={income}
          monthlyNeeds={monthlyNeeds}
          installmentCapPct={0.2}
          onConfirm={(activeCommitment, breaches, guardBreachConfirmed) => {
            setCommitments([...commitments, activeCommitment]);
            setDecisions([
              ...decisions,
              {
                id: activeCommitment.id,
                queueItemRef: activeCommitment.source.refId,
                outcome: "bought",
                timestamp: "2026-01-01T00:00:00.000Z",
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
