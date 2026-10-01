"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DecisionSchema,
  activeQueueItems,
  hourlyNetIncome,
  monthlyNeeds,
  type Commitment,
  type Decision,
  type GuardBreach,
  type QueueItem,
  scheduleQueue,
} from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/ui/page";
import { QueueForm } from "@/components/queue-form";
import { QueueList } from "@/components/queue-list";
import { QueuePreview, type PurchaseChoice } from "@/components/queue-preview";
import { QueueTimeline } from "@/components/queue-timeline";
import { LessonLink } from "@/components/lesson-link";
import { monthOf } from "@/lib/clock";
import { db } from "@/storage/instance";
import { removeQueueItem, saveQueueItem, saveQueueOrder } from "@/storage/queue-repo";
import { putListItem } from "@/storage/repo";
import { useAppStore, useLedger } from "@/store";

function logFailure(what: string) {
  return (error: unknown) => console.error(`Could not ${what}`, error);
}

export default function QueuePage() {
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const queueItems = useAppStore((s) => s.queueItems);
  const setQueueItems = useAppStore((s) => s.setQueueItems);
  const currency = useAppStore((s) => s.currency);
  const cards = useAppStore((s) => s.cards);
  const commitments = useLedger();
  const today = useAppStore((s) => s.today);
  const decisions = useAppStore((s) => s.decisions);
  const setDecisions = useAppStore((s) => s.setDecisions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = useTranslations("queue");
  // No dedicated sinking-funds screen exists yet; queue (dated purchase
  // planning) is the closest fit among Phase 7's screens for this lesson.

  if (!profile || !planState) {
    return (
      <Page title={t("title")}>
        <Card>
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <p className="text-sm text-muted-foreground">{t("fillProfileAndPlanFirst")}</p>
            <Button asChild>
              <Link href="/income-expenses">{t("goToProfile")}</Link>
            </Button>
          </CardContent>
        </Card>
      </Page>
    );
  }

  const waitingItems = activeQueueItems(queueItems);
  const selectedItem = waitingItems.find((i) => i.id === selectedId) ?? null;
  const editingItem = waitingItems.find((i) => i.id === editingId);
  const needs = monthlyNeeds(profile, monthOf(today));
  const income = profile.incomes.reduce((sum, i) => sum + i.monthly, 0);
  const schedule = scheduleQueue(
    waitingItems,
    profile,
    planState,
    commitments,
    today,
    monthOf(today),
  );
  const suggestedMonth = selectedItem
    ? (schedule.find((r) => r.itemId === selectedItem.id)?.month ?? null)
    : undefined;
  const nextOrder = waitingItems.reduce((max, i) => Math.max(max, i.order + 1), 0);

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
    // `next` holds only the waiting items; bought-in-installments items keep their place in the store.
    setQueueItems([...next, ...queueItems.filter((i) => i.installmentPurchase)]);
    void saveQueueOrder(db, next).catch(logFailure("save the queue order"));
  }

  function handleConfirm(
    commitment: Commitment,
    breaches: GuardBreach[],
    guardBreachConfirmed: boolean,
    purchase: PurchaseChoice,
  ) {
    if (!selectedItem) return;
    const decision: Decision = {
      id: commitment.id,
      queueItemRef: selectedItem.id,
      outcome: "bought",
      timestamp: new Date().toISOString(),
      amount: commitment.payments.reduce((sum, p) => sum + p.amount, 0),
      breachedRuleIds: breaches.map((b) => b.ruleId),
      guardBreachConfirmed,
    };
    setDecisions([...decisions, decision]);
    void putListItem(db, "decisions", DecisionSchema, decision).catch(
      logFailure("save the decision"),
    );

    if (purchase.method === "cash") {
      // Cash is paid from the account by the user: it is a decision only, not a monthly commitment.
      handleDelete(selectedItem);
    } else {
      // Installments become an expense: the item stays, flagged, and its payments are derived from it.
      const bought: QueueItem = {
        ...selectedItem,
        installmentPurchase: { offer: purchase.offer, firstMonth: purchase.firstMonth },
      };
      setQueueItems(queueItems.map((i) => (i.id === bought.id ? bought : i)));
      void saveQueueItem(db, bought).catch(logFailure("save the installment purchase"));
    }
    setSelectedId(null);
  }

  function handleDecide(outcome: "skipped" | "postponed") {
    if (!selectedItem) return;
    const decision: Decision = {
      id: `${outcome}-${selectedItem.id}-${decisions.length}`,
      queueItemRef: selectedItem.id,
      outcome,
      timestamp: new Date().toISOString(),
      // What the item would have cost in cash: the money saved when skipped.
      amount: selectedItem.discountedCashPrice ?? selectedItem.price,
    };
    setDecisions([...decisions, decision]);
    void putListItem(db, "decisions", DecisionSchema, decision).catch(
      logFailure("save the decision"),
    );
    if (outcome === "skipped") handleDelete(selectedItem);
    setSelectedId(null);
  }

  return (
    <Page title={t("title")}>
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
        items={waitingItems}
        commitments={commitments}
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
      <LessonLink lessonId="sinking-funds" testId="lesson-link-sinking-funds" />
      <h2 className="text-lg font-semibold tracking-tight">{t("timelineTitle")}</h2>
      <QueueTimeline
        items={waitingItems}
        commitments={commitments}
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
          cards={cards}
          purchaseDate={today}
          suggestedMonth={suggestedMonth}
          onDecide={handleDecide}
          onConfirm={handleConfirm}
        />
      )}
    </Page>
  );
}
