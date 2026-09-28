"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { hourlyNetIncome, monthlyNeeds, type QueueItem } from "@stoafi/core";
import { QueueForm } from "@/components/queue-form";
import { QueueList } from "@/components/queue-list";
import { QueuePreview } from "@/components/queue-preview";
import { QueueTimeline } from "@/components/queue-timeline";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { monthOf } from "@/lib/clock";
import { db } from "@/storage/instance";
import { removeQueueItem, saveQueueItem, saveQueueOrder } from "@/storage/queue-repo";
import { useAppStore } from "@/store";

function logFailure(what: string) {
  return (error: unknown) => console.error(`Could not ${what}`, error);
}

export default function QueuePage() {
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const queueItems = useAppStore((s) => s.queueItems);
  const setQueueItems = useAppStore((s) => s.setQueueItems);
  const currency = useAppStore((s) => s.currency);
  const commitments = useAppStore((s) => s.commitments);
  const setCommitments = useAppStore((s) => s.setCommitments);
  const today = useAppStore((s) => s.today);
  const decisions = useAppStore((s) => s.decisions);
  const setDecisions = useAppStore((s) => s.setDecisions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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
        <Link href="/profile">{t("goToProfile")}</Link>
      </main>
    );
  }

  const selectedItem = queueItems.find((i) => i.id === selectedId) ?? null;
  const editingItem = queueItems.find((i) => i.id === editingId);
  const needs = monthlyNeeds(profile);
  const income = profile.incomes.reduce((sum, i) => sum + i.monthly, 0);
  const nextOrder = queueItems.reduce((max, i) => Math.max(max, i.order + 1), 0);

  function handleSave(item: QueueItem) {
    const exists = queueItems.some((i) => i.id === item.id);
    setQueueItems(
      exists ? queueItems.map((i) => (i.id === item.id ? item : i)) : [...queueItems, item],
    );
    setEditingId(null);
    void saveQueueItem(db, item).catch(logFailure("save the queue item"));
  }

  function handleDelete(item: QueueItem) {
    setQueueItems(queueItems.filter((i) => i.id !== item.id));
    if (selectedId === item.id) setSelectedId(null);
    if (editingId === item.id) setEditingId(null);
    void removeQueueItem(db, item.id).catch(logFailure("delete the queue item"));
  }

  function handleReorder(next: QueueItem[]) {
    setQueueItems(next);
    void saveQueueOrder(db, next).catch(logFailure("save the queue order"));
  }

  return (
    <main>
      <h1>{t("title")}</h1>
      <QueueForm
        key={editingItem?.id ?? "new"}
        initial={editingItem}
        today={today}
        nextOrder={nextOrder}
        createId={() => crypto.randomUUID()}
        currency={currency}
        onSubmit={handleSave}
        onCancel={editingItem ? () => setEditingId(null) : undefined}
      />
      <QueueList
        items={queueItems}
        onItemsChange={handleReorder}
        onSelect={(item) => setSelectedId(item.id)}
        onEdit={(item) => setEditingId(item.id)}
        onDelete={handleDelete}
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
